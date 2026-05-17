import { fetchNoCors } from '@decky/api'
import { GATEWAY_BASE_URL, GATEWAY_API_KEY } from '../constants'
import {
  GatewayAnalysis,
  ReportHistory,
  RecentReportsResponse
} from '../../types/gateway'

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

export async function getGameAnalysis(
  appId: string
): Promise<GatewayAnalysis | undefined> {
  try {
    // Build URL with user context (Steam Deck defaults)
    // Steam Deck uses AMD GPU and typically runs Proton 9
    const url = new URL(`${GATEWAY_BASE_URL}/api/v1/analysis/${appId}`)
    url.searchParams.append('user_gpu_vendor', 'amd')
    url.searchParams.append('user_proton_version', '10')

    const res = await fetchWithTimeout(
      fetchNoCors(url.toString(), {
        method: 'GET',
        headers: {
          'X-API-Key': GATEWAY_API_KEY
        }
      })
    )

    if (res.status === 200) {
      return await res.json()
    }
  } catch (error) {
    // silently fail analysis fetch failed:', error)
    return undefined
  }
  return undefined
}

export async function getReportHistory(
  appId: string
): Promise<ReportHistory | undefined> {
  try {
    const res = await fetchWithTimeout(
      fetchNoCors(`${GATEWAY_BASE_URL}/api/v1/reports/history/${appId}`, {
        method: 'GET',
        headers: {
          'X-API-Key': GATEWAY_API_KEY
        }
      }),
      5000
    )

    if (res.status === 200) {
      return await res.json()
    }
  } catch (error) {
    // silently fail report history fetch failed:', error)
    return undefined
  }
  return undefined
}

export async function getRecentReports(
  appId: string
): Promise<RecentReportsResponse | undefined> {
  try {
    const res = await fetchWithTimeout(
      fetchNoCors(`${GATEWAY_BASE_URL}/api/v1/reports/recent/${appId}`, {
        method: 'GET',
        headers: {
          'X-API-Key': GATEWAY_API_KEY
        }
      }),
      5000
    )

    if (res.status === 200) {
      return await res.json()
    }
  } catch (error) {
    // silently fail recent reports fetch failed:', error)
    return undefined
  }
  return undefined
}
