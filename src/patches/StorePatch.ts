import { fetchNoCors } from '@decky/api'
import { findModuleExport } from '@decky/ui'
import { BehaviorSubject } from 'rxjs'
import { SettingsContext } from '../hooks/useSettings'
import { GATEWAY_BASE_URL, GATEWAY_API_KEY } from '../constants'

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
const TIER_COLORS: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  platinum: {
    bg: 'rgb(180, 199, 220)',
    text: '#000000',
    border: 'rgb(180, 199, 220)'
  },
  gold: {
    bg: 'rgb(207, 181, 59)',
    text: '#000000',
    border: 'rgb(207, 181, 59)'
  },
  silver: {
    bg: 'rgb(166, 166, 166)',
    text: '#000000',
    border: 'rgb(166, 166, 166)'
  },
  bronze: {
    bg: 'rgb(205, 127, 50)',
    text: '#000000',
    border: 'rgb(205, 127, 50)'
  },
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

interface StoreOverlayPayload {
  appId: string
  tierLabel: string
  tierColor: { bg: string; text: string; border: string }
  trendBorderCss: string
  analysisData: string
  historyData: string
  recentReportsData: string
}

// Find Steam's internal history object
const HistoryModule = findModuleExport(
  (exp: any) => exp?.m_history !== undefined
)
const History = HistoryModule?.m_history

// Track if WebSocket is ready for injection
let wsReady = false

function fetchGatewayJson(url: string, timeoutMs = 5000): Promise<any> {
  return fetchWithTimeout(
    fetchNoCors(url, {
      method: 'GET',
      headers: { 'X-API-Key': GATEWAY_API_KEY }
    }),
    timeoutMs
  )
    .then((r) => (r.status === 200 ? r.json() : null))
    .catch(() => null)
}

function serializeForScript(value: unknown): string {
  return value ? JSON.stringify(value) : 'null'
}

function buildOverlayPreambleCode(payload: StoreOverlayPayload): string {
  return `
    const analysisData = ${payload.analysisData};
    const historyData = ${payload.historyData};
    const recentReportsData = ${payload.recentReportsData};
    var historyMonths = historyData && historyData.months ? historyData.months : null;
    var recentReports = recentReportsData && recentReportsData.reports ? recentReportsData.reports : null;

    function esc(s) {
      if (!s) return '';
      return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    var gameName = '—';
    try {
      var titleEl = document.querySelector('#appHubAppName') || document.querySelector('.apphub_AppName');
      if (titleEl) gameName = esc(titleEl.textContent.trim());
    } catch(e) {}
  `
}

