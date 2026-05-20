import { useEffect, useState } from 'react'

import ProtonDBTier from '../../types/ProtonDBTier'
import { GatewayAnalysis } from '../../types/gateway'
import { getLinuxInfo, getProtonDBInfo } from '../actions/protondb'
import { getGameAnalysis } from '../actions/gateway'
import { getCache, updateCache } from '../cache/protobDbCache'
import { isOutdated } from '../lib/time'
import { isValidAnalysis } from '../components/protonMedal/analysisGuard'

const useBadgeData = (appId: string | undefined) => {
  const [protonDBTier, setProtonDBTier] = useState<ProtonDBTier>()
  const [linuxSupport, setLinuxSupport] = useState<boolean>(false)
  const [analysis, setAnalysis] = useState<GatewayAnalysis | undefined>()

  async function refresh() {
    if (!appId?.length) return
    const [tier, linux, anal] = await Promise.all([
      getProtonDBInfo(appId),
      getLinuxInfo(appId),
      getGameAnalysis(appId)
    ])
    if (tier?.length) {
      setProtonDBTier(tier)
    }
    setLinuxSupport(linux)
    const validAnal = isValidAnalysis(anal) ? anal : undefined
    setAnalysis(validAnal)
    if (tier?.length) {
      updateCache(appId, {
        tier: tier,
        linuxSupport: linux,
        analysis: validAnal,
        lastUpdated: new Date().toISOString()
      })
    }
  }

  useEffect(() => {
    if (!appId?.length) return
    let ignore = false

    async function loadData() {
      const cache = await getCache(appId as string)

      if (cache?.tier) {
        setProtonDBTier(cache.tier)
      }
      if (typeof cache?.linuxSupport !== 'undefined') {
        setLinuxSupport(cache.linuxSupport)
      }
      if (isValidAnalysis(cache?.analysis)) {
        setAnalysis(cache.analysis)
      }

      if (
        cache?.tier &&
        isValidAnalysis(cache?.analysis) &&
        !isOutdated(cache?.lastUpdated)
      )
        return

      const [tier, linux, anal] = await Promise.all([
        getProtonDBInfo(appId as string),
        getLinuxInfo(appId as string),
        getGameAnalysis(appId as string)
      ])
      if (ignore) return

      if (tier?.length) {
        setProtonDBTier(tier)
      }
      setLinuxSupport(linux)
      const validAnal = isValidAnalysis(anal) ? anal : undefined
      setAnalysis(validAnal)

      if (tier?.length) {
        updateCache(appId as string, {
          tier: tier,
          linuxSupport: linux,
          analysis: validAnal,
          lastUpdated: new Date().toISOString()
        })
      }
    }

    loadData()
    return () => {
      ignore = true
    }
  }, [appId])

  return {
    protonDBTier,
    linuxSupport,
    analysis,
    refresh
  }
}

export default useBadgeData
