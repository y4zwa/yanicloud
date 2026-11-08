import fs from 'node:fs'
import sharp from 'sharp'
import { parseFile } from 'music-metadata'

/** Достаёт встроенную обложку трека и сохраняет её как JPEG (до 2000 px). */
export async function extractCover(src: string, dst: string): Promise<boolean> {
  try {
    const meta = await parseFile(src)
    const pic = meta.common.picture?.[0]
    if (!pic?.data) return false
    await sharp(Buffer.from(pic.data))
      .rotate()
      .resize(2000, 2000, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 92 })
      .toFile(dst)
    return true
  } catch {
    fs.rmSync(dst, { force: true })
    return false
  }
}
