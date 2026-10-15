import { useParams as deckyUseParams, findModuleExport } from '@decky/ui'

function findUseParams(): <T>() => T {
  try {
    if (typeof deckyUseParams === 'function') {
      return deckyUseParams
    }

    if (typeof findModuleExport === 'function') {
      const found = findModuleExport((e: unknown) => {
        try {
          return (
            typeof e === 'function' &&
            e.toString().length < 200 &&
            /\.params:\{\}/.test(e.toString())
          )
        } catch {
          return false
        }
      }) as (<T>() => T) | undefined

      if (typeof found === 'function') {
        return found
      }
    }
  } catch {}

  return <T>() => {
    try {
      const match = window.location.pathname.match(/\/app\/(\d+)/)
      return (match ? { appid: match[1] } : {}) as T
    } catch {
      return {} as T
    }
  }
}

export const useParams = findUseParams()
