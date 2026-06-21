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
        fontFamily: "'Playfair Display', serif",
        fontSize: 32,
        fontWeight: 800,
        color: '#e8e6e1',
      }}>
        Room Created
      </h2>

      {/* Room code */}
      <div
        onClick={copyCode}
        style={{
          padding: '16px 32px',
          borderRadius: 16,
          background: 'rgba(201,168,76,0.06)',
          border: '1.5px solid rgba(201,168,76,0.15)',
          cursor: 'pointer',
          textAlign: 'center',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'rgba(201,168,76,0.3)'
          e.currentTarget.style.background = 'rgba(201,168,76,0.1)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'rgba(201,168,76,0.15)'
          e.currentTarget.style.background = 'rgba(201,168,76,0.06)'
        }}
      >
        <p style={{ fontSize: '0.7rem', color: 'rgba(201,168,76,0.5)', marginBottom: 8, fontWeight: 500, textTransform: 'uppercase', letterSpacing: 2 }}>
          Click to copy
        </p>
        <p style={{
          fontSize: 36,
          fontWeight: 700,
          letterSpacing: 10,
          fontFamily: "'Outfit', monospace",
          color: '#c9a84c',
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
            borderRadius: 14,
            background: myTeam === 'ns' ? 'rgba(46,204,113,0.1)' : 'rgba(255,255,255,0.03)',
            border: `1.5px solid ${myTeam === 'ns' ? 'rgba(46,204,113,0.35)' : nsFull ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.08)'}`,
            cursor: nsFull && myTeam !== 'ns' ? 'not-allowed' : 'pointer',
            textAlign: 'center',
            transition: 'all 0.2s',
            opacity: nsFull && myTeam !== 'ns' ? 0.4 : 1,
          }}
        >
          <div style={{ fontSize: '0.7rem', color: '#2ecc71', fontWeight: 600, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
            Green {nsFull && '(Full)'}
          </div>
          {nsPlayers.map((p) => (
            <div key={p.id} style={{
              padding: '6px 10px',
              marginBottom: 4,
              borderRadius: 8,
              background: 'rgba(46,204,113,0.1)',
              fontSize: '0.8rem',
              fontWeight: 500,
            }}>
              {p.name}
              {p.id === playerId && <span style={{ color: '#2ecc71', marginLeft: 4, fontSize: '0.7rem' }}>(you)</span>}
            </div>
          ))}
          {nsPlayers.length === 0 && (
            <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.75rem', padding: '10px 0', fontWeight: 400 }}>Empty</div>
          )}
        </div>

        {/* Red team */}
        <div
          onClick={() => !ewFull && onSelectTeam('ew')}
          style={{
            flex: 1,
            padding: '14px',
            borderRadius: 14,
            background: myTeam === 'ew' ? 'rgba(224,112,96,0.1)' : 'rgba(255,255,255,0.03)',
            border: `1.5px solid ${myTeam === 'ew' ? 'rgba(224,112,96,0.35)' : ewFull ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.08)'}`,
            cursor: ewFull && myTeam !== 'ew' ? 'not-allowed' : 'pointer',
            textAlign: 'center',
            transition: 'all 0.2s',
            opacity: ewFull && myTeam !== 'ew' ? 0.4 : 1,
          }}
        >
          <div style={{ fontSize: '0.7rem', color: '#e07060', fontWeight: 600, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
            Red {ewFull && '(Full)'}
          </div>
          {ewPlayers.map((p) => (
            <div key={p.id} style={{
              padding: '6px 10px',
              marginBottom: 4,
              borderRadius: 8,
              background: 'rgba(224,112,96,0.1)',
              fontSize: '0.8rem',
              fontWeight: 500,
            }}>
              {p.name}
              {p.id === playerId && <span style={{ color: '#e07060', marginLeft: 4, fontSize: '0.7rem' }}>(you)</span>}
            </div>
          ))}
          {ewPlayers.length === 0 && (
            <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.75rem', padding: '10px 0', fontWeight: 400 }}>Empty</div>
          )}
        </div>
      </div>

      {noTeamPlayers.length > 0 && (
        <p style={{ fontSize: '0.75rem', color: 'rgba(232,230,225,0.4)' }}>
          {noTeamPlayers.length} player(s) choosing team...
        </p>
      )}

      <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.25)', textAlign: 'center', fontWeight: 400 }}>
        Click a team to join. Empty seats will be filled with bots.
      </p>

      <div style={{ display: 'flex', gap: 14 }}>
        <button
          onClick={onBack}
          style={{
            padding: '12px 28px',
            borderRadius: 12,
            border: '1.5px solid rgba(255,255,255,0.1)',
            background: 'transparent',
            color: 'rgba(232,230,225,0.5)',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 500,
            fontFamily: "'Outfit', sans-serif",
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'
            e.currentTarget.style.color = 'rgba(232,230,225,0.8)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
            e.currentTarget.style.color = 'rgba(232,230,225,0.5)'
          }}
        >
          Back
        </button>
        {isCreator && (
          <button
            onClick={onStartGame}
            style={{
              padding: '12px 28px',
              borderRadius: 12,
              border: 'none',
              background: 'linear-gradient(135deg, #c9a84c, #b8943f)',
              color: '#fff',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
              fontFamily: "'Outfit', sans-serif",
              boxShadow: '0 4px 16px rgba(201,168,76,0.25)',
              transition: 'all 0.2s',
              letterSpacing: 0.3,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 6px 24px rgba(201,168,76,0.35)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(201,168,76,0.25)'
            }}
          >
            Start Game
          </button>
        )}
      </div>
    </div>
  )
}
