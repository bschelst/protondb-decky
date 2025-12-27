import {
  ButtonItem,
  ButtonItemProps,
  DropdownItem,
  PanelSection,
  PanelSectionProps,
  PanelSectionRow,
  ToggleField
} from '@decky/ui'
import React, { FC, ReactNode } from 'react'
import { clearCache } from '../../cache/protobDbCache'
import useTranslations from '../../hooks/useTranslations'
import { useSettings } from '../../hooks/useSettings'
import { useOriginalPluginCheck } from '../../hooks/useOriginalPluginCheck'
import Spinner from '../spinner'

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
  const { settings, setSize, setPosition, setLabelOnHover, setDisableSubmit, loading } =
    useSettings()
  const t = useTranslations()
  const { status: originalPluginStatus, loading: pluginCheckLoading } = useOriginalPluginCheck()

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
      {originalPluginStatus?.installed && !pluginCheckLoading && (
        <div style={{
          background: '#ff6b35',
          border: '2px solid #e55a2e',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '16px',
          color: '#000000'
        }}>
          <div style={{
            fontSize: '16px',
            fontWeight: 'bold',
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            ⚠️ {t('originalPluginDetected')}
          </div>
          <div style={{ fontSize: '14px', marginBottom: '8px' }}>
            {t('originalPluginWarning')}
          </div>
          {originalPluginStatus.version && (
            <div style={{ fontSize: '12px', opacity: 0.8 }}>
              {t('originalPluginVersion')}: {originalPluginStatus.version}
            </div>
          )}
        </div>
      )}
      <DeckPanelSection title={t('settings')}>
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
      <DeckPanelSection title="eXtended">
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
      </DeckPanelSection>
      <DeckPanelSection title={t('caching')}>
        <DeckPanelSectionRow>
          <DeckButtonItem
            label={t('clearCacheLabel')}
            bottomSeparator="none"
            layout="below"
            onClick={() => clearCache()}
          >
            {t('clearCache')}
          </DeckButtonItem>
        </DeckPanelSectionRow>
      </DeckPanelSection>
    </div>
  )
}
