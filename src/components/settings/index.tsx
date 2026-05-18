import {
  ButtonItem,
  ButtonItemProps,
  DropdownItem,
  Field,
  Navigation,
  PanelSection,
  PanelSectionProps,
  PanelSectionRow,
  showModal,
  ToggleField
} from '@decky/ui'
import { toaster } from '@decky/api'
import React, { FC, ReactNode } from 'react'
import { FaGithub, FaQuestionCircle } from 'react-icons/fa'
import { clearCache } from '../../cache/protobDbCache'
import { PLUGIN_VERSION } from '../../constants'
import useTranslations from '../../hooks/useTranslations'
import { useSettings } from '../../hooks/useSettings'
import Spinner from '../spinner'
import HelpModal from '../helpModal'

const GITHUB_URL = 'https://github.com/bschelst/protondb-decky'

type ExtendedPanelSectionProps = PanelSectionProps & {
  children: ReactNode
}

const DeckPanelSection = PanelSection as FC<ExtendedPanelSectionProps>

type PanelSectionRowProps = {
  children: ReactNode
}

const DeckPanelSectionRow = PanelSectionRow as FC<PanelSectionRowProps>

type ExtendedButtonItemProps = ButtonItemProps & {
  children: ReactNode
}

const DeckButtonItem = ButtonItem as FC<ExtendedButtonItemProps>

