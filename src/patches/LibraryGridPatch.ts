import { fetchNoCors } from '@decky/api'
import { SettingsContext } from '../hooks/useSettings'
import { GATEWAY_BASE_URL, GATEWAY_API_KEY, appTypes } from '../constants'
import {
  getCache,
  updateCache,
  getAllCachedStatuses
} from '../cache/protobDbCache'

declare const appStore: any

const FETCH_TIMEOUT_MS = 2000
const BATCH_SIZE = 3
const BATCH_DELAY_MS = 3000
const SCAN_INTERVAL_MS = 3000
const GRID_CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000
const DOT_CLASS = 'protondb-grid-dot'
const COVER_SELECTOR = '._1pwP4eeP1zQD7PEgmsep0W'
const FOCUS_ONLY_STYLE_ID = 'protondb-grid-focus-only'
const APP_ID_FROM_SRC = /\/(?:assets|customimages)\/(\d+)/

const STATUS_COLORS: Record<string, string> = {
  working: 'rgb(74, 194, 100)',
  not_working: 'rgb(200, 30, 30)',
  unknown: 'rgb(166, 166, 166)'
}

declare const SteamUIStore: any

const statusCache = new Map<string, string>()
const resolveCache = new Map<string, string | null>()
const pendingIds = new Set<string>()
let isFetching = false
let scanInterval: ReturnType<typeof setInterval> | null = null
let lastPosition: string = ''

function cleanString(str: string) {
  return str
    .replace(/['"@&™®]/g, '')
    .toLowerCase()
    .trim()
}

function isSteamGame(gameId: number): boolean {
  try {
    const overview = appStore?.GetAppOverviewByGameID(gameId)
    return Boolean(appTypes[overview?.app_type as keyof typeof appTypes])
  } catch {
    return false
  }
}

function isSteamGameStrict(gameId: number): boolean {
  try {
    if (gameId >= 2000000000) return false
    const overview = appStore?.GetAppOverviewByGameID(gameId)
    return overview?.app_type === 1
  } catch {
    return false
  }
}

async function resolveToSteamAppId(rawId: string): Promise<string | null> {
  if (resolveCache.has(rawId)) {
    return resolveCache.get(rawId) ?? null
  }

  const num = parseInt(rawId)
  if (!isNaN(num) && isSteamGame(num)) {
    resolveCache.set(rawId, rawId)
    return rawId
  }

  try {
    const overview = appStore?.GetAppOverviewByGameID(num)
    const gameName = overview?.display_name
    if (!gameName) {
      resolveCache.set(rawId, null)
      return null
    }

    const res = await fetchWithTimeout(
      fetchNoCors(`https://steamcommunity.com/actions/SearchApps/${gameName}`)
    )

    if (res.status === 200) {
      const options = await res.json()
      if (!Array.isArray(options)) {
        resolveCache.set(rawId, null)
        return null
      }
      const cleaned = cleanString(gameName)
      const match = options.find(
        (o: any) => o?.name && cleanString(o.name) === cleaned
      )
      const steamId = match?.appid ?? null
      resolveCache.set(rawId, steamId)
      return steamId
    }
  } catch {
    // silently fail
  }

  resolveCache.set(rawId, null)
  return null
}

function getBigPictureDocument(): Document | null {
  try {
    return (
      SteamUIStore?.WindowStore?.GamepadUIMainWindowInstance?.m_BrowserWindow
        ?.document ?? null
    )
  } catch {
    return null
  }
}

function syncFocusOnlyStyle(
  bpDoc: Document | null = getBigPictureDocument()
) {
  if (!bpDoc) return

  const existing = bpDoc.getElementById(FOCUS_ONLY_STYLE_ID)
  if (SettingsContext.value.showLibraryIcons !== true) {
    existing?.remove()
    for (const dot of bpDoc.querySelectorAll(`.${DOT_CLASS}`)) dot.remove()
    return
  }
  if (SettingsContext.value.libraryIconsOnFocusOnly !== true) {
    existing?.remove()
    return
  }
  if (existing) return

  const style = bpDoc.createElement('style')
  style.id = FOCUS_ONLY_STYLE_ID
  style.textContent = `
${COVER_SELECTOR} .${DOT_CLASS} { opacity: 0; }
${COVER_SELECTOR}.gpfocuswithin .${DOT_CLASS},
${COVER_SELECTOR}:focus-within .${DOT_CLASS},
${COVER_SELECTOR}:hover .${DOT_CLASS} { opacity: 1; }
`
  bpDoc.head.appendChild(style)
}

async function fetchWithTimeout(
  promise: Promise<Response>,
  ms: number = FETCH_TIMEOUT_MS
): Promise<Response> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), ms)
    )
  ])
}

