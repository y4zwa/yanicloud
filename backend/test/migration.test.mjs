import assert from 'node:assert/strict'
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test, { after } from 'node:test'

const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'yanicloud-move-test-'))
process.env.DATA_DIR = dataDir
process.env.PORT = '0'

const { moveStorageRoot, resumeRootMove } = await import('../dist/routes/migrations.js')
const { db, getSetting } = await import('../dist/db.js')

const OLD = new Date('2021-03-04T05:06:07Z')

/** Каталог с файлами, у которых давняя дата изменения — как у настоящих пользовательских файлов. */
function makeRoot(name, files) {
  const dir = path.join(dataDir, name)
  fs.mkdirSync(dir, { recursive: true })
  for (const [file, content] of Object.entries(files)) {
    const p = path.join(dir, file)
    fs.writeFileSync(p, content)
    fs.utimesSync(p, OLD, OLD)
  }
  return dir
}

/**
 * Имитирует перенос между двумя дисками: rename из `from` в `to` отвечает EXDEV,
 * как между разными файловыми системами. Так тест не зависит от того, есть ли в окружении
 * второе устройство (в CI и при сборке образа /tmp и /dev/shm могут оказаться на одном).
 */
function simulateCrossDevice(t, from, to) {
  const realRename = fsp.rename
  const inside = (p, dir) => p === dir || path.dirname(p) === dir
  t.mock.method(fsp, 'rename', async (oldPath, newPath) => {
    if (inside(oldPath, from) && inside(newPath, to)) {
      throw Object.assign(new Error('EXDEV: cross-device link not permitted'), { code: 'EXDEV' })
    }
    return realRename(oldPath, newPath)
  })
}

test('перенос между устройствами: файлы целы, время изменения сохранено, мусора нет', async (t) => {
  const from = makeRoot('shared-from', { aaaa: 'first file', bbbb: 'second file' })
  const to = path.join(dataDir, 'shared-to')
  simulateCrossDevice(t, from, to)

  await moveStorageRoot(from, to)

  assert.deepEqual(fs.readdirSync(to).sort(), ['aaaa', 'bbbb'], 'в целевой папке только готовые файлы, без .mig-tmp')
  assert.equal(fs.readFileSync(path.join(to, 'aaaa'), 'utf8'), 'first file')
  assert.equal(fs.readFileSync(path.join(to, 'bbbb'), 'utf8'), 'second file')
  for (const name of ['aaaa', 'bbbb']) {
    const diff = Math.abs(fs.statSync(path.join(to, name)).mtimeMs - OLD.getTime())
    assert.ok(diff < 1000, `mtime файла ${name} должен сохраниться, расхождение ${diff} мс`)
  }
  assert.equal(fs.existsSync(from), false, 'исходный каталог убран')
})

test('повторный запуск после обрыва: готовая копия принимается, источник убирается', async (t) => {
  const from = makeRoot('resume-from', { cccc: 'data' })
  const to = makeRoot('resume-to', { cccc: 'data' }) // обрыв между копированием и удалением источника
  simulateCrossDevice(t, from, to)

  await moveStorageRoot(from, to)

  assert.equal(fs.readFileSync(path.join(to, 'cccc'), 'utf8'), 'data')
  assert.equal(fs.existsSync(from), false, 'источник не должен остаться дублем')
})

test('в целевой папке лежит другой файл с тем же именем: ничего не затираем и не пропускаем молча', async (t) => {
  const from = makeRoot('conflict-from', { dddd: 'original' })
  const to = makeRoot('conflict-to', { dddd: 'something else' })
  simulateCrossDevice(t, from, to)

  await assert.rejects(moveStorageRoot(from, to), /dddd/)

  assert.equal(fs.readFileSync(path.join(from, 'dddd'), 'utf8'), 'original', 'источник не тронут')
  assert.equal(fs.readFileSync(path.join(to, 'dddd'), 'utf8'), 'something else', 'чужой файл не затёрт')
})

test('переносить нечего: целевой каталог всё равно создаётся', async () => {
  // сервис сам внешние каталоги не создаёт, поэтому после смены storage_dir он должен уже существовать
  const from = path.join(dataDir, 'no-such-source')
  const to = path.join(dataDir, 'created-target')

  await moveStorageRoot(from, to)

  assert.ok(fs.statSync(to).isDirectory())
})

test('конфликт в целевой папке виден до переноса: ничего не переехало', async (t) => {
  const from = makeRoot('preflight-from', { a1: 'one', b2: 'two' })
  const to = makeRoot('preflight-to', { a1: 'different' })
  simulateCrossDevice(t, from, to)

  await assert.rejects(moveStorageRoot(from, to), /a1/)

  // раньше перенос падал на середине: часть файлов уже в новом каталоге, а storage_dir старый
  assert.equal(fs.readFileSync(path.join(from, 'b2'), 'utf8'), 'two')
  assert.equal(fs.existsSync(path.join(to, 'b2')), false)
})

test('прерванный перенос докручивается при старте и переключает storage_dir', async (t) => {
  const from = makeRoot('resume-boot-from', { eeee: 'payload' })
  const to = path.join(dataDir, 'resume-boot-to')
  fs.mkdirSync(to, { recursive: true })

  // состояние после обрыва: маркер записан, storage_dir всё ещё старый
  const markerDir = path.join(dataDir, 'migrations')
  fs.mkdirSync(markerDir, { recursive: true })
  const marker = path.join(markerDir, 'root-move.json')
  fs.writeFileSync(marker, JSON.stringify({ from, to }))
  simulateCrossDevice(t, from, to)

  await resumeRootMove()

  assert.equal(fs.readFileSync(path.join(to, 'eeee'), 'utf8'), 'payload')
  assert.equal(fs.existsSync(from), false, 'старый каталог убран')
  assert.equal(getSetting('storage_dir'), path.resolve(to), 'хранилище переключено на новый каталог')
  assert.equal(fs.existsSync(marker), false, 'маркер убран')
})

after(() => {
  db.close()
  fs.rmSync(dataDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 })
})
