import {
  ConfirmModal,
  Focusable,
  Navigation,
  ScrollPanelGroup,
  ScrollPanel
} from '@decky/ui'
import React, { CSSProperties, FC, ReactNode, useEffect, useState } from 'react'
import {
  GatewayAnalysis,
  ReportHistory,
  RecentReport,
  RecentReportsResponse
} from '../../../types/gateway'
import { getReportHistory, getRecentReports } from '../../actions/gateway'
import ReportChart from './ReportChart'

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

export default function AnalysisModal({
  analysis,
  appId,
  closeModal
}: AnalysisModalProps) {
  const { confidence, freshness, trend, stats, working_status } = analysis
  const [gameName, setGameName] = useState<string>('—')
  const [activeTab, setActiveTab] = useState<'details' | 'chart' | 'reports'>(
    'details'
  )
  const [history, setHistory] = useState<ReportHistory | undefined>()
  const [historyLoading, setHistoryLoading] = useState(false)
  const [recentReports, setRecentReports] = useState<
    RecentReportsResponse | undefined
  >()
  const [reportsLoading, setReportsLoading] = useState(false)

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
      getReportHistory(appId).then((data) => {
        setHistory(data)
        setHistoryLoading(false)
      })
    }
    if (activeTab === 'reports' && !recentReports && !reportsLoading) {
      setReportsLoading(true)
      getRecentReports(appId).then((data) => {
        setRecentReports(data)
        setReportsLoading(false)
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
      value: working_status
        ? `${workingIcon} ${working_status.status.replace('_', ' ')} (${working_status.confidence} certainty)`
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
                  {recentReports.reports.map((report, i) => (
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
    </ConfirmModal>
  )
}