function buildOverlayAnalysisHelpersCode(appId: string): string {
  return `
    function buildAnalysisTable(a) {
      if (!a) return '<p style="color:#aaa;">No analysis data available.</p>';
      var trend = a.trend || {};
      var confidence = a.confidence || {};
      var freshness = a.freshness || {};
      var stats = a.stats || {};
      var ws = a.working_status || null;
      var trendIcons = { improving: '🟢', declining: '🔴', stable: '⚪', unknown: '❓' };
      var wsIcons = { working: '✅', not_working: '❌', unknown: '❓' };
      function pct(v) { return v !== undefined && v !== null ? (v * 100).toFixed(1) + '%' : '—'; }
      var rows = [
        ['Game name', gameName],
        ['Game App ID', '${appId}'],
        ['Working status', ws ? (wsIcons[ws.status] || '❓') + ' ' + ws.status.replace('_', ' ') + ' (' + ws.confidence + ' certainty)' : '❓ Unknown'],
        ['— Recently broken', ws ? (ws.recently_broken ? 'Yes' : 'No') : '—'],
        ['— Timeframe', ws && ws.timeframe_days != null ? 'Last ' + ws.timeframe_days + ' days' : '—'],
        ['— Last positive report', ws && ws.last_positive_report_age != null ? ws.last_positive_report_age + ' days ago' : '—'],
        ['Confidence', (confidence.level || '—') + ' (' + (confidence.score || 0) + '/100)'],
        ['Confidence factors', (confidence.factors || []).join(', ') || '—'],
        ['Trend', trend.direction === 'unknown' ? '❓ Not enough recent data' : (trendIcons[trend.direction] || '❓') + ' ' + trend.direction],
        ['— Recent positive ratio', pct(trend.recent_positive_ratio)],
        ['— Older positive ratio', pct(trend.older_positive_ratio)],
        ['Freshness', (freshness.label || '—') + ' (' + (freshness.latest_report_age || 0) + ' days ago)'],
        ['Stale', freshness.is_stale ? 'Yes' : 'No'],
        ['Total reports', stats.total_reports || 0],
        ['Recent reports', stats.recent_reports || 0]
      ];
      var html = '<table style="width:100%;border-collapse:collapse;font-size:13px;color:#e0e0e0;">';
      rows.forEach(function(row, i) {
        var sub = row[0].startsWith('—');
        var bg = i % 2 === 0 ? 'rgba(255,255,255,0.04)' : 'transparent';
        var labelColor = sub ? '#888' : '#c0c0c0';
        var labelPad = sub ? '6px 10px 6px 20px' : '6px 10px';
        html += '<tr style="background:' + bg + '"><td style="padding:' + labelPad + ';color:' + labelColor + ';width:55%;font-weight:bold;vertical-align:top;">' + row[0] + '</td><td style="padding:6px 10px;vertical-align:top;">' + row[1] + '</td></tr>';
      });
      html += '</table>';
      return html;
    }

    function buildChartSvg(months) {
      if (!months || months.length === 0) return '<p style="color:#888;text-align:center;padding:40px 0;">No report data available</p>';
      var now = new Date();
      var cutoff = new Date(now.getFullYear() - 5, now.getMonth(), 1);
      var filtered = months.filter(function(m) {
        var parts = m.month.split('-');
        return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1) >= cutoff;
      });
      if (filtered.length === 0) return '<p style="color:#888;text-align:center;padding:40px 0;">No recent data</p>';
      var maxVal = 1;
      filtered.forEach(function(m) { maxVal = Math.max(maxVal, m.positive, m.negative); });
      var w = 500, h = 180, pad = 40, chartW = w - pad - 30, chartH = h - 30;
      function x(i) { return pad + (i / (filtered.length - 1 || 1)) * chartW; }
      function y(v) { return 10 + chartH - (v / maxVal) * chartH; }
      function line(data, key) {
        return data.map(function(d, i) { return (i === 0 ? 'M' : 'L') + x(i).toFixed(1) + ',' + y(d[key]).toFixed(1); }).join(' ');
      }
      function area(data, key) {
        var l = line(data, key);
        return l + ' L' + x(data.length - 1).toFixed(1) + ',' + (10 + chartH) + ' L' + pad + ',' + (10 + chartH) + ' Z';
      }
      var svg = '<svg viewBox="0 0 ' + w + ' ' + h + '" style="width:100%;height:220px;" xmlns="http://www.w3.org/2000/svg">';
      svg += '<defs><linearGradient id="gp" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#4caf50" stop-opacity="0.4"/><stop offset="100%" stop-color="#4caf50" stop-opacity="0.05"/></linearGradient>';
      svg += '<linearGradient id="gn" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#f44336" stop-opacity="0.4"/><stop offset="100%" stop-color="#f44336" stop-opacity="0.05"/></linearGradient></defs>';
      svg += '<path d="' + area(filtered, 'positive') + '" fill="url(#gp)"/>';
      svg += '<path d="' + line(filtered, 'positive') + '" fill="none" stroke="#4caf50" stroke-width="2"/>';
      svg += '<path d="' + area(filtered, 'negative') + '" fill="url(#gn)"/>';
      svg += '<path d="' + line(filtered, 'negative') + '" fill="none" stroke="#f44336" stroke-width="2"/>';
      var shortMonths = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      function fmtMonth(m) { var p = m.split('-'); return shortMonths[parseInt(p[1]) - 1] + " '" + p[0].slice(2); }
      var step = Math.max(1, Math.floor(filtered.length / 6));
      for (var i = 0; i < filtered.length; i += step) {
        svg += '<text x="' + x(i).toFixed(1) + '" y="' + (h - 2) + '" fill="#888" font-size="9" text-anchor="middle">' + fmtMonth(filtered[i].month) + '</text>';
      }
      for (var v = 0; v <= maxVal; v += Math.max(1, Math.ceil(maxVal / 4))) {
        svg += '<text x="' + (pad - 4) + '" y="' + (y(v) + 3).toFixed(1) + '" fill="#888" font-size="9" text-anchor="end">' + v + '</text>';
      }
      svg += '<circle cx="' + (w - 80) + '" cy="12" r="4" fill="#4caf50"/><text x="' + (w - 72) + '" y="16" fill="#ccc" font-size="11">Good</text>';
      svg += '<circle cx="' + (w - 35) + '" cy="12" r="4" fill="#f44336"/><text x="' + (w - 27) + '" y="16" fill="#ccc" font-size="11">Bad</text>';
      svg += '</svg>';
      return svg;
    }

    function buildReportsHtml(reports) {
      if (!reports || reports.length === 0) return '<p style="color:#888;text-align:center;padding:40px 0;">No recent reports available</p>';
      var html = '';
      reports.forEach(function(r) {
        var d = new Date(r.timestamp * 1000);
        var dateStr = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        var isPositive = r.rating === 'Gold' || r.rating === 'Platinum' || r.rating === 'Silver';
        var color = isPositive ? '#4ade80' : '#f87171';
        var label = isPositive ? '👍 Works' : '👎 Issues';
        var meta = [r.os ? 'OS: ' + esc(r.os) : null, r.proton_version ? 'Proton: ' + esc(r.proton_version) : null, r.is_steam_deck ? 'Steam Deck' : null].filter(Boolean).join(' · ') || '—';
        var rawNotes = r.notes ? (r.notes.length > 200 ? r.notes.substring(0, 200) + '…' : r.notes) : '';
        var notes = rawNotes ? esc(rawNotes) : 'No remarks shared';
        var notesColor = rawNotes ? '#ccc' : '#666';
        html += '<div style="background:rgba(255,255,255,0.04);border-radius:6px;padding:10px 12px;margin-bottom:8px;border-left:3px solid ' + color + ';">';
        html += '<div style="display:flex;justify-content:space-between;margin-bottom:4px;"><span style="font-weight:bold;color:' + color + ';font-size:13px;">' + label + '</span><span style="color:#888;font-size:11px;">' + dateStr + '</span></div>';
        html += '<div style="font-size:11px;color:#aaa;margin-bottom:4px;text-align:right;">' + meta + '</div>';
        html += '<div style="font-size:12px;color:' + notesColor + ';line-height:1.4;font-style:italic;">' + notes + '</div>';
        html += '</div>';
      });
      return html;
    }
  `
}

