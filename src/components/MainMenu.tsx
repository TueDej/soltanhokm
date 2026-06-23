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
  borderRadius: 4,
  border: '2px solid #4a90b8',
  color: '#7ec8e3',
  width: 320,
  cursor: 'pointer',
  transition: 'all 0.15s',
  fontFamily: "'Press Start 2P', monospace",
  textTransform: 'uppercase',
  background: '#0c1220',
}

const inputStyle: React.CSSProperties = {
  padding: '14px 20px',
  fontSize: 18,
  borderRadius: 4,
  border: '2px solid #4a90b8',
  background: '#0c1220',
  color: '#7ec8e3',
  width: 320,
  textAlign: 'center',
  fontFamily: "'VT323', monospace",
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
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 32,
          fontWeight: 400,
          color: '#7ec8e3',
          textShadow: '4px 4px 0px #1e3a50',
          letterSpacing: 2,
          lineHeight: 1.4,
        }}>
          SOLTAN<br/>HOKM
        </h1>
        <p style={{
          fontFamily: "'Press Start 2P', monospace",
          color: '#4a90b8',
          fontSize: 10,
          fontWeight: 400,
          marginTop: 12,
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
            borderColor: '#5cb870',
            color: '#5cb870',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#5cb870'
            e.currentTarget.style.color = '#0c1220'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#0c1220'
            e.currentTarget.style.color = '#5cb870'
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
          e.currentTarget.style.borderColor = '#7ec8e3'
          e.currentTarget.style.boxShadow = '0 0 10px rgba(126,200,227,0.15)'
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = '#4a90b8'
          e.currentTarget.style.boxShadow = 'none'
        }}
      />

      {/* Games to win selector */}
      <div style={{ display: 'flex', gap: 8, width: 320 }}>
        <span style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 8,
          color: '#4a90b8',
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
              borderRadius: 4,
              border: `2px solid ${handsToWin === n ? '#7ec8e3' : '#2a4a5a'}`,
              background: handsToWin === n ? '#1e3a50' : '#0c1220',
              color: handsToWin === n ? '#7ec8e3' : '#4a6a80',
              cursor: 'pointer',
              fontSize: 16,
              fontWeight: 400,
              fontFamily: "'Press Start 2P', monospace",
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
          borderColor: enabled ? '#4a90b8' : '#1a2a35',
          color: enabled ? '#7ec8e3' : '#1a2a35',
          cursor: enabled ? 'pointer' : 'not-allowed',
        }}
        onMouseEnter={(e) => {
          if (enabled) {
            e.currentTarget.style.background = '#4a90b8'
            e.currentTarget.style.color = '#0c1220'
          }
        }}
        onMouseLeave={(e) => {
          if (enabled) {
            e.currentTarget.style.background = '#0c1220'
            e.currentTarget.style.color = '#7ec8e3'
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
            e.currentTarget.style.borderColor = '#7ec8e3'
            e.currentTarget.style.boxShadow = '0 0 10px rgba(126,200,227,0.15)'
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = '#4a90b8'
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
            borderColor: enabled && joinCode.trim() ? '#4a90b8' : '#1a2a35',
            color: enabled && joinCode.trim() ? '#7ec8e3' : '#1a2a35',
            cursor: enabled && joinCode.trim() ? 'pointer' : 'not-allowed',
          }}
          onMouseEnter={(e) => {
            if (enabled && joinCode.trim()) {
              e.currentTarget.style.background = '#4a90b8'
              e.currentTarget.style.color = '#0c1220'
            }
          }}
          onMouseLeave={(e) => {
            if (enabled && joinCode.trim()) {
              e.currentTarget.style.background = '#0c1220'
              e.currentTarget.style.color = '#7ec8e3'
            }
          }}
        >
          JOIN
        </button>
      </div>
    </div>
  )
}
