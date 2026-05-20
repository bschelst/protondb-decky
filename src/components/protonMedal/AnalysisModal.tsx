import {
  ConfirmModal,
  Focusable,
  Navigation,
  ScrollPanelGroup,
  ScrollPanel
} from '@decky/ui'
import React, {
  CSSProperties,
  FC,
  ReactNode,
  useEffect,
  useMemo,
  useState
} from 'react'
import {
  GatewayAnalysis,
  ReportHistory,
  RecentReport,
  RecentReportsResponse,
  ProtonVersionsResponse,
  ProtonVersionStat as GwVersionStat
} from '../../../types/gateway'
import {
  getReportHistory,
  getRecentReports,
  getProtonVersions
} from '../../actions/gateway'
import {
  getCachedReports,
  setCachedReports,
  getCachedVersions,
  setCachedVersions
} from '../../cache/protobDbCache'
import ReportChart from './ReportChart'

const CURRENT_PROTON_MAJOR = '10'

interface AnalysisModalProps {
  analysis: GatewayAnalysis
  appId: string
  closeModal?: () => void
}

const TREND_ICONS: Record<string, string> = {
  improving: '🟢',
  declining: '🔴',
  stable: '⚪',
  unknown: '❓'
}

const WORKING_STATUS_ICONS: Record<string, string> = {
  working: '✅',
  not_working: '❌',
  unknown: '❓'
}

function formatPercent(ratio: number | undefined): string {
  if (ratio === undefined || ratio === null) return '—'
  return `${(ratio * 100).toFixed(1)}%`
}

const rowStyle = (even: boolean): CSSProperties => ({
  display: 'flex',
  background: even ? 'rgba(255,255,255,0.04)' : 'transparent',
  fontSize: '13px',
  color: '#e0e0e0'
})

const labelStyle = (sub: boolean): CSSProperties => ({
  padding: sub ? '6px 10px 6px 20px' : '6px 10px',
  fontWeight: 'bold',
  color: sub ? '#888888' : '#c0c0c0',
  width: '220px',
  minWidth: '220px',
  flexShrink: 0
})

const valueStyle: CSSProperties = {
  padding: '6px 10px',
  flex: 1
}

type RowProps = {
  label: string
  value: ReactNode
  even: boolean
  sub?: boolean
}

const Row: FC<RowProps> = ({ label, value, even, sub }) => (
  <div style={rowStyle(even)}>
    <div style={labelStyle(!!sub)}>{label}</div>
    <div style={valueStyle}>{value}</div>
  </div>
)

const tabStyle = (active: boolean): CSSProperties => ({
  flex: 1,
  padding: '8px 0',
  textAlign: 'center',
  fontSize: '13px',
  fontWeight: 'bold',
  color: active ? '#fff' : '#888',
  background: active ? 'rgba(255,255,255,0.1)' : 'transparent',
  borderBottom: active ? '2px solid #7ab3f0' : '2px solid transparent',
  cursor: 'pointer',
  border: 'none',
  borderRadius: 0
})

function formatDate(timestamp: number): string {
  const d = new Date(timestamp * 1000)
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

function isPositiveRating(rating: string): boolean {
  return rating === 'Gold' || rating === 'Platinum' || rating === 'Silver'
}

const ReportCard: FC<{ report: RecentReport }> = ({ report }) => {
  const positive = isPositiveRating(report.rating)
  const color = positive ? '#4ade80' : '#f87171'
  const label = positive ? '👍 Works' : '👎 Issues'

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.04)',
        borderRadius: '6px',
        padding: '10px 12px',
        marginBottom: '8px',
        borderLeft: `3px solid ${color}`
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '4px'
        }}
      >
        <span
          style={{
            fontWeight: 'bold',
            color,
            fontSize: '13px'
          }}
        >
          {label}
        </span>
        <span style={{ color: '#888', fontSize: '11px' }}>
          {formatDate(report.timestamp)}
        </span>
      </div>
      <div
        style={{
          fontSize: '11px',
          color: '#aaa',
          marginBottom: '4px',
          textAlign: 'right'
        }}
      >
        {[
          report.os ? `OS: ${report.os}` : null,
          report.proton_version ? `Proton: ${report.proton_version}` : null,
          report.is_steam_deck ? 'Steam Deck' : null
        ]
          .filter(Boolean)
          .join(' · ') || '—'}
      </div>
      <div
        style={{
          fontSize: '12px',
          color: report.notes ? '#ccc' : '#666',
          lineHeight: '1.4',
          fontStyle: 'italic'
        }}
      >
        {report.notes
          ? report.notes.length > 200
            ? report.notes.slice(0, 200) + '…'
            : report.notes
          : 'No remarks shared'}
      </div>
    </div>
  )
}

