import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test, { after } from 'node:test'

const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'yanicloud-hardening-'))
const publicDir = fs.mkdtempSync(path.join(os.tmpdir(), 'yanicloud-hardening-public-'))
fs.writeFileSync(path.join(publicDir, 'index.html'), '<!doctype html><title>YaniCloud</title>')

process.env.DATA_DIR = dataDir
process.env.PUBLIC_DIR = publicDir
process.env.PORT = '0'
process.env.REGISTRATION_ENABLED = 'false'
process.env.TRUST_PROXY = 'false'

const { buildApp } = await import('../dist/index.js')
const { db } = await import('../dist/db.js')
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

async function upload(token, filename, content, parent = null, type = 'text/plain') {
  const form = multipart(filename, content, type)
  const url = parent ? `/api/files/upload?parent=${parent}` : '/api/files/upload'
  const res = await app.inject({
    method: 'POST',
    url,
    payload: form.body,
    headers: { authorization: `Bearer ${token}`, 'content-type': form.contentType },
  })
  assert.equal(res.statusCode, 200, res.body)
  return res.json().files[0]
}

let adminToken = null
let adminId = null

async function ensureAdmin() {
  if (adminToken) return
  const res = await json('POST', '/api/auth/register', { username: 'admin', password })
  assert.equal(res.statusCode, 200, res.body)
  adminToken = res.json().token
  adminId = res.json().user.id
}

test('SPA отдаётся с CSP и X-Frame-Options', async () => {
  const res = await app.inject({ method: 'GET', url: '/' })
  assert.equal(res.statusCode, 200, res.body)
  assert.match(String(res.headers['content-type']), /text\/html/)
  assert.match(String(res.headers['content-security-policy']), /default-src 'self'/)
  assert.match(String(res.headers['content-security-policy']), /frame-ancestors 'self'/)
  assert.equal(res.headers['x-frame-options'], 'SAMEORIGIN')
  assert.equal(res.headers['x-content-type-options'], 'nosniff')
})

test('Range: bytes=-N отдаёт хвост файла, а не начало', async () => {
  await ensureAdmin()
  const file = await upload(adminToken, 'digits.txt', '0123456789')

  const url = (await json('POST', `/api/files/${file.id}/stream-url`, undefined, adminToken)).json().url
  const res = await app.inject({ method: 'GET', url, headers: { range: 'bytes=-3' } })

  assert.equal(res.statusCode, 206, res.body)
  assert.equal(res.body, '789')
  assert.equal(res.headers['content-range'], 'bytes 7-9/10')

  const head = await app.inject({ method: 'GET', url, headers: { range: 'bytes=2-4' } })
  assert.equal(head.body, '234')

  const tooFar = await app.inject({ method: 'GET', url, headers: { range: 'bytes=999-' } })
  assert.equal(tooFar.statusCode, 416, tooFar.body)
})

test('токен миниатюры не открывает download и stream', async () => {
  await ensureAdmin()
  const image = await upload(adminToken, 'pic.png', 'not really a png', null, 'image/png')

  const urls = (await json('POST', '/api/files/thumb-urls', { ids: [image.id] }, adminToken)).json().urls
  const thumbToken = new URL(urls[image.id], 'http://x').searchParams.get('t')
  assert.ok(thumbToken)

  const wrongDownload = await app.inject({ method: 'GET', url: `/api/files/${image.id}/download?t=${thumbToken}` })
  assert.equal(wrongDownload.statusCode, 401, wrongDownload.body)

  const wrongStream = await app.inject({ method: 'GET', url: `/api/files/${image.id}/stream?t=${thumbToken}` })
  assert.equal(wrongStream.statusCode, 401, wrongStream.body)

  const ownDownload = (await json('POST', `/api/files/${image.id}/download-url`, undefined, adminToken)).json().url
  const ok = await app.inject({ method: 'GET', url: ownDownload })
  assert.equal(ok.statusCode, 200, ok.body)
})

test('PATCH без тела не падает с 500', async () => {
  await ensureAdmin()
  const file = await upload(adminToken, 'notouch.txt', 'x')

  const res = await app.inject({
    method: 'PATCH',
    url: `/api/files/${file.id}`,
    headers: { authorization: `Bearer ${adminToken}` },
  })
  assert.equal(res.statusCode, 200, res.body)
  assert.equal(res.json().name, 'notouch.txt')
})

