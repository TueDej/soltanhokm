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
        color: '#7ec8e3',
        textShadow: '3px 3px 0px #1e3a50',
      }}>
        ROOM CREATED
      </h2>

      {/* Room code */}
      <div
        onClick={copyCode}
        style={{
          padding: '16px 32px',
          borderRadius: 4,
          background: '#0f1e2e',
          border: '2px solid #4a90b8',
          cursor: 'pointer',
          textAlign: 'center',
          transition: 'all 0.15s',
          boxShadow: '4px 4px 0px #1e3a50',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#1e3a50'
          e.currentTarget.style.boxShadow = '6px 6px 0px #1e3a50'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#0f1e2e'
          e.currentTarget.style.boxShadow = '4px 4px 0px #1e3a50'
        }}
      >
        <p style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 8,
          color: '#4a6a80',
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
          color: '#7ec8e3',
          textShadow: '2px 2px 0px #1e3a50',
        }}>
          {roomCode}
        </p>
      </div>

      {/* Team selection */}
      <div style={{ display: 'flex', gap: 16, width: '100%', maxWidth: 420 }}>
        {/* Blue team */}
        <div
          onClick={() => !nsFull && onSelectTeam('ns')}
          style={{
            flex: 1,
            padding: '14px',
            borderRadius: 4,
            background: myTeam === 'ns' ? '#0f2530' : '#0c1220',
            border: `2px solid ${myTeam === 'ns' ? '#4a90b8' : nsFull ? '#1a2a35' : '#2a5070'}`,
            cursor: nsFull && myTeam !== 'ns' ? 'not-allowed' : 'pointer',
            textAlign: 'center',
            transition: 'all 0.15s',
            opacity: nsFull && myTeam !== 'ns' ? 0.3 : 1,
            boxShadow: '3px 3px 0px #0a1a28',
          }}
        >
          <div style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 8,
            color: '#7ec8e3',
            marginBottom: 10,
            textTransform: 'uppercase',
          }}>
            BLUE {nsFull && '(FULL)'}
          </div>
          {nsPlayers.map((p) => (
            <div key={p.id} style={{
              padding: '6px 10px',
              marginBottom: 4,
              borderRadius: 4,
              background: '#0f2530',
              border: '1px solid #2a5070',
              fontFamily: "'VT323', monospace",
              fontSize: '1rem',
              color: '#7ec8e3',
            }}>
              {p.name}
              {p.id === playerId && <span style={{ marginLeft: 4, fontSize: '0.8rem' }}>(YOU)</span>}
            </div>
          ))}
          {nsPlayers.length === 0 && (
            <div style={{ fontFamily: "'VT323', monospace", color: '#2a3a45', fontSize: '1rem', padding: '10px 0' }}>EMPTY</div>
          )}
        </div>

        {/* Red team */}
        <div
          onClick={() => !ewFull && onSelectTeam('ew')}
          style={{
            flex: 1,
            padding: '14px',
            borderRadius: 4,
            background: myTeam === 'ew' ? '#2a1020' : '#0c1220',
            border: `2px solid ${myTeam === 'ew' ? '#cc5544' : ewFull ? '#1a2a35' : '#502020'}`,
            cursor: ewFull && myTeam !== 'ew' ? 'not-allowed' : 'pointer',
            textAlign: 'center',
            transition: 'all 0.15s',
            opacity: ewFull && myTeam !== 'ew' ? 0.3 : 1,
            boxShadow: '3px 3px 0px #2a0a10',
          }}
        >
          <div style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 8,
            color: '#ff8a80',
            marginBottom: 10,
            textTransform: 'uppercase',
          }}>
            RED {ewFull && '(FULL)'}
          </div>
          {ewPlayers.map((p) => (
            <div key={p.id} style={{
              padding: '6px 10px',
              marginBottom: 4,
              borderRadius: 4,
              background: '#2a1020',
              border: '1px solid #502020',
              fontFamily: "'VT323', monospace",
              fontSize: '1rem',
              color: '#ff8a80',
            }}>
              {p.name}
              {p.id === playerId && <span style={{ marginLeft: 4, fontSize: '0.8rem' }}>(YOU)</span>}
            </div>
          ))}
          {ewPlayers.length === 0 && (
            <div style={{ fontFamily: "'VT323', monospace", color: '#2a3a45', fontSize: '1rem', padding: '10px 0' }}>EMPTY</div>
          )}
        </div>
      </div>

      {noTeamPlayers.length > 0 && (
        <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: '#4a6a80' }}>
          {noTeamPlayers.length} PLAYER(S) CHOOSING...
        </p>
      )}

      <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: '#2a3a45', textAlign: 'center' }}>
        CLICK A TEAM TO JOIN. EMPTY SEATS = BOTS.
      </p>

      <div style={{ display: 'flex', gap: 14 }}>
        <button
          onClick={onBack}
          style={{
            padding: '12px 28px',
            borderRadius: 4,
            border: '2px solid #4a90b8',
            background: '#0c1220',
            color: '#7ec8e3',
            cursor: 'pointer',
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 10,
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#1e3a50'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#0c1220'
          }}
        >
          BACK
        </button>
        {isCreator && (
          <button
            onClick={onStartGame}
            style={{
              padding: '12px 28px',
              borderRadius: 4,
              border: '2px solid #4a90b8',
              background: '#4a90b8',
              color: '#0c1220',
              cursor: 'pointer',
              fontFamily: "'Press Start 2P', monospace",
              fontSize: 10,
              transition: 'all 0.15s',
              boxShadow: '3px 3px 0px #1e3a50',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '5px 5px 0px #1e3a50'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '3px 3px 0px #1e3a50'
            }}
          >
            START GAME
          </button>
        )}
      </div>
    </div>
  )
}
