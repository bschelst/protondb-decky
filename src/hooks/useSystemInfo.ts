import { useState, useEffect } from 'react'
import { call } from '@decky/api'

interface SystemInfo {
  plugin_version: string
  os_name: string
  os_version: string
  decky_version: string
}

export function useSystemInfo() {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSystemInfo = async () => {
      try {
        const info = await call<[], SystemInfo>('get_system_info')
        setSystemInfo(info)
      } catch (e) {
        console.error('Failed to get system info:', e)
        setSystemInfo({
          plugin_version: 'unknown',
          os_name: 'unknown',
          os_version: 'unknown',
          decky_version: 'unknown'
        })
      } finally {
        setLoading(false)
      }
    }

    fetchSystemInfo()
  }, [])

  // Format OS display - show "SteamOS" if it's SteamOS, otherwise "Linux: [type]"
  const getOsDisplay = () => {
    if (!systemInfo) return 'Loading...'

    const osName = systemInfo.os_name.toLowerCase()
    if (osName.includes('steamos') || osName.includes('steam os')) {
      return `SteamOS: ${systemInfo.os_version}`
    } else {
      return `Linux: ${systemInfo.os_name}`
    }
  }

  return {
    systemInfo,
    loading,
    getOsDisplay
  }
}
