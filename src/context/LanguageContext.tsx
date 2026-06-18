import { createContext, useContext, useState, useEffect } from 'react'
import type { Language, TranslationKey } from '../i18n/translations'
import { t } from '../i18n/translations'

interface LanguageContextType {
  lang: Language
  setLang: (lang: Language) => void
  t: (key: TranslationKey) => string
}

const LanguageContext = createContext<LanguageContextType>(null!)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Language>('en')

  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr'
  }, [lang])

  const translate = (key: TranslationKey) => t(key, lang)

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translate }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
