import React from 'react'
import { definePlugin, staticClasses } from '@decky/ui'
import { routerHook } from '@decky/api'
import { FaReact } from 'react-icons/fa'

import Settings from './components/settings'
import StoreOverlay from './components/storeOverlay'
import patchLibraryApp from './lib/patchLibraryApp'
import { initStorePatch } from './patches/StorePatch'
import { initLibraryGridPatch } from './patches/LibraryGridPatch'
import { loadSettings } from './hooks/useSettings'

export default definePlugin(() => {
  let libraryPatch: ReturnType<typeof patchLibraryApp> | null = null
  let stopStorePatch: (() => void) | null = null
  let stopGridPatch: (() => void) | null = null

  try {
    loadSettings()
  } catch (e) {
    console.error('[ProtonDB] loadSettings', e)
  }
  try {
    libraryPatch = patchLibraryApp()
  } catch (e) {
    console.error('[ProtonDB] patchLibraryApp', e)
  }
  try {
    stopStorePatch = initStorePatch()
  } catch (e) {
    console.error('[ProtonDB] initStorePatch', e)
  }
  try {
    stopGridPatch = initLibraryGridPatch()
  } catch (e) {
    console.error('[ProtonDB] initLibraryGridPatch', e)
  }

  try {
    routerHook.removeGlobalComponent('ProtonDBStoreOverlay')
  } catch {}
  try {
    routerHook.addGlobalComponent('ProtonDBStoreOverlay', StoreOverlay)
  } catch (e) {
    console.error('[ProtonDB] addGlobalComponent', e)
  }

  return {
    title: <div className={staticClasses.Title}>ProtonDB Badges Extended</div>,
    icon: <FaReact />,
    content: <Settings />,
    onDismount() {
      try {
        if (libraryPatch)
          routerHook.removePatch('/library/app/:appid', libraryPatch)
      } catch {}
      try {
        routerHook.removeGlobalComponent('ProtonDBStoreOverlay')
      } catch {}
      try {
        stopStorePatch?.()
      } catch {}
      try {
        stopGridPatch?.()
      } catch {}
    }
  }
})
