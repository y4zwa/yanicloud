import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test, { after } from 'node:test'

const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'yanicloud-security-'))
process.env.DATA_DIR = dataDir
process.env.PORT = '0'
process.env.REGISTRATION_ENABLED = 'false'
process.env.TRUST_PROXY = 'false'

const { buildApp } = await import('../dist/index.js')
const { db } = await import('../dist/db.js')
const app = buildApp()
await app.ready()

const sharedDir = path.join(dataDir, 'files')
const password = 'secret123'

function json(method, url, payload, token) {
  return app.inject({
    method,
    url,
    payload,
    headers: token ? { authorization: `Bearer ${token}` } : {},
  })
}

function multipart(filename, content, type = 'text/plain') {
  const boundary = `----yanicloud${crypto.randomBytes(8).toString('hex')}`
  const body = Buffer.concat([
    Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\n` +
        `Content-Type: ${type}\r\n\r\n`
    ),
    Buffer.from(content),
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ])
  return { body, contentType: `multipart/form-data; boundary=${boundary}` }
}

async function upload(token, filename, content) {
  const form = multipart(filename, content)
  const res = await app.inject({
    method: 'POST',
    url: '/api/files/upload',
    payload: form.body,
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': form.contentType,
    },
  })
  return { status: res.statusCode, body: res.body, node: res.statusCode === 200 ? res.json().files[0] : null }
}

function signToken(payload, secretOverride) {
  const secret = secretOverride ?? fs.readFileSync(path.join(dataDir, '.jwt-secret'), 'utf8').trim()
  const enc = (value) => Buffer.from(JSON.stringify(value)).toString('base64url')
  const head = enc({ alg: 'HS256', typ: 'JWT' })
  const body = enc(payload)
  const sig = crypto.createHmac('sha256', secret).update(`${head}.${body}`).digest('base64url')
  return `${head}.${body}.${sig}`
}

/** Общая подготовка: админ создаётся один раз, дальше пользователи — через админку. */
let adminToken = null
let userSeq = 0

async function prepare() {
  if (!adminToken) {
    const res = await json('POST', '/api/auth/register', { username: 'admin', password })
    assert.equal(res.statusCode, 200, res.body)
    adminToken = res.json().token
  }

  const username = `user-${++userSeq}`
  const created = await json('POST', '/api/admin/users', { username, password }, adminToken)
  assert.equal(created.statusCode, 200, created.body)
  const userId = created.json().user.id

  const login = await json('POST', '/api/auth/login', { username, password })
  assert.equal(login.statusCode, 200, login.body)

  return { adminToken, userToken: login.json().token, userId, username }
}

test('чужой файл не виден: чтение, правка, удаление, листинг', { timeout: 30000 }, async () => {
  const { adminToken, userToken } = await prepare()

  const adminFile = await upload(adminToken, 'private.txt', 'admin only')
  assert.equal(adminFile.status, 200, adminFile.body)
  const folder = await json('POST', '/api/files/folders', { name: 'private-folder' }, adminToken)
  assert.equal(folder.statusCode, 200, folder.body)

  // прямое обращение по id — 404, а не 403: чужой узел не должен подтверждать своё существование
  for (const [method, url] of [
    ['GET', `/api/files/${adminFile.node.id}/stream`],
    ['GET', `/api/files/${adminFile.node.id}/details`],
    ['PATCH', `/api/files/${adminFile.node.id}`],
    ['DELETE', `/api/files/${adminFile.node.id}`],
    ['GET', `/api/files/${adminFile.node.id}/download`],
  ]) {
    const res = await json(method, url, method === 'PATCH' ? { name: 'hijack.txt' } : undefined, userToken)
    assert.equal(res.statusCode, 404, `${method} ${url} → ${res.statusCode} ${res.body}`)
  }

  // чужой parentId: листинг и загрузка в чужую папку
  const list = await json('GET', `/api/files?parent=${folder.json().id}`, undefined, userToken)
  assert.equal(list.statusCode, 400, list.body)

  const form = multipart('intruder.txt', 'x')
  const intoForeign = await app.inject({
    method: 'POST',
    url: `/api/files/upload?parent=${folder.json().id}`,
    payload: form.body,
    headers: { authorization: `Bearer ${userToken}`, 'content-type': form.contentType },
  })
  assert.equal(intoForeign.statusCode, 400, intoForeign.body)

  // чужая папка всё ещё пуста, файл туда не попал
  const foreignListing = await json('GET', `/api/files?parent=${folder.json().id}`, undefined, adminToken)
  assert.equal(foreignListing.statusCode, 200, foreignListing.body)
  assert.equal(foreignListing.json().items.length, 0, foreignListing.body)

  // имена на диске — uuid, а не пользовательские пути
  const stored = fs.readdirSync(sharedDir)
  assert.ok(stored.length > 0)
  for (const name of stored) assert.match(name, /^[0-9a-f-]{36}$/)
})

test('квота не пробивается загрузкой', { timeout: 30000 }, async () => {
  const { adminToken, userToken, userId } = await prepare()

  const setQuota = await json('PATCH', `/api/admin/users/${userId}`, { quotaBytes: 10 }, adminToken)
  assert.equal(setQuota.statusCode, 200, setQuota.body)

  const before = fs.readdirSync(sharedDir).length
  const big = await upload(userToken, 'big.bin', 'x'.repeat(4096))
  assert.equal(big.status, 507, big.body)
  assert.equal(fs.readdirSync(sharedDir).length, before, 'файл должен быть удалён с диска после отказа по квоте')

  const small = await upload(userToken, 'small.txt', 'ok')
  assert.equal(small.status, 200, small.body)
})

test('медиа-токен ограничен своим узлом и не подделывается', { timeout: 30000 }, async () => {
  const { adminToken } = await prepare()

  const a = await upload(adminToken, 'a.txt', 'A')
  const b = await upload(adminToken, 'b.txt', 'B')
  assert.equal(a.status, 200, a.body)
  assert.equal(b.status, 200, b.body)

  const urlRes = await json('POST', `/api/files/${a.node.id}/stream-url`, undefined, adminToken)
  assert.equal(urlRes.statusCode, 200, urlRes.body)
  const tokenOfA = new URL(urlRes.json().url, 'http://x').searchParams.get('t')
  assert.ok(tokenOfA)

  const own = await app.inject({ method: 'GET', url: `/api/files/${a.node.id}/stream?t=${tokenOfA}` })
  assert.equal(own.statusCode, 200)
  assert.equal(own.body, 'A')

  // токен от узла A на узле B — отказ
  const foreign = await app.inject({ method: 'GET', url: `/api/files/${b.node.id}/stream?t=${tokenOfA}` })
  assert.equal(foreign.statusCode, 401, foreign.body)

  // подпись чужим ключом
  const forged = signToken({ sub: '1', kind: 'stream', id: b.node.id }, 'not-the-secret')
  const forgedRes = await app.inject({ method: 'GET', url: `/api/files/${b.node.id}/stream?t=${forged}` })
  assert.equal(forgedRes.statusCode, 401, forgedRes.body)

  // просроченный токен
  const expired = signToken({ sub: '1', kind: 'stream', id: b.node.id, exp: 1 })
  const expiredRes = await app.inject({ method: 'GET', url: `/api/files/${b.node.id}/stream?t=${expired}` })
  assert.equal(expiredRes.statusCode, 401, expiredRes.body)
})

test('корзина: удаление, восстановление, окончательное удаление', { timeout: 30000 }, async () => {
  const { adminToken } = await prepare()

  const file = await upload(adminToken, 'trash-me.txt', 'bye')
  assert.equal(file.status, 200, file.body)
  const storedBefore = fs.readdirSync(sharedDir).length

  const deleted = await json('DELETE', `/api/files/${file.node.id}`, undefined, adminToken)
  assert.equal(deleted.statusCode, 200, deleted.body)
  assert.equal(fs.readdirSync(sharedDir).length, storedBefore, 'в корзине файл остаётся на диске')

  const trash = await json('GET', '/api/files/trash', undefined, adminToken)
  assert.equal(trash.statusCode, 200, trash.body)
  assert.ok(
    trash.json().items.some((item) => item.id === file.node.id),
    'файл должен быть в корзине'
  )

  const restored = await json('POST', `/api/files/${file.node.id}/restore`, undefined, adminToken)
  assert.equal(restored.statusCode, 200, restored.body)

  const list = await json('GET', '/api/files', undefined, adminToken)
  assert.ok(
    list.json().items.some((item) => item.id === file.node.id),
    'файл вернулся в список'
  )

  await json('DELETE', `/api/files/${file.node.id}`, undefined, adminToken)
  const permanent = await json('DELETE', `/api/files/${file.node.id}/permanent`, undefined, adminToken)
  assert.equal(permanent.statusCode, 200, permanent.body)
  assert.equal(fs.readdirSync(sharedDir).length, storedBefore - 1, 'окончательное удаление убирает файл с диска')
})

test('имя файла не выводит за пределы каталога пользователя', { timeout: 30000 }, async () => {
  const { adminToken } = await prepare()

  const nasty = await upload(adminToken, '../../evil.txt', 'pwned')
  assert.equal(nasty.status, 200, nasty.body)
  assert.ok(!nasty.node.name.includes('/') && !nasty.node.name.includes('\\'), nasty.node.name)

  // ни в родительских каталогах, ни рядом с data ничего не появилось
  const outside = [path.join(dataDir, 'evil.txt'), path.join(path.dirname(dataDir), 'evil.txt')]
  for (const p of outside) assert.equal(fs.existsSync(p), false, p)
  assert.equal(
    fs.readdirSync(sharedDir).every((name) => /^[0-9a-f-]{36}$/.test(name)),
    true
  )
})

test('акцентная тема хранится на аккаунте, а не в браузере', { timeout: 30000 }, async () => {
  const a = await prepare()
  const b = await prepare()

  // новый пользователь ещё не выбирал тему
  let res = await json('GET', '/api/auth/me', undefined, a.userToken)
  assert.equal(res.statusCode, 200, res.body)
  assert.equal(res.json().user.accentId, null)

  res = await json('PATCH', '/api/auth/preferences', { accentId: 'green' }, a.userToken)
  assert.equal(res.statusCode, 200, res.body)
  assert.equal(res.json().user.accentId, 'green')

  // тема переживает перелогин — то есть лежит в базе, а не в сессии
  const login = await json('POST', '/api/auth/login', { username: a.username, password })
  assert.equal(login.statusCode, 200, login.body)
  assert.equal(login.json().user.accentId, 'green')

  res = await json('GET', '/api/auth/me', undefined, a.userToken)
  assert.equal(res.json().user.accentId, 'green')

  // у второго пользователя своя тема
  res = await json('GET', '/api/auth/me', undefined, b.userToken)
  assert.equal(res.json().user.accentId, null, 'акцент не должен протекать между аккаунтами')

  // мусор вместо id отклоняем, а не пишем в базу
  res = await json('PATCH', '/api/auth/preferences', { accentId: 'rainbow; DROP TABLE users' }, a.userToken)
  assert.equal(res.statusCode, 400, res.body)
  res = await json('GET', '/api/auth/me', undefined, a.userToken)
  assert.equal(res.json().user.accentId, 'green', 'невалидное значение не должно менять тему')

  // и без авторизации настройки не меняются
  res = await json('PATCH', '/api/auth/preferences', { accentId: 'red' })
  assert.equal(res.statusCode, 401, res.body)
})

after(async () => {
  await app.close()
  db.close()
  fs.rmSync(dataDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 })
})
