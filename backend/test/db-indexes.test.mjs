import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test, { after } from 'node:test'

const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'yanicloud-index-test-'))
process.env.DATA_DIR = dataDir
process.env.PORT = '0'

const { db } = await import('../dist/db.js')
const { LIST_SQL } = await import('../dist/routes/files.js')

test('листинг папки: подсчёт детей идёт по индексу, а не сканом всей таблицы nodes', () => {
  // Подзапрос «сколько детей у папки» ищет по parent_id без user_id. Без подходящего индекса
  // он сканирует таблицу целиком на каждую строку листинга: на 200 тыс. узлов папка из 500
  // элементов открывалась около 3 секунд, с индексом — за единицы миллисекунд.
  const plan = db
    .prepare(`EXPLAIN QUERY PLAN ${LIST_SQL}`)
    .all(1, null)
    .map((row) => String(row.detail))

  const scansChildren = plan.filter((d) => /^SCAN\b/.test(d) && /\bc\b/.test(d))
  assert.deepEqual(scansChildren, [], `полный скан таблицы для подсчёта детей:\n${plan.join('\n')}`)

  assert.ok(
    plan.some((d) => /^SEARCH\b/.test(d) && /\bc\b/.test(d) && /\bINDEX\b/.test(d)),
    `подзапрос должен использовать индекс:\n${plan.join('\n')}`
  )
})

after(() => {
  db.close()
  fs.rmSync(dataDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 })
})
