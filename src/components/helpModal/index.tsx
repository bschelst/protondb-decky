import { ConfirmModal, DialogButton, Focusable } from '@decky/ui'
import React, { FC, useRef } from 'react'
import { FaBook, FaCog, FaGamepad, FaSteam } from 'react-icons/fa'
import useTranslations from '../../hooks/useTranslations'

interface HelpModalProps {
  closeModal?: () => void
}

const SectionHeader: FC<{ icon: React.ReactNode; title: string; id?: string }> = ({ icon, title, id }) => (
  <div
    id={id}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      marginBottom: '12px',
      paddingBottom: '8px',
      borderBottom: '1px solid rgba(255,255,255,0.2)'
    }}
  >
    <span style={{ fontSize: '20px' }}>{icon}</span>
    <span style={{ fontSize: '16px', fontWeight: 'bold' }}>{title}</span>
  </div>
)

const HelpSection: FC<{ children: React.ReactNode; sectionRef?: React.RefObject<HTMLDivElement> }> = ({ children, sectionRef }) => (
  <div
    ref={sectionRef}
    style={{
      padding: '16px',
      marginBottom: '16px',
      background: 'rgba(255,255,255,0.05)',
      borderRadius: '8px'
    }}
  >
    {children}
  </div>
)

const Step: FC<{ number: number; children: React.ReactNode }> = ({ number, children }) => (
  <div style={{
    display: 'flex',
    gap: '12px',
    marginBottom: '10px',
    alignItems: 'flex-start'
  }}>
    <div style={{
      minWidth: '24px',
      height: '24px',
      borderRadius: '50%',
      background: 'rgba(255,255,255,0.2)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '12px',
      fontWeight: 'bold'
    }}>
      {number}
    </div>
    <div style={{ flex: 1, lineHeight: '1.5' }}>{children}</div>
  </div>
)

const TocButton: FC<{ icon: React.ReactNode; label: string; onClick: () => void }> = ({ icon, label, onClick }) => (
  <DialogButton
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 12px',
      minWidth: 'auto',
      fontSize: '12px'
    }}
  >
    {icon}
    <span>{label}</span>
  </DialogButton>
)

