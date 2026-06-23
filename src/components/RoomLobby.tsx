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
        fontFamily: "'Luckiest Guy', cursive",
        fontSize: 22,
        color: '#f7f5eb',
        textShadow: '3px 3px 0px #0e2a1f',
      }}>
        ROOM CREATED
      </h2>

      {/* Room code */}
      <div
        onClick={copyCode}
        style={{
          padding: '16px 32px',
          borderRadius: 6,
          background: '#143a2e',
          border: '3px solid #2a6b55',
          cursor: 'pointer',
          textAlign: 'center',
          transition: 'all 0.15s',
          boxShadow: '4px 4px 0px #0e2a1f',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#1b4d3e'
          e.currentTarget.style.boxShadow = '6px 6px 0px #0e2a1f'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#143a2e'
          e.currentTarget.style.boxShadow = '4px 4px 0px #0e2a1f'
        }}
      >
        <p style={{
          fontFamily: "'Luckiest Guy', cursive",
          fontSize: 8,
          color: '#2a6b55',
          marginBottom: 8,
          textTransform: 'uppercase',
          letterSpacing: 2,
        }}>
          CLICK TO COPY
        </p>
        <p style={{
          fontFamily: "'Luckiest Guy', cursive",
          fontSize: 24,
          letterSpacing: 6,
          color: '#d4a843',
          textShadow: '2px 2px 0px #6b5020',
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
            borderRadius: 6,
            background: myTeam === 'ns' ? '#1b4d3e' : '#143a2e',
            border: `3px solid ${myTeam === 'ns' ? '#2a6b55' : nsFull ? '#1a3a2e' : '#2a6b55'}`,
            cursor: nsFull && myTeam !== 'ns' ? 'not-allowed' : 'pointer',
            textAlign: 'center',
            transition: 'all 0.15s',
            opacity: nsFull && myTeam !== 'ns' ? 0.3 : 1,
            boxShadow: '3px 3px 0px #0e2a1f',
          }}
        >
          <div style={{
            fontFamily: "'Luckiest Guy', cursive",
            fontSize: 8,
            color: '#f7f5eb',
            marginBottom: 10,
            textTransform: 'uppercase',
          }}>
            GREEN {nsFull && '(FULL)'}
          </div>
          {nsPlayers.map((p) => (
            <div key={p.id} style={{
              padding: '6px 10px',
              marginBottom: 4,
              borderRadius: 4,
              background: '#1b4d3e',
              border: '2px solid #2a6b55',
              fontFamily: "'Luckiest Guy', cursive",
              fontSize: 10,
              color: '#f7f5eb',
            }}>
              {p.name}
              {p.id === playerId && <span style={{ marginLeft: 4, fontSize: '0.8rem' }}>(YOU)</span>}
            </div>
          ))}
          {nsPlayers.length === 0 && (
            <div style={{ fontFamily: "'Luckiest Guy', cursive", color: '#2a6b55', fontSize: 10, padding: '10px 0' }}>EMPTY</div>
          )}
        </div>

        {/* Red team */}
        <div
          onClick={() => !ewFull && onSelectTeam('ew')}
          style={{
            flex: 1,
            padding: '14px',
            borderRadius: 6,
            background: myTeam === 'ew' ? '#3a1a1a' : '#143a2e',
            border: `3px solid ${myTeam === 'ew' ? '#c23a3a' : ewFull ? '#1a3a2e' : '#c23a3a'}`,
            cursor: ewFull && myTeam !== 'ew' ? 'not-allowed' : 'pointer',
            textAlign: 'center',
            transition: 'all 0.15s',
            opacity: ewFull && myTeam !== 'ew' ? 0.3 : 1,
            boxShadow: '3px 3px 0px #0e2a1f',
          }}
        >
          <div style={{
            fontFamily: "'Luckiest Guy', cursive",
            fontSize: 8,
            color: '#c23a3a',
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
              background: '#3a1a1a',
              border: '2px solid #c23a3a',
              fontFamily: "'Luckiest Guy', cursive",
              fontSize: 10,
              color: '#c23a3a',
            }}>
              {p.name}
              {p.id === playerId && <span style={{ marginLeft: 4, fontSize: '0.8rem' }}>(YOU)</span>}
            </div>
          ))}
          {ewPlayers.length === 0 && (
            <div style={{ fontFamily: "'Luckiest Guy', cursive", color: '#2a6b55', fontSize: 10, padding: '10px 0' }}>EMPTY</div>
          )}
        </div>
      </div>

      {noTeamPlayers.length > 0 && (
        <p style={{ fontFamily: "'Luckiest Guy', cursive", fontSize: 8, color: '#2a6b55' }}>
          {noTeamPlayers.length} PLAYER(S) CHOOSING...
        </p>
      )}

      <p style={{ fontFamily: "'Luckiest Guy', cursive", fontSize: 8, color: '#2a6b55', textAlign: 'center' }}>
        CLICK A TEAM TO JOIN. EMPTY SEATS = BOTS.
      </p>

      <div style={{ display: 'flex', gap: 14 }}>
        <button
          onClick={onBack}
          style={{
            padding: '12px 28px',
            borderRadius: 6,
            border: '3px solid #2a6b55',
            background: '#143a2e',
            color: '#f7f5eb',
            cursor: 'pointer',
            fontFamily: "'Luckiest Guy', cursive",
            fontSize: 10,
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#1b4d3e'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#143a2e'
          }}
        >
          BACK
        </button>
        {isCreator && (
          <button
            onClick={onStartGame}
            style={{
              padding: '12px 28px',
              borderRadius: 6,
              border: '3px solid #d4a843',
              background: '#d4a843',
              color: '#1b4d3e',
              cursor: 'pointer',
              fontFamily: "'Luckiest Guy', cursive",
              fontSize: 10,
              transition: 'all 0.15s',
              boxShadow: '3px 3px 0px #6b5020',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '5px 5px 0px #6b5020'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '3px 3px 0px #6b5020'
            }}
          >
            START GAME
          </button>
        )}
      </div>
    </div>
  )
}
