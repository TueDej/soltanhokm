import { useState } from 'react'

interface MainMenuProps {
  onSelectMode: (mode: 'local' | 'online', playerName: string) => void
}

export function MainMenu({ onSelectMode }: MainMenuProps) {
  const [playerName, setPlayerName] = useState('')

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
      <h1 style={{ fontSize: 48, marginBottom: 10 }}>سلطان حکم</h1>
      <p style={{ color: '#aaa' }}>Hokm Card Game</p>

      <input
        placeholder="نام خود را وارد کنید"
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
        بازی با ۳ ربات
      </button>

      <button
        disabled
        title="به زودی..."
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
        ۲ نفره (به زودی)
      </button>
    </div>
  )
}
