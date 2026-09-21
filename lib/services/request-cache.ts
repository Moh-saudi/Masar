type CacheEntry<T> = {
  data: T
  expires: number
}

const cache = new Map<string, CacheEntry<unknown>>()

export async function cachedRequest<T>(
  key: string,
  loader: () => Promise<T>,
  ttl = 30000
): Promise<T> {
  const existing = cache.get(key)

  if (existing && existing.expires > Date.now()) {
    return existing.data as T
  }

  const data = await loader()

  cache.set(key, {
    data,
    expires: Date.now() + ttl,
  })

  return data
}

export function invalidateCache(key?: string) {
  if (key) {
    cache.delete(key)
    return
  }

  cache.clear()
}