async function getStatusFromCache(
  appId: string
): Promise<{ status: string; stale: boolean } | null> {
  try {
    const cached = await getCache(appId)
    if (cached?.analysis?.working_status?.status) {
      const age = cached.lastUpdated
        ? Date.now() - new Date(cached.lastUpdated).getTime()
        : Infinity
      return {
        status: cached.analysis.working_status.status,
        stale: age > GRID_CACHE_MAX_AGE_MS
      }
    }
  } catch {
    // localforage read failed
  }
  return null
}

async function hasProtonDBReports(appId: string): Promise<boolean> {
  try {
    const res = await fetchWithTimeout(
      fetchNoCors(
        `https://www.protondb.com/api/v1/reports/summaries/${appId}.json`
      )
    )
    if (res.status === 200) {
      const data = await res.json()
      return !!data?.tier
    }
  } catch {
    // silently fail
  }
  return false
}

async function fetchAndCacheStatus(appId: string): Promise<string> {
  // Check if the game has ProtonDB reports before calling gateway
  const hasReports = await hasProtonDBReports(appId)
  if (!hasReports) {
    await cacheUnknown(appId)
    return 'unknown'
  }

  try {
    const url = `${GATEWAY_BASE_URL}/api/v1/analysis/${appId}?user_gpu_vendor=amd&user_proton_version=10`
    const res = await fetchWithTimeout(
      fetchNoCors(url, {
        method: 'GET',
        headers: { 'X-API-Key': GATEWAY_API_KEY }
      })
    )
    if (res.status === 200) {
      const data = await res.json()
      if (!data || typeof data !== 'object' || !data.working_status) {
        await cacheUnknown(appId)
        return 'unknown'
      }
      const status = data.working_status.status || 'unknown'
      const existing = await getCache(appId)
      await updateCache(appId, {
        tier: existing?.tier || ('pending' as any),
        linuxSupport: existing?.linuxSupport || false,
        analysis: data,
        lastUpdated: new Date().toISOString()
      })
      return status
    }
  } catch {
    // silently fail
  }
  await cacheUnknown(appId)
  return 'unknown'
}

async function cacheUnknown(appId: string) {
  try {
    const existing = await getCache(appId)
    if (!existing?.analysis) {
      await updateCache(appId, {
        tier: existing?.tier || ('pending' as any),
        linuxSupport: existing?.linuxSupport || false,
        analysis: { working_status: { status: 'unknown' } } as any,
        lastUpdated: new Date().toISOString()
      })
    }
  } catch {
    // localforage write failed
  }
}

function injectDot(bpDoc: Document, coverDiv: Element, status: string) {
  try {
    const existing = coverDiv.querySelector(`.${DOT_CLASS}`)
    if (existing) {
      existing.remove()
    }

    const container =
      (coverDiv.firstElementChild as HTMLElement) || (coverDiv as HTMLElement)
    container.style.position = 'relative'
    const color = STATUS_COLORS[status] || STATUS_COLORS.unknown
    const pos = SettingsContext.value.libraryIconPosition || 'bl'
    const posStyles: Record<string, string> = {
      bl: 'bottom:4px;left:4px;',
      tl: 'top:4px;left:4px;',
      tr: 'top:4px;right:4px;'
    }
    const wrapper = bpDoc.createElement('div')
    wrapper.className = DOT_CLASS
    wrapper.setAttribute('data-status', status)
    wrapper.style.cssText = `position:absolute;${posStyles[pos] || posStyles.bl}width:20px;height:20px;z-index:9999;pointer-events:none;background:rgba(0,0,0,0.7);border-radius:20px;padding:2px;display:flex;align-items:center;justify-content:center;`

    const ns = 'http://www.w3.org/2000/svg'
    const svg = bpDoc.createElementNS(ns, 'svg')
    svg.setAttribute('viewBox', '0 0 512 512')
    svg.setAttribute('width', '16')
    svg.setAttribute('height', '16')

    const circle = bpDoc.createElementNS(ns, 'circle')
    circle.setAttribute('cx', '256')
    circle.setAttribute('cy', '256')
    circle.setAttribute('r', '36')
    circle.setAttribute('fill', color)
    svg.appendChild(circle)

    const rotations = ['0', '60', '120']
    for (const rot of rotations) {
      const ellipse = bpDoc.createElementNS(ns, 'ellipse')
      ellipse.setAttribute('cx', '256')
      ellipse.setAttribute('cy', '256')
      ellipse.setAttribute('rx', '220')
      ellipse.setAttribute('ry', '88')
      ellipse.setAttribute('fill', 'none')
      ellipse.setAttribute('stroke', color)
      ellipse.setAttribute('stroke-width', '28')
      if (rot !== '0') {
        ellipse.setAttribute('transform', `rotate(${rot} 256 256)`)
      }
      svg.appendChild(ellipse)
    }

    wrapper.appendChild(svg)
    container.appendChild(wrapper)
  } catch {
    // silently fail - don't crash Decky
  }
}