function ratioColor(ratio: number): string {
  if (ratio >= 0.75) return '#4ade80'
  if (ratio >= 0.5) return '#facc15'
  return '#f87171'
}

function isCurrent(version: string): boolean {
  return (
    version === `Proton ${CURRENT_PROTON_MAJOR}` ||
    version === 'Proton Official'
  )
}

const VersionRow: FC<{ stat: GwVersionStat }> = ({ stat }) => {
  if (!stat?.version) return null
  const current = isCurrent(stat.version)
  const ratio = Number.isFinite(stat.positive_ratio) ? stat.positive_ratio : 0
  const color = ratioColor(ratio)
  const pct = Math.round(ratio * 100)
  const barWidth = `${Math.min(100, Math.max(0, pct))}%`
  const ts =
    typeof stat.latest_timestamp === 'number' ? stat.latest_timestamp : 0
  const age = ts > 0 ? Math.round((Date.now() / 1000 - ts) / 86400) : -1

  return (
    <div
      style={{
        background: current
          ? 'rgba(122,179,240,0.10)'
          : 'rgba(255,255,255,0.04)',
        borderRadius: '6px',
        padding: '8px 12px',
        marginBottom: '6px',
        borderLeft: `3px solid ${current ? '#7ab3f0' : color}`
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '4px'
        }}
      >
        <span
          style={{
            fontWeight: 'bold',
            fontSize: '13px',
            color: current ? '#7ab3f0' : '#e0e0e0'
          }}
        >
          {stat.version}
          {current && (
            <span
              style={{
                fontSize: '10px',
                color: '#7ab3f0',
                marginLeft: '6px',
                fontWeight: 'normal'
              }}
            >
              ★ Steam Deck default
            </span>
          )}
        </span>
        <span style={{ color: '#aaa', fontSize: '11px' }}>
          {stat.total_reports} report{stat.total_reports !== 1 ? 's' : ''}
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        <div
          style={{
            flex: 1,
            height: '6px',
            background: 'rgba(255,255,255,0.08)',
            borderRadius: '3px',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              width: barWidth,
              height: '100%',
              background: color,
              borderRadius: '3px',
              transition: 'width 0.3s ease'
            }}
          />
        </div>
        <span style={{ fontSize: '11px', color, minWidth: '32px' }}>
          {pct}%
        </span>
      </div>

      <div
        style={{
          fontSize: '10px',
          color: '#666',
          marginTop: '2px'
        }}
      >
        Latest: {age < 0 ? '—' : age === 0 ? 'today' : `${age}d ago`}
      </div>
    </div>
  )
}