function buildOverlayUiCode(payload: StoreOverlayPayload): string {
  return `
    const wrapper = document.createElement('div');
    wrapper.id = 'protondb-store-badge';
    wrapper.style.cssText = 'position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); z-index: 999999; display: flex; align-items: center; gap: 8px;';

    const badge = document.createElement('div');
    badge.style.cssText = 'background: ${payload.tierColor.bg}; padding: 6px 18px; border-radius: 8px; color: ${payload.tierColor.text}; cursor: pointer; display: flex; align-items: center; width: max-content; height: max-content; ${payload.trendBorderCss}';
    badge.innerHTML = '<span style="font-size: 28px; line-height: 28px;">⚛️</span><span style="margin-left: 10px; font-size: 24px; line-height: 24px; white-space: nowrap;">${payload.tierLabel}</span>';
    badge.onclick = function() { window.open('https://www.protondb.com/app/${payload.appId}', '_blank'); };
    wrapper.appendChild(badge);

    if (analysisData) {
      const infoBtn = document.createElement('div');
      infoBtn.id = 'protondb-store-info-btn';
      infoBtn.style.cssText = 'background: rgb(166,166,166); padding: 6px 10px; border-radius: 8px; color: #000; cursor: pointer; display: flex; align-items: center; justify-content: center;';
      infoBtn.innerHTML = '<svg viewBox="0 0 512 512" width="28" height="28" fill="currentColor"><path d="M32 32v432a16 16 0 0 0 16 16h432" stroke="currentColor" stroke-width="32" fill="none" stroke-linecap="round"/><rect x="96" y="224" width="80" height="192" rx="8"/><rect x="224" y="128" width="80" height="288" rx="8"/><rect x="352" y="64" width="80" height="352" rx="8"/></svg>';
      infoBtn.title = 'Show analysis';
      infoBtn.onclick = function(e) {
        e.stopPropagation();
        var overlay = document.getElementById('protondb-store-analysis-overlay');
        if (overlay) { overlay.remove(); return; }
        var ov = document.createElement('div');
        ov.id = 'protondb-store-analysis-overlay';
        ov.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 9999999; background: #1a1d23; border-radius: 8px; padding: 20px; min-width: 380px; max-width: 90vw; max-height: 80vh; overflow-y: auto; box-shadow: 0 8px 32px rgba(0,0,0,0.6); color: #e0e0e0; outline: none;';
        var tabBtnStyle = 'flex:1;padding:8px 0;text-align:center;font-size:13px;font-weight:bold;cursor:pointer;border:none;border-radius:0;background:transparent;';
        var activeTabStyle = tabBtnStyle + 'color:#fff;border-bottom:2px solid #7ab3f0;background:rgba(255,255,255,0.1);';
        var inactiveTabStyle = tabBtnStyle + 'color:#888;border-bottom:2px solid transparent;';
        var header = '<div style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:12px;"><h3 style="margin:0;color:#fff;font-size:16px;font-weight:bold;">ProtonDB Analysis</h3><a href="https://protondb.schelstraete.org" target="_blank" style="color:#7ab3f0;font-size:11px;text-decoration:none;">protondb.schelstraete.org</a></div>';
        var tabs = '<div style="display:flex;margin-bottom:8px;"><button id="pdb-tab-details" style="' + activeTabStyle + '">Details</button><button id="pdb-tab-chart" style="' + inactiveTabStyle + '">Report History</button><button id="pdb-tab-reports" style="' + inactiveTabStyle + '">Recent Reports</button></div>';
        var detailsContent = '<div id="pdb-panel-details">' + buildAnalysisTable(analysisData) + '</div>';
        var chartContent = '<div id="pdb-panel-chart" style="display:none;"><p style="color:#888;text-align:center;padding:40px 0;">Loading...</p></div>';
        var reportsContent = '<div id="pdb-panel-reports" style="display:none;"><p style="color:#888;text-align:center;padding:40px 0;">Loading...</p></div>';
        var closeBtn = '<div style="margin-top:14px;display:flex;justify-content:flex-end;"><button id="protondb-store-overlay-close" style="background:rgb(100,120,150);color:#fff;border:none;border-radius:6px;padding:6px 18px;cursor:pointer;font-size:14px;">Close</button></div>';
        ov.innerHTML = header + tabs + detailsContent + chartContent + reportsContent + closeBtn;
        document.body.appendChild(ov);
        document.getElementById('protondb-store-overlay-close').onclick = function() { ov.remove(); };
        function switchTab(active) {
          var panels = ['details', 'chart', 'reports'];
          panels.forEach(function(p) {
            document.getElementById('pdb-panel-' + p).style.display = p === active ? '' : 'none';
            document.getElementById('pdb-tab-' + p).style.cssText = p === active ? activeTabStyle : inactiveTabStyle;
          });
        }
        function lazyLoadChart() {
          var panel = document.getElementById('pdb-panel-chart');
          if (!panel) return;
          if (historyMonths === null) {
            panel.innerHTML = '<p style="color:#888;text-align:center;padding:40px 0;">Failed to load data</p>';
            return;
          }
          panel.innerHTML = '<div style="font-size:12px;color:#888;margin-bottom:8px;text-align:center;">' + gameName + ' — Last 5 years</div>' + buildChartSvg(historyMonths);
        }
        function lazyLoadReports() {
          var panel = document.getElementById('pdb-panel-reports');
          if (!panel) return;
          if (recentReports === null) {
            panel.innerHTML = '<p style="color:#888;text-align:center;padding:40px 0;">Failed to load data</p>';
            return;
          }
          panel.innerHTML = buildReportsHtml(recentReports);
        }
        document.getElementById('pdb-tab-details').onclick = function() { switchTab('details'); };
        document.getElementById('pdb-tab-chart').onclick = function() { switchTab('chart'); lazyLoadChart(); };
        document.getElementById('pdb-tab-reports').onclick = function() { switchTab('reports'); lazyLoadReports(); };
      };
      wrapper.appendChild(infoBtn);
    }

    document.body.appendChild(wrapper);
  `
}

