const MAX_CACHE_AGE_MS = 24 * 60 * 60 * 1000

export function isOutdated(lastUpdated?: string): boolean {
  const updatedAt = lastUpdated ? new Date(lastUpdated).getTime() : NaN
  // no or broken timestamp, refetch it instead of keep it forever
  if (Number.isNaN(updatedAt)) return true

  return Math.abs(Date.now() - updatedAt) > MAX_CACHE_AGE_MS
}