async function processBatch(bpDoc: Document) {
  if (isFetching || pendingIds.size === 0) return
  isFetching = true

  const batch = Array.from(pendingIds).slice(0, BATCH_SIZE)
  batch.forEach((id) => pendingIds.delete(id))

  for (const rawId of batch) {
    try {
      const steamId = resolveCache.get(rawId) ?? rawId
      if (!steamId) continue

      const status = await fetchAndCacheStatus(steamId)
      statusCache.set(rawId, status)

      const cover =
        bpDoc.querySelector(`[data-id="${rawId}"] ${COVER_SELECTOR}`) ||
        bpDoc
          .querySelector(`img[src*="/assets/${rawId}/"]`)
          ?.closest(COVER_SELECTOR) ||
        bpDoc
          .querySelector(`img[src*="/customimages/${rawId}"]`)
          ?.closest(COVER_SELECTOR)
      if (cover) injectDot(bpDoc, cover, status)
    } catch {
      // skip failed fetch
    }
  }

  isFetching = false

  if (pendingIds.size > 0) {
    setTimeout(() => processBatch(bpDoc), BATCH_DELAY_MS)
  }
}

function getAppIdFromCover(cover: Element): string | null {
  const tile = cover.closest('[data-id]')
  if (tile) {
    const id = tile.getAttribute('data-id')
    const num = parseInt(id || '')
    if (!isNaN(num) && num > 0) {
      return id
    }
  }

  const img = cover.querySelector('img')
  if (img?.src) {
    const match = img.src.match(APP_ID_FROM_SRC)
    if (match) {
      const num = parseInt(match[1])
      if (!isNaN(num)) return match[1]
    }
  }

  return null
}

async function scanTiles() {
  try {
    if (SettingsContext.value.showLibraryIcons !== true) return

    const bpDoc = getBigPictureDocument()
    if (!bpDoc) return
    syncFocusOnlyStyle(bpDoc)

    const covers = bpDoc.querySelectorAll(COVER_SELECTOR)
    const needsDiskCheck: Array<{ rawId: string; cover: Element }> = []

    for (const cover of covers) {
      if (cover.querySelector(`.${DOT_CLASS}`)) continue

      const rawId = getAppIdFromCover(cover)
      if (!rawId) continue

      const memCached = statusCache.get(rawId)
      if (memCached) {
        injectDot(bpDoc, cover as Element, memCached)
        continue
      }

      needsDiskCheck.push({ rawId, cover: cover as Element })
    }

    for (const { rawId, cover } of needsDiskCheck) {
      try {
        const steamId = await resolveToSteamAppId(rawId)
        if (!steamId) continue
        const diskCached = await getStatusFromCache(steamId)
        if (diskCached) {
          statusCache.set(rawId, diskCached.status)
          injectDot(bpDoc, cover, diskCached.status)
          if (diskCached.stale && !pendingIds.has(rawId)) {
            pendingIds.add(rawId)
          }
          continue
        }
      } catch {
        /* ignore disk read failure */
      }

      if (!pendingIds.has(rawId)) {
        pendingIds.add(rawId)
      }
    }

    if (pendingIds.size > 0) {
      processBatch(bpDoc)
    }
  } catch {
    // silently fail - don't crash Decky
  }
}

let reinjectInterval: ReturnType<typeof setInterval> | null = null
let refreshCounter = 0
let refreshIntervalSecs = 60

async function refreshUnknownStatuses() {
  try {
    const unknowns: string[] = []
    statusCache.forEach((status, appId) => {
      if (status === 'unknown') unknowns.push(appId)
    })
    if (unknowns.length === 0) {
      refreshIntervalSecs = 300
      return
    }
    for (const appId of unknowns) {
      const disk = await getStatusFromCache(appId)
      if (disk && disk.status !== 'unknown') {
        statusCache.set(appId, disk.status)
      }
    }
    refreshIntervalSecs = 300
  } catch {
    /* ignore */
  }
}

