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
  onSelectMode: (mode: 'online_create' | 'online_join', playerName: string, roomCode?: string, handsToWin?: number) => void
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
  fontSize: 14,
  fontWeight: 400,
  borderRadius: 6,
  border: '2px solid rgba(197,163,90,0.25)',
  color: '#e8e4da',
  width: 320,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  fontFamily: "'Science Gothic', cursive",
  textTransform: 'uppercase',
  background: 'rgba(26,46,71,0.8)',
  backdropFilter: 'blur(4px)',
}

const inputStyle: React.CSSProperties = {
  padding: '14px 20px',
  fontSize: 18,
  borderRadius: 6,
  border: '2px solid rgba(197,163,90,0.2)',
  background: 'rgba(17,31,51,0.9)',
  color: '#e8e4da',
  width: 320,
  textAlign: 'center',
  fontFamily: "'Science Gothic', cursive",
  outline: 'none',
  letterSpacing: 2,
}

export function MainMenu({ onSelectMode, onResumeGame }: MainMenuProps) {
  const [playerName, setPlayerName] = useState(() => {
    try { return localStorage.getItem(NAME_KEY) || '' } catch { return '' }
  })
  const [joinCode, setJoinCode] = useState('')
  const [handsToWin, setHandsToWin] = useState(7)
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
      onSelectMode('online_create', playerName.trim(), undefined, handsToWin)
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
          fontFamily: "'Science Gothic', cursive",
          fontSize: 36,
          fontWeight: 400,
          color: '#e8e4da',
          textShadow: '0 2px 12px rgba(197,163,90,0.25), 0 0 40px rgba(197,163,90,0.08)',
          letterSpacing: 4,
          lineHeight: 1.3,
        }}>
          SOLTAN HOKM
        </h1>
        <div style={{
          width: 60,
          height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(197,163,90,0.5), transparent)',
          margin: '10px auto 6px',
        }} />
        <p style={{
          fontFamily: "'Science Gothic', cursive",
          color: 'rgba(197,163,90,0.6)',
          fontSize: 11,
          fontWeight: 400,
          marginTop: 4,
          letterSpacing: 4,
          textTransform: 'uppercase',
        }}>
          CARD GAME
        </p>
      </div>

      {/* Resume */}
      {savedSession && (
        <button
          onClick={() => onResumeGame(savedSession.playerName)}
          style={{
            ...btnBase,
            background: 'linear-gradient(135deg, #c5a35a 0%, #a88a3e 100%)',
            borderColor: '#c5a35a',
            color: '#0f1b2d',
            fontWeight: 500,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #d4b46a 0%, #b89a4e 100%)'
            e.currentTarget.style.boxShadow = '0 0 20px rgba(197,163,90,0.3)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #c5a35a 0%, #a88a3e 100%)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          RESUME GAME
        </button>
      )}

      {/* Name input */}
      <input
        placeholder="YOUR NAME"
        value={playerName}
        onChange={(e) => updateName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && playerName.trim()) {
            handleCreate()
          }
        }}
        style={inputStyle}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = 'rgba(197,163,90,0.5)'
          e.currentTarget.style.boxShadow = '0 0 16px rgba(197,163,90,0.12)'
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = 'rgba(197,163,90,0.2)'
          e.currentTarget.style.boxShadow = 'none'
        }}
      />

      {/* Games to win selector */}
      <div style={{ display: 'flex', gap: 8, width: 320 }}>
        <span style={{
          fontFamily: "'Science Gothic', cursive",
          fontSize: 10,
          color: 'rgba(197,163,90,0.5)',
          fontWeight: 400,
          alignSelf: 'center',
          whiteSpace: 'nowrap',
        }}>
          WINS:
        </span>
        {[3, 7].map((n) => (
          <button
            key={n}
            onClick={() => setHandsToWin(n)}
            style={{
              flex: 1,
              padding: '10px 0',
              borderRadius: 6,
              border: `2px solid ${handsToWin === n ? 'rgba(197,163,90,0.5)' : 'rgba(197,163,90,0.15)'}`,
              background: handsToWin === n ? 'rgba(197,163,90,0.1)' : 'rgba(17,31,51,0.6)',
              color: handsToWin === n ? '#c5a35a' : 'rgba(197,163,90,0.4)',
              cursor: 'pointer',
              fontSize: 16,
              fontWeight: 400,
              fontFamily: "'Science Gothic', cursive",
              transition: 'all 0.2s ease',
            }}
          >
            {n}
          </button>
        ))}
      </div>

      <button
        onClick={handleCreate}
        disabled={!enabled}
        style={{
          ...btnBase,
          borderColor: enabled ? 'rgba(197,163,90,0.25)' : 'rgba(197,163,90,0.08)',
          color: enabled ? '#e8e4da' : 'rgba(232,228,218,0.2)',
          cursor: enabled ? 'pointer' : 'not-allowed',
          background: enabled ? 'rgba(26,46,71,0.8)' : 'rgba(17,31,51,0.4)',
        }}
        onMouseEnter={(e) => {
          if (enabled) {
            e.currentTarget.style.background = 'rgba(197,163,90,0.12)'
            e.currentTarget.style.borderColor = 'rgba(197,163,90,0.4)'
          }
        }}
        onMouseLeave={(e) => {
          if (enabled) {
            e.currentTarget.style.background = 'rgba(26,46,71,0.8)'
            e.currentTarget.style.borderColor = 'rgba(197,163,90,0.25)'
          }
        }}
      >
        CREATE ROOM
      </button>

      <div style={{ display: 'flex', gap: 10, width: 320 }}>
        <input
          placeholder="CODE"
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
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'rgba(197,163,90,0.5)'
            e.currentTarget.style.boxShadow = '0 0 16px rgba(197,163,90,0.12)'
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'rgba(197,163,90,0.2)'
            e.currentTarget.style.boxShadow = 'none'
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
            borderColor: enabled && joinCode.trim() ? 'rgba(197,163,90,0.25)' : 'rgba(197,163,90,0.08)',
            color: enabled && joinCode.trim() ? '#e8e4da' : 'rgba(232,228,218,0.2)',
            cursor: enabled && joinCode.trim() ? 'pointer' : 'not-allowed',
            background: enabled && joinCode.trim() ? 'rgba(26,46,71,0.8)' : 'rgba(17,31,51,0.4)',
          }}
          onMouseEnter={(e) => {
            if (enabled && joinCode.trim()) {
              e.currentTarget.style.background = 'rgba(197,163,90,0.12)'
              e.currentTarget.style.borderColor = 'rgba(197,163,90,0.4)'
            }
          }}
          onMouseLeave={(e) => {
            if (enabled && joinCode.trim()) {
              e.currentTarget.style.background = 'rgba(26,46,71,0.8)'
              e.currentTarget.style.borderColor = 'rgba(197,163,90,0.25)'
            }
          }}
        >
          JOIN
        </button>
      </div>
    </div>
  )
}
