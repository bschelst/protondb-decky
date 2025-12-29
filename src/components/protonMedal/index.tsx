import { appDetailsClasses, appDetailsHeaderClasses, Focusable, Navigation } from '@decky/ui'
import React, { ReactElement, FC, CSSProperties, ReactNode, useState, useRef, useEffect } from 'react'
import { FaReact, FaPaperPlane } from 'react-icons/fa'
import { IoLogoTux } from 'react-icons/io'

import useAppId from '../../hooks/useAppId'
import useBadgeData from '../../hooks/useBadgeData'
import useTranslations from '../../hooks/useTranslations'
import useProtonDBAuth from '../../hooks/useProtonDBAuth'

import { Button, ButtonProps } from '../button'

import style from './style'
import { useSettings } from '../../hooks/useSettings'

type ExtendedButtonProps = ButtonProps & {
  children: ReactNode
  type: 'button'
  style?: CSSProperties
  className: string
}

const DeckButton = Button as FC<ExtendedButtonProps>

const TOP_POSITIONS = {
  tl: { top: '40px', left: '20px' },
  tr: { top: '60px', right: '20px' },
  tm: { top: '60px', left: '50%', transform: 'translateX(-50%)' }
}

const BOTTOM_OFFSET = 40 // pixels from bottom of hero image

function getPositionStyle(position: string, heroHeight: number | null): CSSProperties {
  if (position in TOP_POSITIONS) {
    return TOP_POSITIONS[position as keyof typeof TOP_POSITIONS]
  }

  // For bottom positions, calculate based on hero height
  const topValue = heroHeight ? `${heroHeight - BOTTOM_OFFSET}px` : '290px' // fallback if height unknown

  switch (position) {
    case 'bl':
      return { top: topValue, left: '20px' }
    case 'br':
      return { top: topValue, right: '20px' }
    case 'bm':
      return { top: topValue, left: '50%', transform: 'translateX(-50%)' }
    default:
      return TOP_POSITIONS.tl
  }
}

function findTopCapsuleParent(ref: HTMLDivElement | null): Element | null {
  const children = ref?.parentElement?.children
  if (!children) {
    return null
  }

  let headerContainer: Element | undefined
  for (const child of children) {
    if (child.className.includes(appDetailsClasses.Header)) {
      headerContainer = child
      break
    }
  }

  if (!headerContainer) {
    return null
  }

  let topCapsule: Element | null = null
  for (const child of headerContainer.children) {
    if (child.className.includes(appDetailsHeaderClasses.TopCapsule)) {
      topCapsule = child
      break
    }
  }

  return topCapsule
}

interface ProtonMedalProps {
  hideSubmit?: boolean
  context?: 'library' | 'store'
  appId?: string
}

