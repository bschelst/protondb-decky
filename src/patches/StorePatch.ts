import { fetchNoCors } from '@decky/api'
import { findModuleExport } from '@decky/ui'
import { BehaviorSubject } from 'rxjs'
import { SettingsContext } from '../hooks/useSettings'

const FETCH_TIMEOUT_MS = 2000

// Helper function to add timeout to fetch requests
async function fetchWithTimeout(
  fetchPromise: Promise<Response>,
  timeoutMs: number = FETCH_TIMEOUT_MS
): Promise<Response> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
  })
  return Promise.race([fetchPromise, timeoutPromise])
}

// Store app ID observable - components can subscribe to this
export const storeAppId$ = new BehaviorSubject<string>('')

// Tier colors matching the library badge
const TIER_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  platinum: { bg: 'rgb(180, 199, 220)', text: '#000000', border: 'rgb(180, 199, 220)' },
  gold: { bg: 'rgb(207, 181, 59)', text: '#000000', border: 'rgb(207, 181, 59)' },
  silver: { bg: 'rgb(166, 166, 166)', text: '#000000', border: 'rgb(166, 166, 166)' },
  bronze: { bg: 'rgb(205, 127, 50)', text: '#000000', border: 'rgb(205, 127, 50)' },
  borked: { bg: 'rgb(255, 0, 0)', text: '#000000', border: 'rgb(255, 0, 0)' },
  pending: { bg: 'rgb(68, 68, 68)', text: '#FFFFFF', border: 'rgb(68, 68, 68)' }
}

// Track if we're currently in the store
let isStoreMounted = false
let storeWebSocket: WebSocket | null = null
let historyUnlisten: (() => void) | null = null
let messageId = 1

interface Tab {
  id: string
  url: string
  webSocketDebuggerUrl: string
}

// Find Steam's internal history object
const HistoryModule = findModuleExport((exp: any) => exp?.m_history !== undefined)
const History = HistoryModule?.m_history

// Track if WebSocket is ready for injection
let wsReady = false

// Inject badge into store page via WebSocket debugger
async function injectBadgeIntoStore(appId: string) {
  // Check if store badge is enabled in settings
  if (!SettingsContext.value.enableStoreBadge) {
    return
  }

  if (!storeWebSocket || storeWebSocket.readyState !== WebSocket.OPEN || !wsReady) {
    return
  }

  // Fetch ProtonDB data
  let tier = 'pending'
  let tierLabel = 'NO REPORT'

  try {
    const response = await fetchWithTimeout(
      fetchNoCors(`https://www.protondb.com/api/v1/reports/summaries/${appId}.json`)
    )
    if (response.ok) {
      const data = await response.json()
      if (data.tier) {
        tier = data.tier
        tierLabel = tier.toUpperCase()
      }
    }
  } catch (e) {
    // Silently fail - will show NO REPORT
  }

  // Get tier colors
  const tierColor = TIER_COLORS[tier] || TIER_COLORS.pending

  const injectScript = `
    (function() {
      // Remove existing badge if any
      const existing = document.getElementById('protondb-store-badge');
      if (existing) existing.remove();

      // Create badge container (matching library badge regular size styling)
      const badge = document.createElement('div');
      badge.id = 'protondb-store-badge';
      badge.style.cssText = 'position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); z-index: 999999; background: ${tierColor.bg}; padding: 6px 18px; border-radius: 8px; color: ${tierColor.text}; cursor: pointer; display: flex; align-items: center; width: max-content; height: max-content;';
      badge.innerHTML = '<span style="font-size: 28px; line-height: 28px;">⚛️</span><span style="margin-left: 10px; font-size: 24px; line-height: 24px; white-space: nowrap;">${tierLabel}</span>';
      badge.onclick = function() { window.open('https://www.protondb.com/app/${appId}', '_blank'); };
      document.body.appendChild(badge);
    })();
  `;

  storeWebSocket.send(JSON.stringify({
    id: messageId++,
    method: 'Runtime.evaluate',
    params: { expression: injectScript }
  }))
}

// Remove badge from store page
function removeBadgeFromStore() {
  if (!storeWebSocket || storeWebSocket.readyState !== WebSocket.OPEN) {
    return
  }

  const removeScript = `
    (function() {
      const badge = document.getElementById('protondb-store-badge');
      if (badge) badge.remove();
    })();
  `;

  storeWebSocket.send(JSON.stringify({
    id: messageId++,
    method: 'Runtime.evaluate',
    params: { expression: removeScript }
  }))
}

