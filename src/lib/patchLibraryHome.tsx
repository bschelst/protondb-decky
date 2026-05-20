import { routerHook } from '@decky/api'
import { afterPatch } from '@decky/ui'
import React, { ReactElement } from 'react'
import LibraryGridDots from '../components/libraryGridDots'

function patchLibraryHome() {
  const route = '/library/home'

  const patch = routerHook.addPatch(route, (tree: any) => {
    const routeComponent = tree?.children
    if (!routeComponent?.type) return tree

    afterPatch(routeComponent, 'type', (_args: any[], ret: ReactElement) => {
      if (!ret) return ret

      // Wrap the return in a fragment with our dots component
      return (
        <>
          {ret}
          <LibraryGridDots />
        </>
      )
    })

    return tree
  })

  return { routes: [route], patches: [patch] }
}

export default patchLibraryHome