export default function AnalysisModal({
  analysis,
  appId,
  closeModal
}: AnalysisModalProps) {
  const confidence = {
    score: analysis.confidence?.score ?? 0,
    level: analysis.confidence?.level ?? 'none',
    factors: Array.isArray(analysis.confidence?.factors)
      ? analysis.confidence.factors
      : []
  }
  const freshness = {
    latest_report_age: analysis.freshness?.latest_report_age ?? 0,
    label: analysis.freshness?.label ?? 'unknown',
    is_stale: analysis.freshness?.is_stale ?? true
  }
  const trend = {
    direction: analysis.trend?.direction ?? 'unknown',
    recent_positive_ratio: analysis.trend?.recent_positive_ratio,
    older_positive_ratio: analysis.trend?.older_positive_ratio
  }
  const stats = {
    total_reports: analysis.stats?.total_reports ?? 0,
    recent_reports: analysis.stats?.recent_reports ?? 0
  }
  const working_status = analysis.working_status
  const [gameName, setGameName] = useState<string>('—')
  const [activeTab, setActiveTab] = useState<
    'details' | 'chart' | 'reports' | 'versions'
  >('details')
  const [history, setHistory] = useState<ReportHistory | undefined>()
  const [historyLoading, setHistoryLoading] = useState(false)
  const [recentReports, setRecentReports] = useState<
    RecentReportsResponse | undefined
  >()
  const [reportsLoading, setReportsLoading] = useState(false)
  const [versionsData, setVersionsData] = useState<
    ProtonVersionsResponse | undefined
  >()
  const [versionsLoading, setVersionsLoading] = useState(false)
  const REPORTS_PAGE_SIZE = 5
  const [visibleReports, setVisibleReports] = useState(REPORTS_PAGE_SIZE)

  useEffect(() => {
    try {
      const overview = (window as any).appStore?.GetAppOverviewByAppID?.(
        parseInt(appId)
      )
      if (overview?.display_name) setGameName(overview.display_name)
    } catch {
      /* ignore */
    }
  }, [appId])

  useEffect(() => {
    if (activeTab === 'chart' && !history && !historyLoading) {
      setHistoryLoading(true)
      getReportHistory(appId)
        .then((data) => {
          setHistory(data)
          setHistoryLoading(false)
        })
        .catch(() => {
          setHistoryLoading(false)
        })
    }
    if (activeTab === 'reports' && !recentReports && !reportsLoading) {
      setReportsLoading(true)
      getCachedReports(appId)
        .then((cached) => {
          if (cached?.reports?.length) {
            setRecentReports(cached)
            setReportsLoading(false)
            return null
          }
          return getRecentReports(appId)
        })
        .then((fresh) => {
          if (fresh === null) return
          if (fresh?.reports?.length) {
            setCachedReports(appId, fresh)
          }
          setRecentReports(fresh ?? undefined)
          setReportsLoading(false)
        })
        .catch(() => {
          setReportsLoading(false)
        })
    }
    if (activeTab === 'versions' && !versionsData && !versionsLoading) {
      setVersionsLoading(true)
      getCachedVersions(appId)
        .then((cached) => {
          if (cached?.versions?.length) {
            setVersionsData(cached)
            setVersionsLoading(false)
            return null
          }
          return getProtonVersions(appId)
        })
        .then((fresh) => {
          if (fresh === null) return
          if (fresh?.versions?.length) {
            setCachedVersions(appId, fresh)
          }
          setVersionsData(fresh ?? undefined)
          setVersionsLoading(false)
        })
        .catch(() => {
          setVersionsLoading(false)
        })
    }
  }, [activeTab])

  const trendIcon = TREND_ICONS[trend.direction] ?? '❓'
  const workingIcon = working_status
    ? (WORKING_STATUS_ICONS[working_status.status] ?? '❓')
    : '❓'

  const rows: Array<{ label: string; value: ReactNode; sub?: boolean }> = [
    { label: 'Game name', value: gameName },
    { label: 'Game App ID', value: appId },
    {
      label: 'Working status',
      value: working_status?.status
        ? `${workingIcon} ${working_status.status.replace('_', ' ')} (${working_status.confidence ?? 'unknown'} certainty)`
        : '❓ Unknown'
    },
    {
      label: '— Recently broken',
      value: working_status
        ? working_status.recently_broken
          ? 'Yes'
          : 'No'
        : '—',
      sub: true
    },
    {
      label: '— Timeframe',
      value:
        working_status?.timeframe_days != null
          ? `Last ${working_status.timeframe_days} days`
          : '—',
      sub: true
    },
    {
      label: '— Last positive report',
      value:
        working_status?.last_positive_report_age != null
          ? `${working_status.last_positive_report_age} days ago`
          : '—',
      sub: true
    },
    {
      label: 'Confidence',
      value: `${confidence.level} (${confidence.score}/100)`
    },
    {
      label: 'Confidence factors',
      value: confidence.factors.length > 0 ? confidence.factors.join(', ') : '—'
    },
    {
      label: 'Trend',
      value:
        trend.direction === 'unknown'
          ? '❓ Not enough recent data'
          : `${trendIcon} ${trend.direction.charAt(0).toUpperCase() + trend.direction.slice(1)}`
    },
    {
      label: '— Recent positive ratio',
      value: formatPercent(trend.recent_positive_ratio),
      sub: true
    },
    {
      label: '— Older positive ratio',
      value: formatPercent(trend.older_positive_ratio),
      sub: true
    },
    {
      label: 'Freshness',
      value: `${freshness.label} (${freshness.latest_report_age} days ago)`
    },
    {
      label: 'Stale',
      value: freshness.is_stale ? 'Yes' : 'No'
    },
    {
      label: 'Total reports',
      value: stats.total_reports
    },
    {
      label: 'Recent reports',
      value: stats.recent_reports
    }
  ]

  return (
    <ConfirmModal
      strTitle=" "
      strOKButtonText="Close"
      bAlertDialog
      onOK={closeModal}
      onCancel={closeModal}
      bHideCloseIcon={false}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginTop: '-32px',
          marginBottom: '8px'
        }}
      >
        <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff' }}>
          ProtonDB Analysis
        </span>
        <a
          href="https://protondb.schelstraete.org/status"
          style={{
            color: '#7ab3f0',
            fontSize: '11px',
            textDecoration: 'none'
          }}
          onClick={() =>
            Navigation.NavigateToExternalWeb(
              'https://protondb.schelstraete.org/status'
            )
          }
        >
          protondb.schelstraete.org
        </a>
      </div>

      <Focusable
        style={{ display: 'flex', marginBottom: '8px' }}
        //@ts-ignore
        flow-children="row"
      >
        <Focusable
          style={tabStyle(activeTab === 'details')}
          onClick={() => setActiveTab('details')}
          onActivate={() => setActiveTab('details')}
        >
          Details
        </Focusable>
        <Focusable
          style={tabStyle(activeTab === 'chart')}
          onClick={() => setActiveTab('chart')}
          onActivate={() => setActiveTab('chart')}
        >
          Report History
        </Focusable>
        <Focusable
          style={tabStyle(activeTab === 'reports')}
          onClick={() => setActiveTab('reports')}
          onActivate={() => setActiveTab('reports')}
        >
          Recent Reports
        </Focusable>
        <Focusable
          style={tabStyle(activeTab === 'versions')}
          onClick={() => setActiveTab('versions')}
          onActivate={() => setActiveTab('versions')}
        >
          Proton Versions
        </Focusable>
      </Focusable>

      {activeTab === 'details' && (
        <ScrollPanelGroup>
          <ScrollPanel>
            <Focusable
              style={{ padding: '4px' }}
              //@ts-ignore
              flow-children="column"
            >
              {rows.map((row, i) => (
                <Focusable
                  key={row.label}
                  onFocus={(e: React.FocusEvent) =>
                    (e.target as HTMLElement).scrollIntoView({
                      behavior: 'smooth',
                      block: 'nearest'
                    })
                  }
                >
                  <Row
                    label={row.label}
                    value={row.value}
                    even={i % 2 === 0}
                    sub={row.sub}
                  />
                </Focusable>
              ))}
            </Focusable>
          </ScrollPanel>
        </ScrollPanelGroup>
      )}

      {activeTab === 'chart' && (
        <div style={{ padding: '4px' }}>
          <div
            style={{
              fontSize: '12px',
              color: '#888',
              marginBottom: '8px',
              textAlign: 'center'
            }}
          >
            {gameName} — Last 5 years
          </div>
          {historyLoading ? (
            <div
              style={{
                color: '#888',
                textAlign: 'center',
                padding: '40px 0'
              }}
            >
              Loading...
            </div>
          ) : history ? (
            <ReportChart months={history.months} />
          ) : (
            <div
              style={{
                color: '#888',
                textAlign: 'center',
                padding: '40px 0'
              }}
            >
              Failed to load report history
            </div>
          )}
        </div>
      )}

      {activeTab === 'reports' && (
        <div style={{ padding: '4px' }}>
          {reportsLoading ? (
            <div
              style={{
                color: '#888',
                textAlign: 'center',
                padding: '40px 0'
              }}
            >
              Loading...
            </div>
          ) : recentReports?.reports?.length ? (
            <ScrollPanelGroup>
              <ScrollPanel>
                <Focusable
                  style={{ padding: '4px' }}
                  //@ts-ignore
                  flow-children="column"
                >
                  {recentReports.reports
                    .slice(0, visibleReports)
                    .map((report, i) => (
                      <Focusable
                        key={i}
                        onFocus={(e: React.FocusEvent) =>
                          (e.target as HTMLElement).scrollIntoView({
                            behavior: 'smooth',
                            block: 'nearest'
                          })
                        }
                      >
                        <ReportCard report={report} />
                      </Focusable>
                    ))}
                  {visibleReports < recentReports.reports.length && (
                    <Focusable
                      style={{
                        textAlign: 'center',
                        padding: '10px 0',
                        fontSize: '12px',
                        color: '#7ab3f0',
                        cursor: 'pointer',
                        background: 'rgba(122,179,240,0.08)',
                        borderRadius: '6px',
                        marginTop: '4px'
                      }}
                      onClick={() =>
                        setVisibleReports((p) =>
                          Math.min(
                            p + REPORTS_PAGE_SIZE,
                            recentReports.reports.length
                          )
                        )
                      }
                      onActivate={() =>
                        setVisibleReports((p) =>
                          Math.min(
                            p + REPORTS_PAGE_SIZE,
                            recentReports.reports.length
                          )
                        )
                      }
                    >
                      Show more ({recentReports.reports.length - visibleReports}{' '}
                      remaining)
                    </Focusable>
                  )}
                </Focusable>
              </ScrollPanel>
            </ScrollPanelGroup>
          ) : (
            <div
              style={{
                color: '#888',
                textAlign: 'center',
                padding: '40px 0'
              }}
            >
              No recent reports available
            </div>
          )}
        </div>
      )}

      {activeTab === 'versions' && (
        <div style={{ padding: '4px' }}>
          {versionsLoading ? (
            <div
              style={{
                color: '#888',
                textAlign: 'center',
                padding: '40px 0'
              }}
            >
              Loading...
            </div>
          ) : versionsData?.versions?.length ? (
            <ScrollPanelGroup>
              <ScrollPanel>
                <Focusable
                  style={{ padding: '4px' }}
                  //@ts-ignore
                  flow-children="column"
                >
                  <div
                    style={{
                      fontSize: '11px',
                      color: '#888',
                      marginBottom: '8px',
                      textAlign: 'center'
                    }}
                  >
                    {versionsData.total_reports} reports across all versions
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '10px',
                      color: '#666',
                      padding: '0 12px 4px',
                      marginBottom: '2px',
                      borderBottom: '1px solid rgba(255,255,255,0.06)'
                    }}
                  >
                    <span>Version</span>
                    <span>% positive ratings</span>
                  </div>
                  {versionsData.versions.map((stat) => (
                    <Focusable
                      key={stat.version}
                      onFocus={(e: React.FocusEvent) =>
                        (e.target as HTMLElement).scrollIntoView({
                          behavior: 'smooth',
                          block: 'nearest'
                        })
                      }
                    >
                      <VersionRow stat={stat} />
                    </Focusable>
                  ))}
                  {!versionsData.versions.some((s) => isCurrent(s.version)) && (
                    <div
                      style={{
                        fontSize: '11px',
                        color: '#facc15',
                        textAlign: 'center',
                        padding: '8px 0',
                        marginTop: '4px'
                      }}
                    >
                      No reports found for Proton {CURRENT_PROTON_MAJOR} (Steam
                      Deck default)
                    </div>
                  )}
                </Focusable>
              </ScrollPanel>
            </ScrollPanelGroup>
          ) : (
            <div
              style={{
                color: '#888',
                textAlign: 'center',
                padding: '40px 0'
              }}
            >
              No report data available
            </div>
          )}
        </div>
      )}
    </ConfirmModal>
  )
}
