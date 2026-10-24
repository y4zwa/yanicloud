import { statfsSync } from 'node:fs'

export function diskInfo(dir: string): { total: number; free: number } {
  try {
    const s = statfsSync(dir)
    const block = Number(s.bsize || 0)
    if (!block) return { total: 0, free: 0 }
    return { total: Number(s.blocks) * block, free: Number(s.bavail) * block }
  } catch {
    return { total: 0, free: 0 }
  }
}
