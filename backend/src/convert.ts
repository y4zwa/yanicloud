import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { execFile } from 'node:child_process'
import { randomUUID } from 'node:crypto'

export function convertToPdf(src: string, dst: string, ext: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const tmp = path.join(os.tmpdir(), `lo_${randomUUID()}`)
    fs.mkdirSync(tmp, { recursive: true })
    const inputName = `input${ext}`
    const input = path.join(tmp, inputName)
    try {
      fs.copyFileSync(src, input)
    } catch (e) {
      fs.rmSync(tmp, { recursive: true, force: true })
      return reject(e as Error)
    }
    execFile(
      'soffice',
      [
        '--headless',
        '--nologo',
        '--nofirststartwizard',
        `-env:UserInstallation=file://${tmp}/profile`,
        '--convert-to',
        'pdf',
        '--outdir',
        tmp,
        input,
      ],
      { timeout: 180000, env: { ...process.env, HOME: tmp } },
      (err) => {
        if (err) {
          fs.rmSync(tmp, { recursive: true, force: true })
          return reject(err)
        }
        const produced = path.join(tmp, 'input.pdf')
        if (fs.existsSync(produced)) {
          try {
            fs.copyFileSync(produced, dst)
            fs.rmSync(tmp, { recursive: true, force: true })
            return resolve()
          } catch (e) {
            fs.rmSync(tmp, { recursive: true, force: true })
            return reject(e as Error)
          }
        }
        fs.rmSync(tmp, { recursive: true, force: true })
        reject(new Error('Преобразование не дало PDF'))
      }
    )
  })
}