export default function Index() {
  const {
    settings,
    setSize,
    setPosition,
    setLabelOnHover,
    setDisableSubmit,
    setEnableLibraryBadge,
    setEnableStoreBadge,
    setShowAnalysisButton,
    setRoundedCorners,
    loading
  } = useSettings()
  const t = useTranslations()

  const sizeOptions = [
    { data: 0, label: t('sizeRegular'), value: 'regular' },
    { data: 1, label: t('sizeSmall'), value: 'small' },
    { data: 2, label: t('sizeMinimalist'), value: 'minimalist' }
  ] as const

  const positionOptions = [
    { data: 0, label: t('positionTopLeft'), value: 'tl' },
    { data: 1, label: t('positionTopMiddle'), value: 'tm' },
    { data: 2, label: t('positionTopRight'), value: 'tr' },
    { data: 3, label: t('positionBottomLeft'), value: 'bl' },
    { data: 4, label: t('positionBottomMiddle'), value: 'bm' },
    { data: 5, label: t('positionBottomRight'), value: 'br' }
  ] as const

  const hoverTypeOptions = [
    { data: 0, label: t('expandOnHoverOff'), value: 'off' },
    { data: 1, label: t('sizeSmall'), value: 'small' },
    { data: 2, label: t('sizeRegular'), value: 'regular' }
  ] as const

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 10
        }}
      >
        <Spinner />
      </div>
    )
  }
  return (
    <div>
      <DeckPanelSection title={t('sectionLibrary')}>
        <DeckPanelSectionRow>
          <ToggleField
            label={t('enableLibraryBadge')}
            description={t('enableLibraryBadgeDesc')}
            checked={settings.enableLibraryBadge}
            onChange={(checked: boolean) => {
              setEnableLibraryBadge(checked)
            }}
          />
        </DeckPanelSectionRow>
        <DeckPanelSectionRow>
          <ToggleField
            label={t('disableSubmit')}
            description={t('disableSubmitDesc')}
            checked={settings.disableSubmit}
            onChange={(checked: boolean) => {
              setDisableSubmit(checked)
            }}
          />
        </DeckPanelSectionRow>
        <DeckPanelSectionRow>
          <DropdownItem
            label={t('badgeSize')}
            description={t('badgeSizeDescription')}
            menuLabel={t('badgeSize')}
            rgOptions={sizeOptions.map((o) => ({
              data: o.data,
              label: o.label
            }))}
            selectedOption={
              sizeOptions.find((o) => o.value === settings.size)?.data || 0
            }
            onChange={(newVal: { data: number; label: string }) => {
              const newSize =
                sizeOptions.find((o) => o.data === newVal.data)?.value ||
                'regular'
              setSize(newSize)
            }}
          />
        </DeckPanelSectionRow>
        {settings.size === 'minimalist' ? (
          <DeckPanelSectionRow>
            <DropdownItem
              label={t('expandOnHover')}
              description={t('expandOnHoverDescription')}
              menuLabel={t('expandOnHover')}
              rgOptions={hoverTypeOptions.map((o) => ({
                data: o.data,
                label: o.label
              }))}
              selectedOption={
                hoverTypeOptions.find(
                  (o) => o.value === settings.labelTypeOnHover
                )?.data || 0
              }
              onChange={(newVal: { data: number; label: string }) => {
                const newHoverType =
                  hoverTypeOptions.find((o) => o.data === newVal.data)?.value ||
                  'off'
                setLabelOnHover(newHoverType)
              }}
            />
          </DeckPanelSectionRow>
        ) : (
          ''
        )}
        <DeckPanelSectionRow>
          <DropdownItem
            label={t('badgePosition')}
            description={t('badgePositionDescription')}
            menuLabel={t('badgePosition')}
            rgOptions={positionOptions.map((o) => ({
              data: o.data,
              label: o.label
            }))}
            selectedOption={
              positionOptions.find((o) => o.value === settings.position)
                ?.data || 0
            }
            onChange={(newVal: { data: number; label: string }) => {
              const newPosition =
                positionOptions.find((o) => o.data === newVal.data)?.value ||
                'tl'
              setPosition(newPosition)
            }}
          />
        </DeckPanelSectionRow>
      </DeckPanelSection>
      <DeckPanelSection title={t('sectionStore')}>
        <DeckPanelSectionRow>
          <ToggleField
            label={t('enableStoreBadge')}
            description={t('enableStoreBadgeDesc')}
            checked={settings.enableStoreBadge}
            onChange={(checked: boolean) => {
              setEnableStoreBadge(checked)
            }}
          />
        </DeckPanelSectionRow>
      </DeckPanelSection>
      <DeckPanelSection title={t('sectionEnhancedFeatures')}>
        <DeckPanelSectionRow>
          <ToggleField
            label={t('showAnalysisButton')}
            description={t('showAnalysisButtonDesc')}
            checked={settings.showAnalysisButton !== false}
            onChange={(checked: boolean) => {
              setShowAnalysisButton(checked)
            }}
          />
        </DeckPanelSectionRow>
        <DeckPanelSectionRow>
          <ToggleField
            label={t('roundedCorners')}
            description={t('roundedCornersDesc')}
            checked={settings.roundedCorners === true}
            onChange={(checked: boolean) => {
              setRoundedCorners(checked)
            }}
          />
        </DeckPanelSectionRow>
      </DeckPanelSection>
      <DeckPanelSection title={t('caching')}>
        <DeckPanelSectionRow>
          <DeckButtonItem
            label={t('clearCacheLabel')}
            bottomSeparator="none"
            layout="below"
            onClick={() => {
              clearCache()
              toaster.toast({
                title: 'ProtonDB Badges',
                body: t('clearCacheSuccess'),
                duration: 3000
              })
            }}
          >
            {t('clearCache')}
          </DeckButtonItem>
        </DeckPanelSectionRow>
      </DeckPanelSection>
      <DeckPanelSection title={t('sectionLinks')}>
        <DeckPanelSectionRow>
          <DeckButtonItem
            bottomSeparator="standard"
            layout="below"
            onClick={() => showModal(<HelpModal />)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FaQuestionCircle size={20} />
              <span>{t('helpButton')}</span>
            </div>
          </DeckButtonItem>
        </DeckPanelSectionRow>
        <DeckPanelSectionRow>
          <DeckButtonItem
            bottomSeparator="none"
            layout="below"
            onClick={() => Navigation.NavigateToExternalWeb(GITHUB_URL)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FaGithub size={20} />
              <span>GitHub</span>
            </div>
          </DeckButtonItem>
        </DeckPanelSectionRow>
        <DeckPanelSectionRow>
          <Field label={t('version')} bottomSeparator="none">
            {PLUGIN_VERSION}
          </Field>
        </DeckPanelSectionRow>
      </DeckPanelSection>
    </div>
  )
}