const HelpModal: FC<HelpModalProps> = ({ closeModal }) => {
  const t = useTranslations()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const aboutRef = useRef<HTMLDivElement>(null)
  const usingRef = useRef<HTMLDivElement>(null)
  const protondbRef = useRef<HTMLDivElement>(null)
  const submitRef = useRef<HTMLDivElement>(null)

  const scrollToSection = (ref: React.RefObject<HTMLDivElement>) => {
    if (ref.current && scrollContainerRef.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <ConfirmModal
      strTitle={t('helpTitle')}
      strOKButtonText={t('helpClose')}
      onOK={closeModal}
      onCancel={closeModal}
      bHideCloseIcon={false}
    >
      {/* Table of Contents */}
      <div style={{
        marginBottom: '16px',
        padding: '12px',
        background: 'rgba(255,255,255,0.08)',
        borderRadius: '8px'
      }}>
        <div style={{
          fontSize: '12px',
          opacity: 0.7,
          marginBottom: '8px',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>
          {t('helpToc')}
        </div>
        <Focusable
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px'
          }}
          //@ts-ignore
          flow-children="row"
        >
          <TocButton
            icon={<FaBook size={14} />}
            label={t('helpAboutTitle')}
            onClick={() => scrollToSection(aboutRef)}
          />
          <TocButton
            icon={<FaCog size={14} />}
            label={t('helpUsingTitle')}
            onClick={() => scrollToSection(usingRef)}
          />
          <TocButton
            icon={<FaSteam size={14} />}
            label={t('helpProtonDBTitle')}
            onClick={() => scrollToSection(protondbRef)}
          />
          <TocButton
            icon={<FaGamepad size={14} />}
            label={t('helpSubmitTitle')}
            onClick={() => scrollToSection(submitRef)}
          />
        </Focusable>
      </div>

      {/* Scrollable Content */}
      <div
        ref={scrollContainerRef}
        style={{
          maxHeight: '50vh',
          overflow: 'auto',
          scrollBehavior: 'smooth'
        }}
      >
        <Focusable
          style={{ padding: '4px' }}
          //@ts-ignore
          flow-children="column"
        >
          {/* About Section */}
          <Focusable
            onFocus={(e) => e.target.scrollIntoView({ behavior: 'smooth', block: 'nearest' })}
          >
            <HelpSection sectionRef={aboutRef}>
              <SectionHeader icon={<FaBook />} title={t('helpAboutTitle')} />
              <p style={{ lineHeight: '1.6', marginBottom: '8px' }}>
                {t('helpAboutDesc')}
              </p>
            </HelpSection>
          </Focusable>

          {/* Using the Plugin Section */}
          <Focusable
            onFocus={(e) => e.target.scrollIntoView({ behavior: 'smooth', block: 'nearest' })}
          >
            <HelpSection sectionRef={usingRef}>
              <SectionHeader icon={<FaCog />} title={t('helpUsingTitle')} />

              <div style={{ marginBottom: '16px' }}>
                <strong>{t('helpBadgeTiers')}</strong>
                <ul style={{ marginTop: '8px', paddingLeft: '20px', lineHeight: '1.6' }}>
                  <li><span style={{ color: '#b4c7dc' }}>Platinum</span> - {t('helpTierPlatinum')}</li>
                  <li><span style={{ color: '#cfb53b' }}>Gold</span> - {t('helpTierGold')}</li>
                  <li><span style={{ color: '#a6a6a6' }}>Silver</span> - {t('helpTierSilver')}</li>
                  <li><span style={{ color: '#cd7f32' }}>Bronze</span> - {t('helpTierBronze')}</li>
                  <li><span style={{ color: '#ff0000' }}>Borked</span> - {t('helpTierBorked')}</li>
                  <li><span style={{ color: '#6c757d' }}>Pending</span> - {t('helpTierPending')}</li>
                  <li><span style={{ color: '#4a4a4a' }}>No Report</span> - {t('helpTierNoReport')}</li>
                </ul>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <strong>{t('helpSettingsExplain')}</strong>
                <ul style={{ marginTop: '8px', paddingLeft: '20px', lineHeight: '1.6' }}>
                  <li><strong>{t('helpSettingSize')}</strong> - {t('helpSettingSizeDesc')}</li>
                  <li><strong>{t('helpSettingPosition')}</strong> - {t('helpSettingPositionDesc')}</li>
                  <li><strong>{t('helpSettingSubmit')}</strong> - {t('helpSettingSubmitDesc')}</li>
                </ul>
              </div>
            </HelpSection>
          </Focusable>

          {/* Adding Steam Deck to ProtonDB Section */}
          <Focusable
            onFocus={(e) => e.target.scrollIntoView({ behavior: 'smooth', block: 'nearest' })}
          >
            <HelpSection sectionRef={protondbRef}>
              <SectionHeader icon={<FaSteam />} title={t('helpProtonDBTitle')} />
              <p style={{ marginBottom: '16px', lineHeight: '1.6' }}>
                {t('helpProtonDBDesc')}
              </p>

              <strong>{t('helpProtonDBSteps')}</strong>
              <div style={{ marginTop: '12px' }}>
                <Step number={1}>{t('helpStep1')}</Step>
                <Step number={2}>{t('helpStep2')}</Step>
                <Step number={3}>{t('helpStep3')}</Step>
                <Step number={4}>{t('helpStep4')}</Step>
                <Step number={5}>{t('helpStep5')}</Step>
                <Step number={6}>{t('helpStep6')}</Step>
              </div>

              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: 'rgba(207, 181, 59, 0.2)',
                borderRadius: '6px',
                borderLeft: '3px solid #cfb53b'
              }}>
                <strong>💡 {t('helpTip')}</strong>
                <p style={{ marginTop: '4px', lineHeight: '1.5' }}>{t('helpTipContent')}</p>
              </div>
            </HelpSection>
          </Focusable>

          {/* Submitting Reports Section */}
          <Focusable
            onFocus={(e) => e.target.scrollIntoView({ behavior: 'smooth', block: 'nearest' })}
          >
            <HelpSection sectionRef={submitRef}>
              <SectionHeader icon={<FaGamepad />} title={t('helpSubmitTitle')} />
              <p style={{ marginBottom: '12px', lineHeight: '1.6' }}>
                {t('helpSubmitDesc')}
              </p>
              <Step number={1}>{t('helpSubmitStep1')}</Step>
              <Step number={2}>{t('helpSubmitStep2')}</Step>
              <Step number={3}>{t('helpSubmitStep3')}</Step>
            </HelpSection>
          </Focusable>
        </Focusable>
      </div>
    </ConfirmModal>
  )
}

export default HelpModal
