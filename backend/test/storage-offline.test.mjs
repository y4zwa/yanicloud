import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test, { after } from 'node:test'

const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'yanicloud-offline-test-'))
const disksDir = fs.mkdtempSync(path.join(os.tmpdir(), 'yanicloud-offline-disks-'))
process.env.DATA_DIR = dataDir
process.env.PORT = '0'
process.env.REGISTRATION_ENABLED = 'false'
process.env.TRUST_PROXY = 'false'

const { buildApp } = await import('../dist/index.js')
const { db } = await import('../dist/db.js')
const { purgeTrash } = await import('../dist/nodes.js')
const app = buildApp()
await app.ready()

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
    headers: { authorization: `Bearer ${token}`, 'content-type': form.contentType },
  })
  return { status: res.statusCode, body: res.body, node: res.statusCode === 200 ? res.json().files[0] : null }
}

let adminToken = null
let seq = 0

/** Пользователь с личным каталогом на «внешнем диске»: <disks>/disk-N — точка монтирования, YaniCloud — папка на нём. */
async function prepare() {
  if (!adminToken) {
    const res = await json('POST', '/api/auth/register', { username: 'admin', password })
    assert.equal(res.statusCode, 200, res.body)
    adminToken = res.json().token
  }
  const n = ++seq
  const mountPoint = path.join(disksDir, `disk-${n}`)
  const disk = path.join(mountPoint, 'YaniCloud')
  const username = `user-${n}`

  // «Диск» смонтирован и папка на нём есть. Создаём её сами, чтобы остальные тесты проверяли только
  // поведение при отключении, а не то, кто создал каталог (за это отвечает отдельный тест ниже).
  fs.mkdirSync(disk, { recursive: true })
  const created = await json('POST', '/api/admin/users', { username, password, storagePath: disk }, adminToken)
  assert.equal(created.statusCode, 200, created.body)

  const login = await json('POST', '/api/auth/login', { username, password })
  assert.equal(login.statusCode, 200, login.body)
  return {
    userToken: login.json().token,
    userId: created.json().user.id,
    mountPoint,
    disk,
    offline: `${mountPoint}-offline`,
  }
}

/** Диск отключили: на точке монтирования остаётся пустой каталог, как /mnt/hdd без диска. */
function unmount(d) {
  fs.renameSync(d.mountPoint, d.offline)
  fs.mkdirSync(d.mountPoint)
}

/** Диск вернули. rmdir упадёт, если за время отключения в точке монтирования что-то появилось. */
function mount(d) {
  fs.rmdirSync(d.mountPoint)
  fs.renameSync(d.offline, d.mountPoint)
}

function nodeExists(id) {
  return !!db.prepare('SELECT 1 FROM nodes WHERE id = ?').get(id)
}

test('диск отключён: окончательное удаление и автоочистка корзины не стирают записи', async (t) => {
  t.mock.method(console, 'error', () => {}) // purgeTrash логирует сбои — для теста это шум
  const d = await prepare()
  const file = await upload(d.userToken, 'precious.txt', 'important')
  assert.equal(file.status, 200, file.body)
  const key = db.prepare('SELECT storage_key FROM nodes WHERE id = ?').get(file.node.id).storage_key
  await json('DELETE', `/api/files/${file.node.id}`, undefined, d.userToken) // в корзину

  unmount(d)

  const res = await json('DELETE', `/api/files/${file.node.id}/permanent`, undefined, d.userToken)
  assert.equal(res.statusCode, 503, res.body)
  assert.ok(nodeExists(file.node.id), 'запись осталась в базе')

  assert.equal(purgeTrash(-1), 0, 'автоочистка ничего не удалила')
  assert.ok(nodeExists(file.node.id), 'запись пережила автоочистку')

  mount(d)
  assert.ok(fs.existsSync(path.join(d.disk, key)), 'файл на диске цел')

  const retry = await json('DELETE', `/api/files/${file.node.id}/permanent`, undefined, d.userToken)
  assert.equal(retry.statusCode, 200, retry.body)
  assert.equal(fs.existsSync(path.join(d.disk, key)), false, 'когда диск вернулся, файл удаляется как обычно')
  assert.equal(nodeExists(file.node.id), false)
})

test('диск отключён: загрузка и чтение отвечают 503 и не создают каталог на системном диске', async () => {
  const d = await prepare()
  const file = await upload(d.userToken, 'before.txt', 'uploaded while the disk was online')
  assert.equal(file.status, 200, file.body)

  unmount(d)

  const up = await upload(d.userToken, 'lost.txt', 'must not land on the system disk')
  assert.equal(up.status, 503, up.body)
  const download = await json('GET', `/api/files/${file.node.id}/download`, undefined, d.userToken)
  assert.equal(download.statusCode, 503, download.body)
  const info = await json('GET', '/api/storage', undefined, d.userToken)
  assert.equal(info.json().available, false)

  assert.deepEqual(fs.readdirSync(d.mountPoint), [], 'на точке монтирования ничего не появилось')

  mount(d)
  const after = await json('GET', `/api/files/${file.node.id}/download`, undefined, d.userToken)
  assert.equal(after.statusCode, 200, after.body)
  assert.equal(after.body, 'uploaded while the disk was online')
})

test('диск пользователя отключён: удалить пользователя нельзя, записи не пропадают', async () => {
  const d = await prepare()
  const file = await upload(d.userToken, 'keep.txt', 'keep me')
  assert.equal(file.status, 200, file.body)

  unmount(d)

  const res = await json('DELETE', `/api/admin/users/${d.userId}`, undefined, adminToken)
  assert.equal(res.statusCode, 503, res.body)
  assert.ok(db.prepare('SELECT 1 FROM users WHERE id = ?').get(d.userId), 'пользователь остался')
  assert.ok(nodeExists(file.node.id), 'записи о его файлах остались')

  mount(d)
  const retry = await json('DELETE', `/api/admin/users/${d.userId}`, undefined, adminToken)
  assert.equal(retry.statusCode, 200, retry.body)
  assert.deepEqual(fs.readdirSync(d.disk), [], 'файлы пользователя удалены с диска')
})

test('пользователь с личным каталогом: каталог создаётся при создании, а не молча при первой загрузке', async () => {
  await prepare() // гарантирует, что админ есть
  const disk = path.join(disksDir, 'fresh-disk', 'YaniCloud')

  const res = await json('POST', '/api/admin/users', { username: 'fresh', password, storagePath: disk }, adminToken)

  assert.equal(res.statusCode, 200, res.body)
  assert.ok(fs.statSync(disk).isDirectory(), 'личный каталог должен быть создан сразу')
})

test('личный каталог, который не создать: пользователь не создаётся, ответ 400', async () => {
  await prepare() // гарантирует, что админ есть
  const blocker = path.join(disksDir, 'not-a-dir')
  fs.writeFileSync(blocker, 'x')

  const res = await json(
    'POST',
    '/api/admin/users',
    { username: 'nodisk', password, storagePath: path.join(blocker, 'YaniCloud') },
    adminToken
  )
  assert.equal(res.statusCode, 400, res.body)
  assert.equal(db.prepare('SELECT 1 FROM users WHERE username = ?').get('nodisk'), undefined)
})

after(async () => {
  await app.close()
  db.close()
  for (const dir of [dataDir, disksDir]) {
    fs.rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 })
  }
})
