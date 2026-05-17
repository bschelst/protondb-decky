import React, { FC } from 'react'
import { MonthlyReportCount } from '../../../types/gateway'

interface ReportChartProps {
  months: MonthlyReportCount[]
}

const ReportChart: FC<ReportChartProps> = ({ months }) => {
  const now = new Date()
  const fiveYearsAgo = new Date(now.getFullYear() - 5, now.getMonth(), 1)

  const filtered = months.filter((m) => {
    const [y, mo] = m.month.split('-').map(Number)
    return new Date(y, mo - 1, 1) >= fiveYearsAgo
  })

  if (filtered.length === 0) {
    return (
      <div style={{ color: '#888', textAlign: 'center', padding: '40px 0' }}>
        No report data available
      </div>
    )
  }

  const w = 500
  const h = 180
  const pad = 40
  const chartW = w - pad - 30
  const chartH = h - 30

  let maxVal = 1
  filtered.forEach((m) => {
    maxVal = Math.max(maxVal, m.positive, m.negative)
  })

  const x = (i: number) => pad + (i / (filtered.length - 1 || 1)) * chartW
  const y = (v: number) => 10 + chartH - (v / maxVal) * chartH

  const makeLine = (key: 'positive' | 'negative') =>
    filtered
      .map(
        (d, i) =>
          `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(d[key]).toFixed(1)}`
      )
      .join(' ')

  const makeArea = (key: 'positive' | 'negative') =>
    `${makeLine(key)} L${x(filtered.length - 1).toFixed(1)},${10 + chartH} L${pad},${10 + chartH} Z`

  const SHORT_MONTHS = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec'
  ]
  function formatMonthLabel(m: string): string {
    const [y, mo] = m.split('-')
    return `${SHORT_MONTHS[parseInt(mo) - 1]} '${y.slice(2)}`
  }

  const step = Math.max(1, Math.floor(filtered.length / 6))
  const xLabels: Array<{ i: number; label: string }> = []
  for (let i = 0; i < filtered.length; i += step) {
    xLabels.push({ i, label: formatMonthLabel(filtered[i].month) })
  }

  const yLabels: number[] = []
  const yStep = Math.max(1, Math.ceil(maxVal / 4))
  for (let v = 0; v <= maxVal; v += yStep) {
    yLabels.push(v)
  }

  return (
    <div style={{ width: '100%', height: 220 }}>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: '100%' }}>
        <defs>
          <linearGradient id="gp" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4caf50" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#4caf50" stopOpacity={0.05} />
          </linearGradient>
          <linearGradient id="gn" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f44336" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#f44336" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <path d={makeArea('positive')} fill="url(#gp)" />
        <path
          d={makeLine('positive')}
          fill="none"
          stroke="#4caf50"
          strokeWidth={2}
        />
        <path d={makeArea('negative')} fill="url(#gn)" />
        <path
          d={makeLine('negative')}
          fill="none"
          stroke="#f44336"
          strokeWidth={2}
        />
        {xLabels.map((l) => (
          <text
            key={l.i}
            x={x(l.i)}
            y={h - 2}
            fill="#888"
            fontSize={9}
            textAnchor="middle"
          >
            {l.label}
          </text>
        ))}
        {yLabels.map((v) => (
          <text
            key={v}
            x={pad - 4}
            y={y(v) + 3}
            fill="#888"
            fontSize={9}
            textAnchor="end"
          >
            {v}
          </text>
        ))}
        <circle cx={w - 80} cy={12} r={4} fill="#4caf50" />
        <text x={w - 72} y={16} fill="#ccc" fontSize={11}>
          Good
        </text>
        <circle cx={w - 35} cy={12} r={4} fill="#f44336" />
        <text x={w - 27} y={16} fill="#ccc" fontSize={11}>
          Bad
        </text>
      </svg>
    </div>
  )
}

export default ReportChart
