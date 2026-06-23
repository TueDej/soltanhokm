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
  border: '3px solid #2a6b55',
  color: '#f7f5eb',
  width: 320,
  cursor: 'pointer',
  transition: 'all 0.15s',
  fontFamily: "'Science Gothic', cursive",
  textTransform: 'uppercase',
  background: '#143a2e',
}

const inputStyle: React.CSSProperties = {
  padding: '14px 20px',
  fontSize: 18,
  borderRadius: 6,
  border: '3px solid #2a6b55',
  background: '#143a2e',
  color: '#f7f5eb',
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
          color: '#f7f5eb',
          textShadow: '4px 4px 0px #0e2a1f',
          letterSpacing: 2,
          lineHeight: 1.3,
        }}>
          SOLTAN HOKM
        </h1>
        <p style={{
          fontFamily: "'Science Gothic', cursive",
          color: '#2a6b55',
          fontSize: 12,
          fontWeight: 400,
          marginTop: 8,
          letterSpacing: 3,
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
            background: '#d4a843',
            borderColor: '#d4a843',
            color: '#1b4d3e',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#e8bc5a'
            e.currentTarget.style.borderColor = '#e8bc5a'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#d4a843'
            e.currentTarget.style.borderColor = '#d4a843'
          }}
        >
          ▶ RESUME GAME
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
          e.currentTarget.style.borderColor = '#d4a843'
          e.currentTarget.style.boxShadow = '0 0 10px rgba(212,168,67,0.2)'
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = '#2a6b55'
          e.currentTarget.style.boxShadow = 'none'
        }}
      />

      {/* Games to win selector */}
      <div style={{ display: 'flex', gap: 8, width: 320 }}>
        <span style={{
          fontFamily: "'Science Gothic', cursive",
          fontSize: 10,
          color: '#2a6b55',
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
              border: `3px solid ${handsToWin === n ? '#d4a843' : '#2a6b55'}`,
              background: handsToWin === n ? '#1b4d3e' : '#143a2e',
              color: handsToWin === n ? '#d4a843' : '#2a6b55',
              cursor: 'pointer',
              fontSize: 16,
              fontWeight: 400,
              fontFamily: "'Science Gothic', cursive",
              transition: 'all 0.15s',
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
          borderColor: enabled ? '#2a6b55' : '#1a3a2e',
          color: enabled ? '#f7f5eb' : '#1a3a2e',
          cursor: enabled ? 'pointer' : 'not-allowed',
        }}
        onMouseEnter={(e) => {
          if (enabled) {
            e.currentTarget.style.background = '#2a6b55'
          }
        }}
        onMouseLeave={(e) => {
          if (enabled) {
            e.currentTarget.style.background = '#143a2e'
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
            e.currentTarget.style.borderColor = '#d4a843'
            e.currentTarget.style.boxShadow = '0 0 10px rgba(212,168,67,0.2)'
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = '#2a6b55'
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
            borderColor: enabled && joinCode.trim() ? '#2a6b55' : '#1a3a2e',
            color: enabled && joinCode.trim() ? '#f7f5eb' : '#1a3a2e',
            cursor: enabled && joinCode.trim() ? 'pointer' : 'not-allowed',
          }}
          onMouseEnter={(e) => {
            if (enabled && joinCode.trim()) {
              e.currentTarget.style.background = '#2a6b55'
            }
          }}
          onMouseLeave={(e) => {
            if (enabled && joinCode.trim()) {
              e.currentTarget.style.background = '#143a2e'
            }
          }}
        >
          JOIN
        </button>
      </div>
    </div>
  )
}