test('перенос в папку с таким же именем не создаёт дубль', async () => {
  await ensureAdmin()
  const rootFile = await upload(adminToken, 'same.txt', 'outer')
  const folder = (await json('POST', '/api/files/folders', { name: 'inner' }, adminToken)).json()
  await upload(adminToken, 'same.txt', 'inner one', folder.id)

  const moved = await json('PATCH', `/api/files/${rootFile.id}`, { parentId: folder.id }, adminToken)
  assert.equal(moved.statusCode, 200, moved.body)
  assert.equal(moved.json().parentId, folder.id)
  assert.notEqual(moved.json().name, 'same.txt')

  const list = (await json('GET', `/api/files?parent=${folder.id}`, undefined, adminToken)).json().items
  const names = list.map((n) => n.name)
  assert.equal(names.length, 2, names.join(', '))
  assert.equal(new Set(names).size, 2, `имена должны различаться: ${names.join(', ')}`)
})

test('восстановление папки не воскрешает файл, удалённый отдельно', async () => {
  await ensureAdmin()
  const folder = (await json('POST', '/api/files/folders', { name: 'box' }, adminToken)).json()
  const old = await upload(adminToken, 'old.txt', 'deleted before', folder.id)
  const together = await upload(adminToken, 'together.txt', 'deleted with the folder', folder.id)

  await json('DELETE', `/api/files/${old.id}`, undefined, adminToken) // в корзину отдельно
  await json('DELETE', `/api/files/${folder.id}`, undefined, adminToken) // папка целиком

  const restored = await json('POST', `/api/files/${folder.id}/restore`, undefined, adminToken)
  assert.equal(restored.statusCode, 200, restored.body)

  const row = (id) => db.prepare('SELECT deleted_at FROM nodes WHERE id = ?').get(id)
  assert.equal(row(together.id).deleted_at, null, 'файл, удалённый вместе с папкой, вернулся')
  assert.notEqual(row(old.id).deleted_at, null, 'файл, удалённый отдельно, должен остаться в корзине')
})

test('админ не может снять права администратора с себя', async () => {
  await ensureAdmin()
  const res = await json('PATCH', `/api/admin/users/${adminId}`, { isAdmin: false }, adminToken)
  assert.equal(res.statusCode, 400, res.body)
  const row = db.prepare('SELECT is_admin FROM users WHERE id = ?').get(adminId)
  assert.equal(row.is_admin, 1)
})

test('смена пароля отзывает старые токены', async () => {
  await ensureAdmin()
  const before = (await json('POST', '/api/auth/login', { username: 'admin', password })).json().token

  const changed = await json('PATCH', `/api/admin/users/${adminId}`, { password: 'newsecret456' }, adminToken)
  assert.equal(changed.statusCode, 200, changed.body)

  const old = await json('GET', '/api/files', undefined, before)
  assert.equal(old.statusCode, 401, old.body)

  const relogin = await json('POST', '/api/auth/login', { username: 'admin', password: 'newsecret456' })
  assert.equal(relogin.statusCode, 200, relogin.body)
  adminToken = relogin.json().token

  const fresh = await json('GET', '/api/files', undefined, adminToken)
  assert.equal(fresh.statusCode, 200, fresh.body)
})

test('токен удалённого пользователя перестаёт работать', async () => {
  await ensureAdmin()
  const created = await json('POST', '/api/admin/users', { username: 'tempuser', password: 'tempsecret' }, adminToken)
  assert.equal(created.statusCode, 200, created.body)
  const userId = created.json().user.id

  const login = await json('POST', '/api/auth/login', { username: 'tempuser', password: 'tempsecret' })
  const token = login.json().token
  assert.equal((await json('GET', '/api/files', undefined, token)).statusCode, 200)

  const removed = await json('DELETE', `/api/admin/users/${userId}`, undefined, adminToken)
  assert.equal(removed.statusCode, 200, removed.body)

  const after = await json('GET', '/api/files', undefined, token)
  assert.equal(after.statusCode, 401, after.body)
})

after(async () => {
  await app.close()
  db.close()
  for (const dir of [dataDir, publicDir]) {
    fs.rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 })
  }
})
