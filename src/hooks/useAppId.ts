import { fetchNoCors } from '@decky/api'
import { useEffect, useState } from 'react'
import { appTypes } from '../constants'
import { useParams } from './useParams'

function cleanString(str: string) {
  return str
    .replace(/['"\u0040\u0026\u2122\u00ae]/g, '')
    .toLowerCase()
    .trim()
}

const useAppId = () => {
  const [appId, setAppId] = useState<string>()
  let pathId: string | undefined = undefined

  try {
    const params = typeof useParams === 'function' ? useParams<{ appid?: string }>() : null
    if (params?.appid) {
      pathId = String(params.appid)
    }
  } catch {}

  if (!pathId) {
    try {
      const match = window.location.pathname.match(/\/app\/(\d+)/)
      if (match) {
        pathId = match[1]
      }
    } catch {}
  }

  if (!pathId) {
    try {
      const activeId =
        (window as any).appStore?.m_activeAppId ||
        (window as any).appStore?.m_lastAppOverview?.appid
      if (activeId) {
        pathId = String(activeId)
      }
    } catch {}
  }

  useEffect(() => {
    if (!pathId) {
      return
    }

    let ignore = false
    async function getNonSteamAppId(gameName: string | undefined) {
      if (ignore || !gameName) {
        setAppId(undefined)
        return
      }

      try {
        const res = await fetchNoCors(
          `https://steamcommunity.com/actions/SearchApps/${gameName}`,
          {
            method: 'GET'
          }
        )

        if (res.status === 200) {
          const options = (await res.json()) as {
            appid: string
            name: string
          }[]
          const cleanedGameName = cleanString(gameName)
          const foundAppId = options.find((o) => {
            return o.name && cleanString(o.name) === cleanedGameName
          })?.appid
          setAppId(foundAppId)
          return
        }
      } catch (error) {
        console.error(error)
      }
      setAppId(undefined)
    }

    const appDetails = (window as any).appStore?.GetAppOverviewByGameID?.(parseInt(pathId))
    const isSteamGame = Boolean(
      appTypes[appDetails?.app_type as keyof typeof appTypes]
    )
    if (isSteamGame) {
      setAppId(pathId)
    } else {
      getNonSteamAppId(appDetails?.display_name)
    }

    return () => {
      ignore = true
    }
  }, [pathId])

  return appId
}

export default useAppId
