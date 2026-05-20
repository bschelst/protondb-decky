import { useState } from 'react'
import languages from '../lib/translations'

function getCurrentLanguage(): keyof typeof languages {
  const steamLang = window.LocalizationManager.m_rgLocalesToUse[0]
  const lang = steamLang.replace(/-([a-z])/g, (_, letter: string) =>
    letter.toUpperCase()
  ) as keyof typeof languages
  return languages[lang] ? lang : 'en'
}

function useTranslations() {
  const [lang] = useState(getCurrentLanguage())
  return function (key: keyof (typeof languages)['en']): string {
    const langStrings = languages[lang] as Record<string, string>
    const enStrings = languages.en as Record<string, string>
    if (langStrings?.[key]?.length) {
      return langStrings[key]
    } else if (enStrings?.[key]?.length) {
      return enStrings[key]
    } else {
      return key
    }
  }
}

export default useTranslations
