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
        fontFamily: "'Science Gothic', cursive",
        fontSize: 22,
        color: '#e8e4da',
        textShadow: '0 2px 12px rgba(197,163,90,0.2)',
        letterSpacing: 2,
      }}>
        ROOM CREATED
      </h2>

      {/* Room code */}
      <div
        onClick={copyCode}
        style={{
          padding: '16px 32px',
          borderRadius: 8,
          background: 'rgba(26,46,71,0.6)',
          border: '2px solid rgba(197,163,90,0.2)',
          cursor: 'pointer',
          textAlign: 'center',
          transition: 'all 0.2s ease',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'rgba(197,163,90,0.4)'
          e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.3), 0 0 20px rgba(197,163,90,0.08)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'rgba(197,163,90,0.2)'
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.2)'
        }}
      >
        <p style={{
          fontFamily: "'Science Gothic', cursive",
          fontSize: 8,
          color: 'rgba(197,163,90,0.5)',
          marginBottom: 8,
          textTransform: 'uppercase',
          letterSpacing: 2,
        }}>
          CLICK TO COPY
        </p>
        <p style={{
          fontFamily: "'Science Gothic', cursive",
          fontSize: 24,
          letterSpacing: 6,
          color: '#c5a35a',
          textShadow: '0 2px 8px rgba(197,163,90,0.2)',
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
            borderRadius: 8,
            background: myTeam === 'ns' ? 'rgba(26,46,71,0.7)' : 'rgba(17,31,51,0.6)',
            border: `2px solid ${myTeam === 'ns' ? 'rgba(74,144,126,0.5)' : nsFull ? 'rgba(74,144,126,0.1)' : 'rgba(74,144,126,0.2)'}`,
            cursor: nsFull && myTeam !== 'ns' ? 'not-allowed' : 'pointer',
            textAlign: 'center',
            transition: 'all 0.2s ease',
            opacity: nsFull && myTeam !== 'ns' ? 0.3 : 1,
            boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
          }}
        >
          <div style={{
            fontFamily: "'Science Gothic', cursive",
            fontSize: 8,
            color: '#4a907e',
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
              background: 'rgba(74,144,126,0.1)',
              border: '1px solid rgba(74,144,126,0.2)',
              fontFamily: "'Science Gothic', cursive",
              fontSize: 10,
              color: '#e8e4da',
            }}>
              {p.name}
              {p.id === playerId && <span style={{ marginLeft: 4, fontSize: '0.8rem' }}>(YOU)</span>}
            </div>
          ))}
          {nsPlayers.length === 0 && (
            <div style={{ fontFamily: "'Science Gothic', cursive", color: 'rgba(74,144,126,0.4)', fontSize: 10, padding: '10px 0' }}>EMPTY</div>
          )}
        </div>

        {/* Red team */}
        <div
          onClick={() => !ewFull && onSelectTeam('ew')}
          style={{
            flex: 1,
            padding: '14px',
            borderRadius: 8,
            background: myTeam === 'ew' ? 'rgba(120,45,45,0.3)' : 'rgba(17,31,51,0.6)',
            border: `2px solid ${myTeam === 'ew' ? 'rgba(180,70,70,0.5)' : ewFull ? 'rgba(180,70,70,0.1)' : 'rgba(180,70,70,0.2)'}`,
            cursor: ewFull && myTeam !== 'ew' ? 'not-allowed' : 'pointer',
            textAlign: 'center',
            transition: 'all 0.2s ease',
            opacity: ewFull && myTeam !== 'ew' ? 0.3 : 1,
            boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
          }}
        >
          <div style={{
            fontFamily: "'Science Gothic', cursive",
            fontSize: 8,
            color: '#b44646',
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
              background: 'rgba(180,70,70,0.1)',
              border: '1px solid rgba(180,70,70,0.2)',
              fontFamily: "'Science Gothic', cursive",
              fontSize: 10,
              color: '#e8e4da',
            }}>
              {p.name}
              {p.id === playerId && <span style={{ marginLeft: 4, fontSize: '0.8rem' }}>(YOU)</span>}
            </div>
          ))}
          {ewPlayers.length === 0 && (
            <div style={{ fontFamily: "'Science Gothic', cursive", color: 'rgba(180,70,70,0.4)', fontSize: 10, padding: '10px 0' }}>EMPTY</div>
          )}
        </div>
      </div>

      {noTeamPlayers.length > 0 && (
        <p style={{ fontFamily: "'Science Gothic', cursive", fontSize: 8, color: 'rgba(197,163,90,0.4)', textAlign: 'center' }}>
          {noTeamPlayers.length} PLAYER(S) CHOOSING...
        </p>
      )}

      <p style={{ fontFamily: "'Science Gothic', cursive", fontSize: 8, color: 'rgba(197,163,90,0.35)', textAlign: 'center' }}>
        CLICK A TEAM TO JOIN. EMPTY SEATS = BOTS.
      </p>

      <div style={{ display: 'flex', gap: 14 }}>
        <button
          onClick={onBack}
          style={{
            padding: '12px 28px',
            borderRadius: 6,
            border: '2px solid rgba(197,163,90,0.15)',
            background: 'rgba(26,46,71,0.6)',
            color: '#e8e4da',
            cursor: 'pointer',
            fontFamily: "'Science Gothic', cursive",
            fontSize: 10,
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(26,46,71,0.9)'
            e.currentTarget.style.borderColor = 'rgba(197,163,90,0.3)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(26,46,71,0.6)'
            e.currentTarget.style.borderColor = 'rgba(197,163,90,0.15)'
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
              border: '2px solid rgba(197,163,90,0.4)',
              background: 'linear-gradient(135deg, rgba(197,163,90,0.9) 0%, rgba(168,138,62,0.9) 100%)',
              color: '#0f1b2d',
              cursor: 'pointer',
              fontFamily: "'Science Gothic', cursive",
              fontSize: 10,
              transition: 'all 0.2s ease',
              fontWeight: 500,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(212,180,106,0.95) 0%, rgba(184,154,78,0.95) 100%)'
              e.currentTarget.style.boxShadow = '0 0 20px rgba(197,163,90,0.3)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(197,163,90,0.9) 0%, rgba(168,138,62,0.9) 100%)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            START GAME
          </button>
        )}
      </div>
    </div>
  )
}
