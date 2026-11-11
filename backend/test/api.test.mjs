import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test, { after } from 'node:test'

const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'yanicloud-test-'))
process.env.DATA_DIR = dataDir
process.env.PORT = '0'
process.env.REGISTRATION_ENABLED = 'false'
process.env.TRUST_PROXY = 'false'

const { buildApp } = await import('../dist/index.js')
const { db } = await import('../dist/db.js')
const app = buildApp()
await app.ready()

const sharedDir = path.join(dataDir, 'files')
const personalDir = path.join(dataDir, 'personal2')

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
  assert.equal(res.statusCode, 200, res.body)
  return res.json().files[0]
}

async function waitMigration(token, userId) {
  for (let i = 0; i < 100; i++) {
    const res = await json('GET', `/api/admin/users/${userId}/migration`, undefined, token)
    const migration = res.json().migration
    if (migration && !migration.active) return migration
    await new Promise((resolve) => setTimeout(resolve, 50))
  }
  throw new Error('миграция не завершилась')
}

function signToken(payload) {
  const secret = fs.readFileSync(path.join(dataDir, '.jwt-secret'), 'utf8').trim()
  const enc = (value) => Buffer.from(JSON.stringify(value)).toString('base64url')
  const head = enc({ alg: 'HS256', typ: 'JWT' })
  const body = enc(payload)
  const sig = crypto.createHmac('sha256', secret).update(`${head}.${body}`).digest('base64url')
  return `${head}.${body}.${sig}`
}

test('поиск, скоупы токенов и миграция пользователя', { timeout: 30000 }, async () => {
  const password = 'secret123'

  // --- первый пользователь становится админом, дальше регистрация закрыта ---
  let res = await json('POST', '/api/auth/register', { username: 'admin', password })
  assert.equal(res.statusCode, 200, res.body)
  const adminToken = res.json().token
  assert.equal(res.json().user.isAdmin, true)

  res = await json('POST', '/api/auth/register', { username: 'second', password })
  assert.equal(res.statusCode, 403, res.body)

  // --- медиа-токен не должен быть токеном аккаунта ---
  const media = signToken({ sub: '1', kind: 'thumb', id: 'x' })
  res = await json('GET', '/api/auth/me', undefined, media)
  assert.equal(res.statusCode, 401, res.body)

  // --- поиск: обычный запрос и запрос с % ---
  const folderName = `report-${Date.now()}`
  res = await json('POST', '/api/files/folders', { name: folderName }, adminToken)
  assert.equal(res.statusCode, 200, res.body)

  res = await json('GET', `/api/files/search?q=${encodeURIComponent(folderName)}`, undefined, adminToken)
  assert.equal(res.statusCode, 200, res.body)
  assert.equal(res.json().items.length, 1)

  res = await json('GET', '/api/files/search?q=100%25', undefined, adminToken)
  assert.equal(res.statusCode, 200, res.body)

  // --- второй пользователь и файлы в общем каталоге ---
  res = await json('POST', '/api/admin/users', { username: 'second', password }, adminToken)
  assert.equal(res.statusCode, 200, res.body)
  const secondId = res.json().user.id

  res = await json('POST', '/api/auth/login', { username: 'second', password })
  assert.equal(res.statusCode, 200, res.body)
  const secondToken = res.json().token

  const fileA = await upload(adminToken, 'a.txt', 'hello A')
  const fileB = await upload(secondToken, 'b.txt', 'hello B')
  assert.equal(fs.readdirSync(sharedDir).length, 2)

  // --- переезд второго пользователя не трогает файл первого ---
  res = await json('PATCH', `/api/admin/users/${secondId}`, { storagePath: personalDir }, adminToken)
  assert.equal(res.statusCode, 200, res.body)
  const migration = await waitMigration(adminToken, secondId)
  assert.equal(migration.status, 'done', JSON.stringify(migration))

  assert.equal(fs.readdirSync(sharedDir).length, 1)
  assert.equal(fs.readdirSync(personalDir).length, 1)

  res = await json('GET', `/api/files/${fileA.id}/stream`, undefined, adminToken)
  assert.equal(res.statusCode, 200)
  assert.equal(res.body, 'hello A')

  res = await json('GET', `/api/files/${fileB.id}/stream`, undefined, secondToken)
  assert.equal(res.statusCode, 200)
  assert.equal(res.body, 'hello B')

  // --- обратный переезд в непустой общий каталог ---
  res = await json('PATCH', `/api/admin/users/${secondId}`, { storagePath: null }, adminToken)
  assert.equal(res.statusCode, 200, res.body)
  const back = await waitMigration(adminToken, secondId)
  assert.equal(back.status, 'done', JSON.stringify(back))

  assert.equal(fs.readdirSync(sharedDir).length, 2)
  assert.equal(fs.readdirSync(personalDir).length, 0)

  res = await json('GET', `/api/files/${fileB.id}/stream`, undefined, secondToken)
  assert.equal(res.statusCode, 200)
  assert.equal(res.body, 'hello B')

  // маркеры завершённых миграций не должны оставаться
  const markersDir = path.join(dataDir, 'migrations')
  assert.equal(fs.existsSync(markersDir) ? fs.readdirSync(markersDir).length : 0, 0)
})

after(async () => {
  await app.close()
  db.close()
  fs.rmSync(dataDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 })
})