function reinjectCached() {
  try {
    if (SettingsContext.value.showLibraryIcons !== true) return
    if (statusCache.size === 0) return

    refreshCounter++
    if (refreshCounter >= refreshIntervalSecs) {
      refreshCounter = 0
      refreshUnknownStatuses()
    }

    const bpDoc = getBigPictureDocument()
    if (!bpDoc) return

    const currentPos = SettingsContext.value.libraryIconPosition || 'bl'
    if (currentPos !== lastPosition) {
      lastPosition = currentPos
      const oldDots = bpDoc.querySelectorAll(`.${DOT_CLASS}`)
      for (const dot of oldDots) dot.remove()
    }

    const covers = bpDoc.querySelectorAll(COVER_SELECTOR)
    for (const cover of covers) {
      const appId = getAppIdFromCover(cover)
      if (!appId) continue
      const cached = statusCache.get(appId)
      if (!cached) continue
      const existing = cover.querySelector(`.${DOT_CLASS}`)
      if (existing) {
        const currentColor = STATUS_COLORS[cached] || STATUS_COLORS.unknown
        if (existing.getAttribute('data-status') === cached) continue
        existing.remove()
      }
      injectDot(bpDoc, cover as Element, cached)
    }
  } catch {
    // silently fail - don't crash Decky
  }
}

let prefetchAborted = false

async function prefetchLibrary() {
  try {
    if (!SettingsContext.value.showLibraryIcons) return

    const allApps: number[] = []
    try {
      const overview = appStore?.GetInstalledApps?.() ?? []
      for (const app of overview) {
        const id = app?.appid ?? app?.m_unAppID
        if (id && isSteamGameStrict(id)) allApps.push(id)
      }
    } catch {
      /* appStore not available */
    }

    if (allApps.length === 0) {
      try {
        const sections = appStore?.m_mapApps
        if (sections?.forEach) {
          sections.forEach((_val: unknown, key: number) => {
            if (isSteamGameStrict(key)) allApps.push(key)
          })
        }
      } catch {
        /* fallback failed */
      }
    }

    if (allApps.length === 0) return

    const uncached: string[] = []
    for (const id of allApps) {
      const key = String(id)
      const memStatus = statusCache.get(key)
      if (memStatus && memStatus !== 'unknown') continue
      const disk = await getStatusFromCache(key)
      if (disk && !disk.stale && disk.status !== 'unknown') {
        statusCache.set(key, disk.status)
        continue
      }
      uncached.push(key)
    }

    console.log(
      `[ProtonDB Grid] Prefetch: ${allApps.length} games, ${uncached.length} need fetching`
    )

    for (let i = 0; i < uncached.length; i += BATCH_SIZE) {
      if (prefetchAborted) return
      const batch = uncached.slice(i, i + BATCH_SIZE)
      for (const appId of batch) {
        if (prefetchAborted) return
        try {
          const status = await fetchAndCacheStatus(appId)
          statusCache.set(appId, status)
        } catch {
          /* skip */
        }
      }
      if (i + BATCH_SIZE < uncached.length) {
        await new Promise((r) => setTimeout(r, BATCH_DELAY_MS))
      }
    }

    console.log('[ProtonDB Grid] Prefetch complete')
  } catch {
    /* don't crash Decky */
  }
}

export function initLibraryGridPatch(): () => void {
  console.log('[ProtonDB Grid] Initializing library grid patch')

  const settingsSubscription = SettingsContext.subscribe(() =>
    syncFocusOnlyStyle()
  )

  reinjectInterval = setInterval(reinjectCached, 1000)

  prefetchAborted = false

  getAllCachedStatuses()
    .then((cached) => {
      cached.forEach((status, appId) => statusCache.set(appId, status))
      console.log(
        `[ProtonDB Grid] Pre-loaded ${cached.size} statuses from cache`
      )
      reinjectCached()
    })
    .catch(() => {})
    .finally(() => {
      scanInterval = setInterval(scanTiles, SCAN_INTERVAL_MS)
      setTimeout(scanTiles, 500)
      setTimeout(prefetchLibrary, 5000)
    })

  return () => {
    settingsSubscription.unsubscribe()
    const bpDoc = getBigPictureDocument()
    bpDoc?.getElementById(FOCUS_ONLY_STYLE_ID)?.remove()
    for (const dot of bpDoc?.querySelectorAll(`.${DOT_CLASS}`) ?? []) dot.remove()
    if (scanInterval) {
      clearInterval(scanInterval)
      scanInterval = null
    }
    if (reinjectInterval) {
      clearInterval(reinjectInterval)
      reinjectInterval = null
    }
    prefetchAborted = true
  }
}
