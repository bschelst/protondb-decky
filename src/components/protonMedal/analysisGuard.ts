import { GatewayAnalysis } from '../../../types/gateway'

export function isValidAnalysis(
  analysis: GatewayAnalysis | undefined
): analysis is GatewayAnalysis {
  if (!analysis || typeof analysis !== 'object') return false
  if (!analysis.confidence || typeof analysis.confidence.score !== 'number')
    return false
  if (!analysis.freshness || typeof analysis.freshness.latest_report_age !== 'number')
    return false
  if (!analysis.trend || typeof analysis.trend.direction !== 'string')
    return false
  if (!analysis.stats || typeof analysis.stats.total_reports !== 'number')
    return false
  if (!Array.isArray(analysis.confidence.factors)) return false
  return true
}
