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
      gap: 20,
      marginTop: 40,
      padding: '0 20px',
    }}>
      <h2 style={{ fontSize: 28 }}>Room Created</h2>

      <div
        onClick={copyCode}
        style={{
          padding: '12px 28px',
          borderRadius: 12,
          background: 'rgba(255,255,255,0.08)',
          border: '2px solid rgba(255,255,255,0.15)',
          cursor: 'pointer',
          textAlign: 'center',
        }}
      >
        <p style={{ fontSize: '0.75rem', color: '#aaa', marginBottom: 6 }}>Room Code (click to copy)</p>
        <p style={{ fontSize: 32, fontWeight: 'bold', letterSpacing: 8, fontFamily: 'monospace' }}>
          {roomCode}
        </p>
      </div>

      {/* Team selection */}
      <div style={{ display: 'flex', gap: 16, width: '100%', maxWidth: 400 }}>
        {/* Green team (N/S) */}
        <div
          onClick={() => !nsFull && onSelectTeam('ns')}
          style={{
            flex: 1,
            padding: '12px',
            borderRadius: 10,
            background: myTeam === 'ns' ? 'rgba(74,157,143,0.2)' : 'rgba(255,255,255,0.04)',
            border: `2px solid ${myTeam === 'ns' ? '#4a9d8f' : nsFull ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)'}`,
            cursor: nsFull && myTeam !== 'ns' ? 'not-allowed' : 'pointer',
            textAlign: 'center',
            transition: 'all 0.2s',
            opacity: nsFull && myTeam !== 'ns' ? 0.5 : 1,
          }}
        >
          <div style={{ fontSize: '0.7rem', color: '#4a9d8f', fontWeight: 'bold', marginBottom: 8 }}>
            Green Team {nsFull && '(Full)'}
          </div>
          {nsPlayers.map((p) => (
            <div key={p.id} style={{
              padding: '4px 8px',
              marginBottom: 4,
              borderRadius: 6,
              background: 'rgba(74,157,143,0.15)',
              fontSize: '0.8rem',
            }}>
              {p.name}
              {p.id === playerId && <span style={{ color: '#4a9d8f', marginLeft: 4 }}>(you)</span>}
            </div>
          ))}
          {nsPlayers.length === 0 && (
            <div style={{ color: '#555', fontSize: '0.75rem', padding: '8px 0' }}>No players</div>
          )}
        </div>

        {/* Red team (E/W) */}
        <div
          onClick={() => !ewFull && onSelectTeam('ew')}
          style={{
            flex: 1,
            padding: '12px',
            borderRadius: 10,
            background: myTeam === 'ew' ? 'rgba(212,114,106,0.2)' : 'rgba(255,255,255,0.04)',
            border: `2px solid ${myTeam === 'ew' ? '#d4726a' : ewFull ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)'}`,
            cursor: ewFull && myTeam !== 'ew' ? 'not-allowed' : 'pointer',
            textAlign: 'center',
            transition: 'all 0.2s',
            opacity: ewFull && myTeam !== 'ew' ? 0.5 : 1,
          }}
        >
          <div style={{ fontSize: '0.7rem', color: '#d4726a', fontWeight: 'bold', marginBottom: 8 }}>
            Red Team {ewFull && '(Full)'}
          </div>
          {ewPlayers.map((p) => (
            <div key={p.id} style={{
              padding: '4px 8px',
              marginBottom: 4,
              borderRadius: 6,
              background: 'rgba(212,114,106,0.15)',
              fontSize: '0.8rem',
            }}>
              {p.name}
              {p.id === playerId && <span style={{ color: '#d4726a', marginLeft: 4 }}>(you)</span>}
            </div>
          ))}
          {ewPlayers.length === 0 && (
            <div style={{ color: '#555', fontSize: '0.75rem', padding: '8px 0' }}>No players</div>
          )}
        </div>
      </div>

      {noTeamPlayers.length > 0 && (
        <p style={{ fontSize: '0.75rem', color: '#aaa' }}>
          {noTeamPlayers.length} player(s) choosing team...
        </p>
      )}

      <p style={{ fontSize: '0.75rem', color: '#666', textAlign: 'center' }}>
        Click a team to join. Empty seats will be filled with bots.
      </p>

      <div style={{ display: 'flex', gap: 12 }}>
        <button
          onClick={onBack}
          style={{
            padding: '10px 24px',
            borderRadius: 8,
            border: '2px solid #555',
            background: 'transparent',
            color: '#aaa',
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          Back
        </button>
        {isCreator && (
          <button
            onClick={onStartGame}
            style={{
              padding: '10px 24px',
              borderRadius: 8,
              border: 'none',
              background: '#4a9d8f',
              color: '#fff',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 'bold',
            }}
          >
            Start Game
          </button>
        )}
      </div>
    </div>
  )
}
