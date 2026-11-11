type Bucket = { hits: number[] }

const buckets = new Map<string, Bucket>()

/** Простой in-memory лимитер: не даёт заспамить чувствительные ручки с одного IP. */
export function allowRequest(key: string, max: number, windowMs: number): boolean {
  const now = Date.now()
  const bucket = buckets.get(key) ?? { hits: [] }
  bucket.hits = bucket.hits.filter((at) => now - at < windowMs)
  if (bucket.hits.length >= max) {
    buckets.set(key, bucket)
    return false
  }
  bucket.hits.push(now)
  buckets.set(key, bucket)

  // периодически подчищаем пустые корзины, чтобы карта не росла бесконечно
  if (buckets.size > 5000) {
    for (const [name, item] of buckets) {
      if (!item.hits.some((at) => now - at < windowMs)) buckets.delete(name)
    }
  }
  return true
}
