import { useState, useEffect } from 'react'

const STORAGE_KEY = 'soltanhokm_session'
const NAME_KEY = 'soltanhokm_playerName'

interface SavedSession {
  roomCode: string
  playerId: string
  playerName: string
  roomPhase: string
}

interface MainMenuProps {
  onSelectMode: (mode: 'online_create' | 'online_join', playerName: string, roomCode?: string) => void
  onResumeGame: (playerName: string) => void
}

function loadSession(): SavedSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

const btnBase: React.CSSProperties = {
  padding: '14px 40px',
  fontSize: 17,
  fontWeight: 600,
  borderRadius: 12,
  border: 'none',
  color: '#fff',
  width: 320,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  letterSpacing: 0.3,
}

const inputStyle: React.CSSProperties = {
  padding: '14px 20px',
  fontSize: 17,
  borderRadius: 12,
  border: '2px solid rgba(255,255,255,0.1)',
  background: 'rgba(255,255,255,0.06)',
  color: '#e8e6e1',
  width: 320,
  textAlign: 'center',
  fontFamily: "'Outfit', sans-serif",
  outline: 'none',
  transition: 'border-color 0.2s, background 0.2s',
}

export function MainMenu({ onSelectMode, onResumeGame }: MainMenuProps) {
  const [playerName, setPlayerName] = useState(() => {
    try { return localStorage.getItem(NAME_KEY) || '' } catch { return '' }
  })
  const [joinCode, setJoinCode] = useState('')
  const [savedSession, setSavedSession] = useState<SavedSession | null>(null)

  useEffect(() => {
    const session = loadSession()
    if (session) setSavedSession(session)
  }, [])

  function updateName(name: string) {
    setPlayerName(name)
    try { localStorage.setItem(NAME_KEY, name) } catch {}
  }

  function handleCreate() {
    if (playerName.trim()) {
      onSelectMode('online_create', playerName.trim())
    }
  }

  function handleJoin() {
    if (playerName.trim() && joinCode.trim()) {
      onSelectMode('online_join', playerName.trim(), joinCode.trim().toUpperCase())
    }
  }

  const enabled = playerName.trim()

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 22,
      marginTop: '12vh',
      animation: 'fadeIn 0.5s ease',
    }}>
      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 56,
          fontWeight: 900,
          background: 'linear-gradient(135deg, #c9a84c, #f0d78c, #c9a84c)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: 1,
          lineHeight: 1.1,
        }}>
          Soltan Hokm
        </h1>
        <p style={{
          color: 'rgba(232,230,225,0.4)',
          fontSize: '0.9rem',
          fontWeight: 300,
          marginTop: 6,
          letterSpacing: 3,
          textTransform: 'uppercase',
        }}>
          Card Game
        </p>
      </div>

      {/* Resume */}
      {savedSession && (
        <button
          onClick={() => onResumeGame(savedSession.playerName)}
          style={{
            ...btnBase,
            background: 'linear-gradient(135deg, #2ecc71, #27ae60)',
            boxShadow: '0 4px 16px rgba(46,204,113,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 6px 24px rgba(46,204,113,0.4)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(46,204,113,0.3)'
          }}
        >
          <span style={{ fontSize: 18 }}>&#9654;</span>
          Resume Game
        </button>
      )}

      {/* Name input */}
      <input
        placeholder="Enter your name"
        value={playerName}
        onChange={(e) => updateName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && playerName.trim()) {
            handleCreate()
          }
        }}
        style={inputStyle}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = 'rgba(201,168,76,0.5)'
          e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
          e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
        }}
      />

      <button
        onClick={handleCreate}
        disabled={!enabled}
        style={{
          ...btnBase,
          background: enabled
            ? 'linear-gradient(135deg, #3a7cbd, #2d6aad)'
            : 'rgba(255,255,255,0.08)',
          boxShadow: enabled ? '0 4px 16px rgba(58,124,189,0.25)' : 'none',
          cursor: enabled ? 'pointer' : 'not-allowed',
          opacity: enabled ? 1 : 0.5,
        }}
        onMouseEnter={(e) => {
          if (enabled) {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 6px 24px rgba(58,124,189,0.35)'
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = enabled ? '0 4px 16px rgba(58,124,189,0.25)' : 'none'
        }}
      >
        Create Room
      </button>

      <div style={{ display: 'flex', gap: 10, width: 320 }}>
        <input
          placeholder="Code"
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleJoin()
          }}
          style={{
            ...inputStyle,
            width: 160,
            letterSpacing: 6,
            textTransform: 'uppercase',
            fontFamily: "'Outfit', monospace",
            fontWeight: 600,
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'rgba(201,168,76,0.5)'
            e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
            e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
          }}
        />
        <button
          onClick={handleJoin}
          disabled={!enabled || !joinCode.trim()}
          style={{
            ...btnBase,
            width: 'auto',
            flex: 1,
            padding: '14px 20px',
            background: enabled && joinCode.trim()
              ? 'linear-gradient(135deg, #3a7cbd, #2d6aad)'
              : 'rgba(255,255,255,0.08)',
            boxShadow: enabled && joinCode.trim() ? '0 4px 16px rgba(58,124,189,0.25)' : 'none',
            cursor: enabled && joinCode.trim() ? 'pointer' : 'not-allowed',
            opacity: enabled && joinCode.trim() ? 1 : 0.5,
          }}
        >
          Join
        </button>
      </div>
    </div>
  )
}