// Extract app ID from Steam store URL - only from app pages
function extractAppIdFromUrl(url: string): string {
  // Only match URLs that are specifically app pages
  if (!url.includes('https://store.steampowered.com/app/')) {
    return ''
  }
  const match = url.match(/\/app\/([\d]+)\/?/)
  return match?.[1] ?? ''
}

// Update the app ID from URL
function updateAppIdFromUrl(url: string) {
  const appId = extractAppIdFromUrl(url)
  if (storeAppId$.value !== appId) {
    storeAppId$.next(appId)

    // Inject or remove badge based on app ID
    if (appId) {
      injectBadgeIntoStore(appId)
    } else {
      removeBadgeFromStore()
    }
  }
}

// Connect to Chrome WebSocket debugger to listen for store navigation
async function connectToStoreDebugger(retries = 3): Promise<void> {
  if (retries <= 0 || !isStoreMounted) {
    return
  }

  try {
    // Fetch available browser tabs from debugger port
    const response = await fetchNoCors('http://localhost:8080/json')
    const tabs: Tab[] = await response.json()

    // Find the Steam store tab
    const storeTab = tabs.find((tab) => tab.url.includes('store.steampowered.com'))

    if (!storeTab) {
      // Store tab not found, retry after delay
      setTimeout(() => connectToStoreDebugger(retries - 1), 1000)
      return
    }

    // Initial app ID from current URL
    updateAppIdFromUrl(storeTab.url)

    // Connect to WebSocket debugger
    storeWebSocket = new WebSocket(storeTab.webSocketDebuggerUrl)

    storeWebSocket.onopen = (event) => {
      const ws = event.target as WebSocket
      // Enable page events to receive navigation notifications
      ws.send(JSON.stringify({ id: messageId++, method: 'Page.enable' }))
      // Enable runtime for script injection
      ws.send(JSON.stringify({ id: messageId++, method: 'Runtime.enable' }))

      // Mark WebSocket as ready after a short delay for Runtime to initialize
      setTimeout(() => {
        wsReady = true
        // Inject badge for initial URL if we have an app ID
        const currentAppId = storeAppId$.value
        if (currentAppId) {
          injectBadgeIntoStore(currentAppId)
        }
      }, 300)
    }

    storeWebSocket.onmessage = (event) => {
      if (!isStoreMounted) return

      try {
        const data = JSON.parse(event.data)
        // Listen for frame navigation events
        if (data.method === 'Page.frameNavigated' && data.params?.frame?.url) {
          // Delay injection to let the page load
          setTimeout(() => {
            updateAppIdFromUrl(data.params.frame.url)
          }, 500)
        }
      } catch (e) {
        // Silently ignore parse errors
      }
    }

    storeWebSocket.onerror = () => {
      if (isStoreMounted) {
        setTimeout(() => connectToStoreDebugger(retries - 1), 1000)
      }
    }

    storeWebSocket.onclose = () => {
      storeWebSocket = null
      wsReady = false
      // Reconnect if still mounted
      if (isStoreMounted) {
        setTimeout(() => connectToStoreDebugger(retries), 1000)
      }
    }
  } catch (e) {
    if (isStoreMounted) {
      setTimeout(() => connectToStoreDebugger(retries - 1), 1000)
    }
  }
}

// Disconnect from WebSocket debugger
function disconnectStoreDebugger() {
  // Remove badge before disconnecting
  removeBadgeFromStore()

  isStoreMounted = false
  wsReady = false
  storeAppId$.next('')

  if (storeWebSocket) {
    storeWebSocket.close()
    storeWebSocket = null
  }
}

// Handle location changes in Steam's router
function handleLocationChange(pathname: string) {
  if (pathname === '/steamweb') {
    // User entered the store view
    isStoreMounted = true
    connectToStoreDebugger()
  } else if (isStoreMounted) {
    // User left the store view
    disconnectStoreDebugger()
  }
}

// Initialize store patching
export function initStorePatch(): () => void {
  if (!History) {
    return () => {}
  }

  // Check initial location
  handleLocationChange(History.location?.pathname || '')

  // Listen for route changes
  historyUnlisten = History.listen((info: { pathname: string }) => {
    handleLocationChange(info.pathname)
  })

  // Return cleanup function
  return () => {
    if (historyUnlisten) {
      historyUnlisten()
      historyUnlisten = null
    }
    disconnectStoreDebugger()
  }
}
