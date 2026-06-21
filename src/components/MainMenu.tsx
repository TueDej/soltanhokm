import { useState, useEffect } from 'react'

const STORAGE_KEY = 'soltanhokm_session'

interface SavedSession {
  roomCode: string
  playerId: string
  playerName: string
  roomPhase: string
}

interface MainMenuProps {
  onSelectMode: (mode: 'local' | 'online_create' | 'online_join', playerName: string, roomCode?: string) => void
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

export function MainMenu({ onSelectMode, onResumeGame }: MainMenuProps) {
  const [playerName, setPlayerName] = useState('')
  const [subMode, setSubMode] = useState<'idle' | 'online_options'>('idle')
  const [joinCode, setJoinCode] = useState('')
  const [savedSession, setSavedSession] = useState<SavedSession | null>(null)

  useEffect(() => {
    const session = loadSession()
    if (session) setSavedSession(session)
  }, [])

  function handleLocal() {
    if (playerName.trim()) {
      onSelectMode('local', playerName.trim())
    }
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
      <h1 style={{ fontSize: 48, marginBottom: 10 }}>Soltan Hokm</h1>
      <p style={{ color: '#aaa' }}>Hokm Card Game</p>

      {savedSession && (
        <button
          onClick={() => onResumeGame(savedSession.playerName)}
          style={{
            padding: '14px 40px',
            fontSize: 18,
            borderRadius: 8,
            border: 'none',
            background: '#d4726a',
            color: '#fff',
            cursor: 'pointer',
            width: 320,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <span style={{ fontSize: 20 }}>&#9654;</span>
          Resume Game
        </button>
      )}

      <input
        placeholder="Enter your name"
        value={playerName}
        onChange={(e) => setPlayerName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && playerName.trim()) {
            if (subMode === 'idle') handleLocal()
            else handleCreate()
          }
        }}
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

      {!subMode || subMode === 'idle' ? (
        <>
          <button
            onClick={handleLocal}
            disabled={!playerName.trim()}
            style={{
              padding: '14px 40px',
              fontSize: 18,
              borderRadius: 8,
              border: 'none',
              background: playerName.trim() ? '#4a9d8f' : '#444',
              color: '#fff',
              cursor: playerName.trim() ? 'pointer' : 'not-allowed',
              width: 320,
            }}
          >
            Play vs 3 Bots
          </button>

          <button
            onClick={() => setSubMode('online_options')}
            disabled={!playerName.trim()}
            style={{
              padding: '14px 40px',
              fontSize: 18,
              borderRadius: 8,
              border: 'none',
              background: playerName.trim() ? '#3a7cbd' : '#444',
              color: '#fff',
              cursor: playerName.trim() ? 'pointer' : 'not-allowed',
              width: 320,
            }}
          >
            Play Online
          </button>
        </>
      ) : (
        <>
          <button
            onClick={handleCreate}
            disabled={!playerName.trim()}
            style={{
              padding: '14px 40px',
              fontSize: 18,
              borderRadius: 8,
              border: 'none',
              background: playerName.trim() ? '#3a7cbd' : '#444',
              color: '#fff',
              cursor: playerName.trim() ? 'pointer' : 'not-allowed',
              width: 320,
            }}
          >
            Create Room
          </button>

          <div style={{ display: 'flex', gap: 8, width: 320 }}>
            <input
              placeholder="Room code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleJoin()
              }}
              style={{
                padding: '12px 16px',
                fontSize: 18,
                borderRadius: 8,
                border: '2px solid #444',
                background: '#222',
                color: '#fff',
                width: 160,
                textAlign: 'center',
                letterSpacing: 4,
                textTransform: 'uppercase',
                fontFamily: 'monospace',
              }}
            />
            <button
              onClick={handleJoin}
              disabled={!playerName.trim() || !joinCode.trim()}
              style={{
                padding: '12px 20px',
                fontSize: 18,
                borderRadius: 8,
                border: 'none',
                background: playerName.trim() && joinCode.trim() ? '#3a7cbd' : '#444',
                color: '#fff',
                cursor: playerName.trim() && joinCode.trim() ? 'pointer' : 'not-allowed',
                flex: 1,
              }}
            >
              Join
            </button>
          </div>

          <button
            onClick={() => {
              setSubMode('idle')
              setJoinCode('')
            }}
            style={{
              padding: '8px 16px',
              fontSize: 14,
              borderRadius: 6,
              border: '1px solid #555',
              background: 'transparent',
              color: '#aaa',
              cursor: 'pointer',
            }}
          >
            Back
          </button>
        </>
      )}
    </div>
  )
}
