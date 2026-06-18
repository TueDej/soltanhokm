import { useState } from 'react'
import { useLanguage } from '../context/LanguageContext'

interface MainMenuProps {
  onSelectMode: (mode: 'local' | 'online', playerName: string) => void
}

export function MainMenu({ onSelectMode }: MainMenuProps) {
  const [playerName, setPlayerName] = useState('')
  const { t } = useLanguage()

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 20,
        marginTop: 100,
      }}
    >
      <h1 style={{ fontSize: 48, marginBottom: 10 }}>{t('title')}</h1>
      <p style={{ color: '#aaa' }}>{t('subtitle')}</p>

      <input
        placeholder={t('enterName')}
        value={playerName}
        onChange={(e) => setPlayerName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && playerName.trim() && onSelectMode('local', playerName.trim())}
        style={{
          padding: '12px 20px',
          fontSize: 18,
          borderRadius: 8,
          border: '2px solid #444',
          background: '#222',
          color: '#fff',
          width: 280,
          textAlign: 'center',
        }}
      />

      <button
        onClick={() => onSelectMode('local', playerName.trim())}
        disabled={!playerName.trim()}
        style={{
          padding: '14px 40px',
          fontSize: 18,
          borderRadius: 8,
          border: 'none',
          background: playerName.trim() ? '#2d8a3e' : '#444',
          color: '#fff',
          cursor: playerName.trim() ? 'pointer' : 'not-allowed',
          width: 320,
        }}
      >
        {t('playVs3Bots')}
      </button>

      <button
        disabled
        title={t('twoPlayers')}
        style={{
          padding: '14px 40px',
          fontSize: 18,
          borderRadius: 8,
          border: 'none',
          background: '#333',
          color: '#666',
          cursor: 'not-allowed',
          width: 320,
        }}
      >
        {t('twoPlayers')}
      </button>
    </div>
  )
}
