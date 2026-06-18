import { useLanguage } from '../context/LanguageContext'

export function LanguageToggle() {
  const { lang, setLang } = useLanguage()

  return (
    <button
      onClick={() => setLang(lang === 'en' ? 'fa' : 'en')}
      style={{
        position: 'fixed',
        top: 16,
        right: 16,
        padding: '8px 14px',
        borderRadius: 6,
        border: '1px solid #555',
        background: '#333',
        color: '#fff',
        cursor: 'pointer',
        fontSize: 14,
        zIndex: 1000,
      }}
    >
      {lang === 'en' ? 'فارسی' : 'English'}
    </button>
  )
}
