import type { PlayerInfo } from '../types/socket'

interface RoomLobbyProps {
  roomCode: string
  players: PlayerInfo[]
  playerId: string | null
  onStartGame: () => void
  onSelectTeam: (team: 'ns' | 'ew') => void
  onBack: () => void
}

export function RoomLobby({ roomCode, players, playerId, onStartGame, onSelectTeam, onBack }: RoomLobbyProps) {
  const isCreator = players.length > 0 && players[0].id === playerId
  const me = players.find((p) => p.id === playerId)
  const myTeam = me?.team

  const nsPlayers = players.filter((p) => p.team === 'ns')
  const ewPlayers = players.filter((p) => p.team === 'ew')
  const noTeamPlayers = players.filter((p) => !p.team)
  const nsFull = nsPlayers.length >= 2
  const ewFull = ewPlayers.length >= 2

  function copyCode() {
    navigator.clipboard.writeText(roomCode)
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 24,
      marginTop: '6vh',
      padding: '0 20px',
      animation: 'fadeIn 0.5s ease',
    }}>
      <h2 style={{
        fontFamily: "'Press Start 2P', monospace",
        fontSize: 20,
        color: '#ffff00',
        textShadow: '4px 4px 0px #aa8800',
      }}>
        ROOM CREATED
      </h2>

      {/* Room code */}
      <div
        onClick={copyCode}
        style={{
          padding: '16px 32px',
          borderRadius: 0,
          background: '#0a0a0a',
          border: '3px solid #ffff00',
          cursor: 'pointer',
          textAlign: 'center',
          transition: 'none',
          boxShadow: '4px 4px 0px #aa8800',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#ffff00'
          e.currentTarget.style.boxShadow = '6px 6px 0px #aa8800'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#0a0a0a'
          e.currentTarget.style.boxShadow = '4px 4px 0px #aa8800'
        }}
      >
        <p style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 8,
          color: '#33ff33',
          marginBottom: 8,
          textTransform: 'uppercase',
          letterSpacing: 2,
        }}>
          CLICK TO COPY
        </p>
        <p style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 24,
          letterSpacing: 6,
          color: '#ffff00',
          textShadow: '2px 2px 0px #aa8800',
        }}>
          {roomCode}
        </p>
      </div>

      {/* Team selection */}
      <div style={{ display: 'flex', gap: 16, width: '100%', maxWidth: 420 }}>
        {/* Green team */}
        <div
          onClick={() => !nsFull && onSelectTeam('ns')}
          style={{
            flex: 1,
            padding: '14px',
            borderRadius: 0,
            background: myTeam === 'ns' ? '#0a2a0a' : '#0a0a0a',
            border: `3px solid ${myTeam === 'ns' ? '#33ff33' : nsFull ? '#1a1a1a' : '#33ff33'}`,
            cursor: nsFull && myTeam !== 'ns' ? 'not-allowed' : 'pointer',
            textAlign: 'center',
            transition: 'none',
            opacity: nsFull && myTeam !== 'ns' ? 0.3 : 1,
            boxShadow: '3px 3px 0px #1a5c1a',
          }}
        >
          <div style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 8,
            color: '#33ff33',
            marginBottom: 10,
            textTransform: 'uppercase',
          }}>
            GREEN {nsFull && '(FULL)'}
          </div>
          {nsPlayers.map((p) => (
            <div key={p.id} style={{
              padding: '6px 10px',
              marginBottom: 4,
              borderRadius: 0,
              background: '#0a2a0a',
              border: '1px solid #33ff33',
              fontFamily: "'VT323', monospace",
              fontSize: '1rem',
              color: '#33ff33',
            }}>
              {p.name}
              {p.id === playerId && <span style={{ marginLeft: 4, fontSize: '0.8rem' }}>(YOU)</span>}
            </div>
          ))}
          {nsPlayers.length === 0 && (
            <div style={{ fontFamily: "'VT323', monospace", color: '#333', fontSize: '1rem', padding: '10px 0' }}>EMPTY</div>
          )}
        </div>

        {/* Red team */}
        <div
          onClick={() => !ewFull && onSelectTeam('ew')}
          style={{
            flex: 1,
            padding: '14px',
            borderRadius: 0,
            background: myTeam === 'ew' ? '#2a0a0a' : '#0a0a0a',
            border: `3px solid ${myTeam === 'ew' ? '#ff3333' : ewFull ? '#1a1a1a' : '#ff3333'}`,
            cursor: ewFull && myTeam !== 'ew' ? 'not-allowed' : 'pointer',
            textAlign: 'center',
            transition: 'none',
            opacity: ewFull && myTeam !== 'ew' ? 0.3 : 1,
            boxShadow: '3px 3px 0px #5c1a1a',
          }}
        >
          <div style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 8,
            color: '#ff3333',
            marginBottom: 10,
            textTransform: 'uppercase',
          }}>
            RED {ewFull && '(FULL)'}
          </div>
          {ewPlayers.map((p) => (
            <div key={p.id} style={{
              padding: '6px 10px',
              marginBottom: 4,
              borderRadius: 0,
              background: '#2a0a0a',
              border: '1px solid #ff3333',
              fontFamily: "'VT323', monospace",
              fontSize: '1rem',
              color: '#ff3333',
            }}>
              {p.name}
              {p.id === playerId && <span style={{ marginLeft: 4, fontSize: '0.8rem' }}>(YOU)</span>}
            </div>
          ))}
          {ewPlayers.length === 0 && (
            <div style={{ fontFamily: "'VT323', monospace", color: '#333', fontSize: '1rem', padding: '10px 0' }}>EMPTY</div>
          )}
        </div>
      </div>

      {noTeamPlayers.length > 0 && (
        <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: '#33ff33', opacity: 0.5 }}>
          {noTeamPlayers.length} PLAYER(S) CHOOSING...
        </p>
      )}

      <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: '#33ff33', opacity: 0.3, textAlign: 'center' }}>
        CLICK A TEAM TO JOIN. EMPTY SEATS = BOTS.
      </p>

      <div style={{ display: 'flex', gap: 14 }}>
        <button
          onClick={onBack}
          style={{
            padding: '12px 28px',
            borderRadius: 0,
            border: '3px solid #33ff33',
            background: '#0a0a0a',
            color: '#33ff33',
            cursor: 'pointer',
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 10,
            transition: 'none',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#33ff33'
            e.currentTarget.style.color = '#0a0a0a'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#0a0a0a'
            e.currentTarget.style.color = '#33ff33'
          }}
        >
          BACK
        </button>
        {isCreator && (
          <button
            onClick={onStartGame}
            style={{
              padding: '12px 28px',
              borderRadius: 0,
              border: '3px solid #ffff00',
              background: '#ffff00',
              color: '#0a0a0a',
              cursor: 'pointer',
              fontFamily: "'Press Start 2P', monospace",
              fontSize: 10,
              transition: 'none',
              boxShadow: '3px 3px 0px #aa8800',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '5px 5px 0px #aa8800'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '3px 3px 0px #aa8800'
            }}
          >
            START GAME
          </button>
        )}
      </div>
    </div>
  )
}
