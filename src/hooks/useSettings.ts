import { call } from '@decky/api'
import { useEffect, useState } from 'react'
import { BehaviorSubject } from 'rxjs'

export type Settings = {
  size: 'regular' | 'small' | 'minimalist'
  position: 'tl' | 'tr' | 'tm' | 'bl' | 'br' | 'bm'
  labelTypeOnHover: 'off' | 'small' | 'regular'
  disableSubmit: boolean
  enableLibraryBadge: boolean
  enableStoreBadge: boolean
  storeBadgePosition: 'bc' | 'bl' | 'br' | 'tm'
  showAnalysisButton?: boolean
  roundedCorners?: boolean
  showLibraryIcons?: boolean
  libraryIconPosition?: 'bl' | 'tl' | 'tr'
}

const DEFAULT_SETTINGS: Settings = {
  size: 'regular',
  position: 'tl',
  labelTypeOnHover: 'off',
  disableSubmit: false,
  enableLibraryBadge: true,
  enableStoreBadge: true,
  storeBadgePosition: 'bc',
  showAnalysisButton: true,
  roundedCorners: false,
  showLibraryIcons: true,
  libraryIconPosition: 'bl'
}

// Not using the React context here as this approach is simpler.
export const SettingsContext = new BehaviorSubject<Settings>(DEFAULT_SETTINGS)
const LoadingContext = new BehaviorSubject(true)

function updateSettings(key: keyof Settings, value: Settings[keyof Settings]) {
  const newSettings = { ...SettingsContext.value, [key]: value }
  call<[string, Settings], Settings>(
    'set_setting',
    'settings',
    newSettings
  ).catch(console.error)
  SettingsContext.next(newSettings)
}

export function loadSettings() {
  LoadingContext.next(true)
  call<[string, Settings], Settings>(
    'get_setting',
    'settings',
    DEFAULT_SETTINGS
  )
    .then((settings) => {
      // Merge with defaults to handle missing fields from older versions
      const mergedSettings = { ...DEFAULT_SETTINGS, ...settings }
      SettingsContext.next(mergedSettings)
    })
    .catch(console.error)
    .finally(() => LoadingContext.next(false))
}

export const useSettings = () => {
  const [settings, setSettings] = useState(SettingsContext.value)
  const [loading, setLoading] = useState(LoadingContext.value)

  useEffect(() => {
    const settingsSub = SettingsContext.asObservable().subscribe((value) =>
      setSettings(value)
    )
    const loadingSub = LoadingContext.asObservable().subscribe((value) =>
      setLoading(value)
    )
    return () => {
      loadingSub.unsubscribe()
      settingsSub.unsubscribe()
    }
  }, [])

  function setSize(value: Settings['size']) {
    updateSettings('size', value)
  }

  function setPosition(value: Settings['position']) {
    updateSettings('position', value)
  }

  function setLabelOnHover(value: Settings['labelTypeOnHover']) {
    updateSettings('labelTypeOnHover', value)
  }

  function setDisableSubmit(value: Settings['disableSubmit']) {
    updateSettings('disableSubmit', value)
  }

  function setEnableLibraryBadge(value: Settings['enableLibraryBadge']) {
    updateSettings('enableLibraryBadge', value)
  }

  function setEnableStoreBadge(value: Settings['enableStoreBadge']) {
    updateSettings('enableStoreBadge', value)
  }

  function setStoreBadgePosition(value: Settings['storeBadgePosition']) {
    updateSettings('storeBadgePosition', value)
  }

  function setShowAnalysisButton(value: Settings['showAnalysisButton']) {
    updateSettings('showAnalysisButton', value)
  }

  function setRoundedCorners(value: Settings['roundedCorners']) {
    updateSettings('roundedCorners', value)
  }

  function setShowLibraryIcons(value: Settings['showLibraryIcons']) {
    updateSettings('showLibraryIcons', value)
  }

  function setLibraryIconPosition(value: Settings['libraryIconPosition']) {
    updateSettings('libraryIconPosition', value)
  }

  return {
    settings,
    setSize,
    setPosition,
    setLabelOnHover,
    setDisableSubmit,
    setEnableLibraryBadge,
    setEnableStoreBadge,
    setStoreBadgePosition,
    setShowAnalysisButton,
    setRoundedCorners,
    setShowLibraryIcons,
    setLibraryIconPosition,
    loading
  }
}
