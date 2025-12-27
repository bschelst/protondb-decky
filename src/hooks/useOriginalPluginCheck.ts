import { call } from '@decky/api'
import { useEffect, useState } from 'react'

export type OriginalPluginStatus = {
  installed: boolean
  version: string | null
}

export const useOriginalPluginCheck = () => {
  const [status, setStatus] = useState<OriginalPluginStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkPlugin = async () => {
      try {
        const result = await call<[], OriginalPluginStatus>('check_original_plugin')
        setStatus(result)
      } catch (error) {
        console.error('Failed to check original plugin:', error)
        setStatus({ installed: false, version: null })
      } finally {
        setLoading(false)
      }
    }

    checkPlugin()
  }, [])

  return { status, loading }
}