function buildStoreOverlayScript(payload: StoreOverlayPayload): string {
  return `
    (function() {
      const existing = document.getElementById('protondb-store-badge');
      if (existing) existing.remove();
      const existingOverlay = document.getElementById('protondb-store-analysis-overlay');
      if (existingOverlay) existingOverlay.remove();
${buildOverlayPreambleCode(payload)}
${buildOverlayAnalysisHelpersCode(payload.appId)}
${buildOverlayUiCode(payload)}
    })();
  `
}

// Inject badge into store page via WebSocket debugger
async function injectBadgeIntoStore(appId: string) {
  // Check if store badge is enabled in settings
  if (!SettingsContext.value.enableStoreBadge) {
    return
  }

  if (
    !storeWebSocket ||
    storeWebSocket.readyState !== WebSocket.OPEN ||
    !wsReady
  ) {
    return
  }

  // Fetch ProtonDB tier and gateway data in parallel so the injected page script
  // never has to make authenticated cross-origin requests.
  let tier = 'pending'
  let tierLabel = 'NO REPORT'
  let trendBorderCss = ''

  const [tierResult, analysisResult, historyResult, recentReportsResult] =
    await Promise.allSettled([
      fetchWithTimeout(
        fetchNoCors(
          `https://www.protondb.com/api/v1/reports/summaries/${appId}.json`
        )
      )
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
      fetchGatewayJson(
        `${GATEWAY_BASE_URL}/api/v1/analysis/${appId}?user_gpu_vendor=amd&user_proton_version=10`
      ),
      fetchGatewayJson(`${GATEWAY_BASE_URL}/api/v1/reports/history/${appId}`),
      fetchGatewayJson(`${GATEWAY_BASE_URL}/api/v1/reports/recent/${appId}`)
    ])

  if (tierResult.status === 'fulfilled' && tierResult.value?.tier) {
    tier = tierResult.value.tier
    tierLabel = tier.toUpperCase()
  }

  if (analysisResult.status === 'fulfilled' && analysisResult.value?.trend) {
    const direction = analysisResult.value.trend.direction
    if (direction === 'improving') {
      trendBorderCss =
        'border: 2px solid #4ade80; box-shadow: 0 0 6px #4ade8055;'
    } else if (direction === 'declining') {
      trendBorderCss =
        'border: 2px solid #f87171; box-shadow: 0 0 6px #f8717155;'
    }
  }

  // Get tier colors
  const tierColor = TIER_COLORS[tier] || TIER_COLORS.pending

  // Build analysis data for overlay (JSON-safe)
  const analysisData = serializeForScript(
    analysisResult.status === 'fulfilled' ? analysisResult.value : null
  )
  const historyData = serializeForScript(
    historyResult.status === 'fulfilled' ? historyResult.value : null
  )
  const recentReportsData = serializeForScript(
    recentReportsResult.status === 'fulfilled'
      ? recentReportsResult.value
      : null
  )

  const injectScript = buildStoreOverlayScript({
    appId,
    tierLabel,
    tierColor,
    trendBorderCss,
    analysisData,
    historyData,
    recentReportsData
  })

  storeWebSocket.send(
    JSON.stringify({
      id: messageId++,
      method: 'Runtime.evaluate',
      params: { expression: injectScript }
    })
  )
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
      const overlay = document.getElementById('protondb-store-analysis-overlay');
      if (overlay) overlay.remove();
    })();
  `

  storeWebSocket.send(
    JSON.stringify({
      id: messageId++,
      method: 'Runtime.evaluate',
      params: { expression: removeScript }
    })
  )
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
    const storeTab = tabs.find((tab) =>
      tab.url.includes('store.steampowered.com')
    )

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
