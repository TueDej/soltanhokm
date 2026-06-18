import { useState } from 'react'
import { MessageType, type OutgoingMessage, type ServerMessage } from './types/socket'
import type { GameState } from './types/game'
import type { Card } from './types/card'
import { useSocket } from './hooks/useSocket'
import { GameBoard } from './components/GameBoard'

const WS_URL = import.meta.env.VITE_WS_URL ?? 'ws://localhost:8080'

export default function App() {
  const [playerName, setPlayerName] = useState('')
  const [game, setGame] = useState<GameState | null>(null)
  const [playerId, setPlayerId] = useState('')
  const [error, setError] = useState('')

  const { send, onMessage } = useSocket(WS_URL)

  onMessage((msg: ServerMessage) => {
    setError('')
    if (msg.type === MessageType.Error) {
      setError((msg.payload as { message: string }).message)
    } else if (msg.type === MessageType.GameState) {
      const gs = msg.payload as GameState
      setGame(gs)
    }
  })

  function joinGame() {
    if (!playerName.trim()) return
    const id = crypto.randomUUID()
    setPlayerId(id)
    send({
      type: MessageType.JoinGame,
      payload: { playerName: playerName.trim(), gameId: id },
    } as OutgoingMessage)
  }

  function playCard(card: Card) {
    if (!game) return
    send({
      type: MessageType.PlayCard,
      payload: { card },
    } as OutgoingMessage)
  }

  if (!game) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginTop: 100 }}>
        <h1>سلطان حکم</h1>
        <input
          placeholder="نام خود را وارد کنید"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && joinGame()}
          style={{ padding: '8px 16px', fontSize: 16, borderRadius: 6, border: 'none' }}
        />
        <button onClick={joinGame} style={{ padding: '8px 24px', fontSize: 16, borderRadius: 6, border: 'none', background: '#2d8a3e', color: '#fff', cursor: 'pointer' }}>
          ورود به بازی
        </button>
        {error && <p style={{ color: '#e74c3c' }}>{error}</p>}
      </div>
    )
  }

  return <GameBoard game={game} playerId={playerId} onPlayCard={playCard} />
}