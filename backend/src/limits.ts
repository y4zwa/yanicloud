// Простой семафор для тяжёлых внешних процессов (soffice/ffmpeg),
// чтобы десяток одновременных превью не съел всю память.
export function createLimiter(max: number): <T>(task: () => Promise<T>) => Promise<T> {
  let active = 0
  const queue: Array<() => void> = []

  return async function run<T>(task: () => Promise<T>): Promise<T> {
    if (active >= max) {
      await new Promise<void>((resolve) => queue.push(resolve))
    }
    active++
    try {
      return await task()
    } finally {
      active--
      const next = queue.shift()
      if (next) next()
    }
  }
}
