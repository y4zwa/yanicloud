import fs from 'node:fs'
import { execFile } from 'node:child_process'
import sharp from 'sharp'
import { parseFile } from 'music-metadata'

export type ThumbResult = 'ok' | 'none' | 'error'

async function sharpThumb(src: string | Buffer, dst: string): Promise<void> {
  await sharp(src).rotate().resize(640, 640, { fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 82 }).toFile(dst)
}

function extractVideoFrame(src: string, dst: string): Promise<void> {
  return new Promise((resolve, reject) => {
    execFile(
      'ffmpeg',
      ['-y', '-ss', '1', '-i', src, '-frames:v', '1', '-vf', 'scale=640:-2', '-q:v', '3', dst],
      { timeout: 60000 },
      (err) => {
        if (err) reject(err)
        else resolve()
      }
    )
  })
}

async function extractAudioCover(src: string, dst: string): Promise<boolean> {
  try {
    const meta = await parseFile(src)
    const pic = meta.common.picture?.[0]
    if (!pic || !pic.data) return false
    await sharpThumb(Buffer.from(pic.data), dst)
    return true
  } catch {
    return false
  }
}

// Returns 'ok' if a thumbnail was written, 'none' if not applicable (no cover), 'error' on failure.
export async function generateThumb(kind: 'image' | 'video' | 'audio', src: string, dst: string): Promise<ThumbResult> {
  try {
    if (kind === 'image') {
      await sharpThumb(src, dst)
      return 'ok'
    }
    if (kind === 'video') {
      await extractVideoFrame(src, dst)
      return 'ok'
    }
    if (kind === 'audio') {
      const hasCover = await extractAudioCover(src, dst)
      return hasCover ? 'ok' : 'none'
    }
    return 'none'
  } catch {
    return 'error'
  }
}

export function cleanup(path: string): void {
  fs.rmSync(path, { force: true })
}
