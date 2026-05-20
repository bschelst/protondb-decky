import localforage from 'localforage'
import ProtonDBTier from '../../types/ProtonDBTier'
import {
  GatewayAnalysis,
  RecentReportsResponse,
  ProtonVersionsResponse
} from '../../types/gateway'

const STORAGE_KEY = 'protondb-badges-cache'
const REPORTS_STORAGE_KEY = 'protondb-reports-cache'

localforage.config({
  name: STORAGE_KEY
})

const reportsStore = localforage.createInstance({
  name: REPORTS_STORAGE_KEY
})

const VERSIONS_STORAGE_KEY = 'protondb-versions-cache'
const versionsStore = localforage.createInstance({
  name: VERSIONS_STORAGE_KEY
})

type CachedVersions = {
  data: ProtonVersionsResponse
  lastUpdated: string
}

type CachedReports = {
  data: RecentReportsResponse
  lastUpdated: string
}

type ProtonDBCache = {
  tier: ProtonDBTier
  linuxSupport: boolean
  analysis?: GatewayAnalysis
  lastUpdated: string
}

export async function updateCache(appId: string, newData: ProtonDBCache) {
  const oldCache = await localforage.getItem<ProtonDBCache>(appId)
  const newCache: ProtonDBCache = { ...oldCache, ...newData }
  await localforage.setItem(appId, newCache)
  return newCache
}

export function clearCache(appId?: string) {
  if (appId?.length) {
    localforage.removeItem(appId)
    reportsStore.removeItem(appId)
    versionsStore.removeItem(appId)
  } else {
    localforage.clear()
    reportsStore.clear()
    versionsStore.clear()
  }
}

export async function getCache(appId: string): Promise<ProtonDBCache | null> {
  const data = await localforage.getItem<ProtonDBCache>(appId)
  return data
}

export async function getAllCachedStatuses(): Promise<Map<string, string>> {
  const result = new Map<string, string>()
  await localforage.iterate<ProtonDBCache, void>((value, key) => {
    const status = value?.analysis?.working_status?.status
    if (status) {
      result.set(key, status)
    }
  })
  return result
}

const REPORTS_MAX_AGE_MS = 60 * 60 * 1000

export async function getCachedReports(
  appId: string
): Promise<RecentReportsResponse | null> {
  try {
    const cached = await reportsStore.getItem<CachedReports>(appId)
    if (!cached?.data?.reports) return null
    const age = Date.now() - new Date(cached.lastUpdated).getTime()
    if (age > REPORTS_MAX_AGE_MS) return null
    return cached.data
  } catch {
    return null
  }
}

export async function setCachedReports(
  appId: string,
  data: RecentReportsResponse
): Promise<void> {
  try {
    await reportsStore.setItem<CachedReports>(appId, {
      data,
      lastUpdated: new Date().toISOString()
    })
  } catch {
    /* storage full or unavailable — non-critical */
  }
}

export function clearReportsCache(): void {
  try {
    reportsStore.clear()
  } catch {
    /* ignore */
  }
}

export async function getCachedVersions(
  appId: string
): Promise<ProtonVersionsResponse | null> {
  try {
    const cached = await versionsStore.getItem<CachedVersions>(appId)
    if (!cached?.data?.versions) return null
    const age = Date.now() - new Date(cached.lastUpdated).getTime()
    if (age > REPORTS_MAX_AGE_MS) return null
    return cached.data
  } catch {
    return null
  }
}

export async function setCachedVersions(
  appId: string,
  data: ProtonVersionsResponse
): Promise<void> {
  try {
    await versionsStore.setItem<CachedVersions>(appId, {
      data,
      lastUpdated: new Date().toISOString()
    })
  } catch {
    /* storage full or unavailable — non-critical */
  }
}