export default function ProtonMedal({ hideSubmit = false, context = 'library', appId: propAppId }: ProtonMedalProps): ReactElement {
  const t = useTranslations()
  const detectedAppId = useAppId()
  const appId = propAppId || detectedAppId
  const { protonDBTier, linuxSupport, refresh } = useBadgeData(appId)
  const { settings, loading } = useSettings()
  const { isLoggedIn, isLoading: authLoading, recheckLoginStatus } = useProtonDBAuth()

  // There will be no mutation when the page is loaded (either from exiting the game
  // or just newly opening the page), therefore it's visible by default.
  const [show, setShow] = useState<boolean>(true)
  const [heroHeight, setHeroHeight] = useState<number | null>(null)
  const ref = useRef<HTMLDivElement | null>(null)

  // Combined effect for mutation observer and height measurement
  useEffect(() => {
    // Only observe mutations for library context
    if (context !== 'library') {
      return
    }

    let mutationObserver: MutationObserver | null = null
    let resizeObserver: ResizeObserver | null = null
    let retryTimeout: ReturnType<typeof setTimeout> | null = null

    const setupObservers = () => {
      const topCapsule = findTopCapsuleParent(ref?.current)
      if (!topCapsule) {
        // Retry after a short delay - the DOM might not be fully ready
        retryTimeout = setTimeout(setupObservers, 100)
        return
      }

      // Set up mutation observer for fullscreen detection
      mutationObserver = new MutationObserver((entries) => {
        for (const entry of entries) {
          if (entry.type !== "attributes" || entry.attributeName !== "class") {
            continue
          }

          const className = (entry.target as Element).className
          const fullscreenMode =
            className.includes(appDetailsHeaderClasses.FullscreenEnterStart) ||
            className.includes(appDetailsHeaderClasses.FullscreenEnterActive) ||
            className.includes(appDetailsHeaderClasses.FullscreenEnterDone) ||
            className.includes(appDetailsHeaderClasses.FullscreenExitStart) ||
            className.includes(appDetailsHeaderClasses.FullscreenExitActive)
          const fullscreenAborted =
            className.includes(appDetailsHeaderClasses.FullscreenExitDone)

          setShow(!fullscreenMode || fullscreenAborted)
        }
      })
      mutationObserver.observe(topCapsule, { attributes: true, attributeFilter: ["class"] })

      // Set up height measurement
      const updateHeight = () => {
        const height = topCapsule.getBoundingClientRect().height
        setHeroHeight(height)
      }
      updateHeight()

      // Observe for resize changes
      resizeObserver = new ResizeObserver(updateHeight)
      resizeObserver.observe(topCapsule)
    }

    // Start setup after a micro-task to ensure ref is attached
    setTimeout(setupObservers, 0)

    return () => {
      if (retryTimeout) clearTimeout(retryTimeout)
      if (mutationObserver) mutationObserver.disconnect()
      if (resizeObserver) resizeObserver.disconnect()
    }
  }, [context])

  // Don't render for non-Steam games (no valid appId means it's not a Steam game)
  if (!appId) {
    return <></>
  }

  // Don't render library badge if disabled in settings
  if (context === 'library' && !settings.enableLibraryBadge) {
    return <></>
  }

  const tierClass = `protondb-decky-indicator-${protonDBTier || 'silver'}` as const
  const nativeClass = linuxSupport ? 'protondb-decky-indicator-native' : ''
  const sizeClass = `protondb-decky-indicator-${settings.size || 'regular'
    }` as const

  const labelTypeOnHoverClass =
    settings.size !== 'minimalist' || settings.labelTypeOnHover === 'off'
      ? ''
      : `protondb-decky-indicator-label-on-hover-${settings.labelTypeOnHover}`

  // Conditional styling based on context
  const containerStyle = context === 'store'
    ? {
        position: 'relative' as const,
        marginTop: '16px',
        marginBottom: '16px',
        display: 'flex',
        justifyContent: 'flex-start'
      }
    : {
        position: 'absolute' as const,
        ...getPositionStyle(settings.position, heroHeight)
      }

  const containerClassName = context === 'store'
    ? 'protondb-decky-indicator-container protondb-store-context'
    : 'protondb-decky-indicator-container'

  return (
    <div
      ref={ref}
      className={containerClassName}
      style={containerStyle}
    >
      {show && !loading &&
        <>
          {style}
          <Focusable style={{ display: 'flex', gap: '8px' }} flow-children="row">
            <DeckButton
              className={`protondb-decky-indicator ${tierClass} ${nativeClass} ${sizeClass} ${labelTypeOnHoverClass}`}
              type="button"
              onClick={async () => {
                refresh()
                Navigation.NavigateToExternalWeb(
                  `https://www.protondb.com/app/${appId}`
                )
              }}
            >
              <div>
                {linuxSupport ? (
                  <IoLogoTux
                    style={{ marginRight: 10 }}
                  />
                ) : (
                  <></>
                )}
                {/* The ProtonDB logo has a distracting background, so React's logo is being used as a close substitute */}
                <FaReact />
              </div>
              <span>
                {(() => {
                  const text = protonDBTier ? (
                    settings.size === 'small' ||
                    (settings.size === 'minimalist' &&
                      settings.labelTypeOnHover !== 'regular')
                    ? t(`tierMin${protonDBTier}`)
                    : t(`tier${protonDBTier}`)
                  ) : (
                    t('noReport')
                  )
                  // Limit to 20 characters max
                  return text.length > 20 ? text.slice(0, 20) : text
                })()}
              </span>
            </DeckButton>
            {!settings.disableSubmit && !hideSubmit && (
              <DeckButton
                className={`protondb-decky-indicator protondb-decky-submit-button ${sizeClass} ${labelTypeOnHoverClass} ${isLoggedIn === false ? 'protondb-decky-not-logged-in' : ''}`}
                type="button"
                onClick={async () => {
                  if (isLoggedIn === false) {
                    // User is not logged in, direct them to profile page to login
                    Navigation.NavigateToExternalWeb(
                      'https://www.protondb.com/profile'
                    )
                  } else {
                    // User is logged in or status unknown, go to contribute page
                    Navigation.NavigateToExternalWeb(
                      `https://www.protondb.com/contribute?appId=${appId}`
                    )
                  }
                  // Recheck login status after user potentially logs in
                  setTimeout(() => {
                    recheckLoginStatus()
                  }, 2000)
                }}
              >
                <div>
                  <FaPaperPlane />
                </div>
                {settings.size !== 'minimalist' && (
                  <span>
                    {authLoading ? t('loading') : (isLoggedIn === false ? t('login') : t('submit'))}
                  </span>
                )}
              </DeckButton>
            )}
          </Focusable>
        </>
      }
    </div>
  )
}
