export interface ConfidenceScore {
  score: number // 0-100
  level: 'high' | 'medium' | 'low' | 'none'
  factors: string[]
}

export interface FreshnessInfo {
  latest_report_age: number // days
  label: string
  is_stale: boolean
}

export interface TrendInfo {
  direction: 'improving' | 'stable' | 'declining' | 'unknown'
  recent_positive_ratio?: number
  older_positive_ratio?: number
}

export interface StatsInfo {
  total_reports: number
  recent_reports: number
}

export interface WorkingStatus {
  status: 'working' | 'not_working' | 'unknown'
  confidence: string
  recently_broken: boolean
  timeframe_days: number
  recent_positive_ratio: number
  last_positive_report_age: number
  explanation?: string
}

export interface GatewayAnalysis {
  app_id: number
  confidence: ConfidenceScore
  freshness: FreshnessInfo
  trend: TrendInfo
  warnings: string[]
  stats: StatsInfo
  working_status?: WorkingStatus
}

export interface MonthlyReportCount {
  month: string
  positive: number
  negative: number
}

export interface ReportHistory {
  app_id: number
  months: MonthlyReportCount[]
}

export interface RecentReport {
  timestamp: number
  rating: string
  proton_version?: string
  notes?: string
  os?: string
  is_steam_deck: boolean
}

export interface RecentReportsResponse {
  app_id: number
  reports: RecentReport[]
}
