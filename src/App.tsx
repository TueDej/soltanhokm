import { useState } from 'react'
import { MessageType, type OutgoingMessage, type ServerMessage } from './types/socket'
import type { GameState } from './types/game'
import { TrickPhase } from './types/game'
import type { Card } from './types/card'
import { useSocket } from './hooks/useSocket'
import { GameBoard } from './components/GameBoard'
import { MainMenu } from './components/MainMenu'
import { useLocalGame } from './hooks/useLocalGame'

const WS_URL = import.meta.env.VITE_WS_URL ?? 'ws://localhost:8080'

type Mode = null | 'local' | 'online'

export default function App() {
  const [mode, setMode] = useState<Mode>(null)
  const [playerName, setPlayerName] = useState('')

  const [onlineGame, setOnlineGame] = useState<GameState | null>(null)
  const [playerId, setPlayerId] = useState('')
  void setPlayerId

  const { send, onMessage } = useSocket(WS_URL)

  onMessage((msg: ServerMessage) => {
    if (msg.type === MessageType.GameState) {
      setOnlineGame(msg.payload as GameState)
    }
  })

  const localGame = useLocalGame(playerName)

  function handleSelectMode(selectedMode: Mode, name: string) {
    setPlayerName(name)
    setMode(selectedMode)
  }

  function playOnlineCard(card: Card) {
    if (!onlineGame) return
    send({
      type: MessageType.PlayCard,
      payload: { card },
    } as OutgoingMessage)
  }

  if (!mode) {
    return <MainMenu onSelectMode={handleSelectMode} />
  }

  if (mode === 'local') {
    if (!localGame.game) {
      return (
        <div style={{ textAlign: 'center', marginTop: 60 }}>
          <h2>بازی با ۳ ربات</h2>
          <p style={{ color: '#aaa', marginBottom: 20 }}>
            بازیکن: {playerName}
          </p>
          <button
            onClick={localGame.startGame}
            style={{
              padding: '14px 40px',
              fontSize: 18,
              borderRadius: 8,
              border: 'none',
              background: '#2d8a3e',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            شروع بازی
          </button>
        </div>
      )
    }

    if (localGame.game.phase === TrickPhase.Finished) {
      const nsWins = localGame.game.matchWinner === 'ns'
      return (
        <div style={{ textAlign: 'center', marginTop: 60 }}>
          <h2>بازی تمام شد!</h2>
          <p style={{ color: '#aaa', marginBottom: 10 }}>
            {nsWins ? 'شما بردید!' : 'ربات‌ها بردند.'}
          </p>
          <p style={{ color: '#888', marginBottom: 20 }}>
            ست‌ها: {localGame.game.roundNumber - 1}
          </p>
          <button
            onClick={localGame.startGame}
            style={{
              padding: '14px 40px',
              fontSize: 18,
              borderRadius: 8,
              border: 'none',
              background: '#2d8a3e',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            بازی دوباره
          </button>
        </div>
      )
    }

    const isMyTurn = localGame.game.turn === localGame.game.playerPosition

    return (
      <div>
        <div style={{ textAlign: 'center', padding: 10, color: '#aaa', minHeight: 40 }}>
          {localGame.isThinking && 'در حال فکر...'}
          {!localGame.isThinking && isMyTurn && localGame.game.phase === TrickPhase.ChoosingHokm && (
            <p>نوبت شما: حکم را انتخاب کنید</p>
          )}
          {!localGame.isThinking && isMyTurn && localGame.game.phase === TrickPhase.Playing && (
            <p>نوبت شما: کارت بزنید</p>
          )}
        </div>
        <GameBoard
          game={{
            id: localGame.game.gameId,
            phase: localGame.game.phase,
            players: localGame.game.players,
            hokmSuit: localGame.game.hokmSuit,
            currentTrick: localGame.game.currentTrick,
            northSouthScore: localGame.game.northSouthScore,
            eastWestScore: localGame.game.eastWestScore,
            turn: localGame.game.turn,
          }}
          playerId={localGame.game.playerPosition}
          onPlayCard={localGame.playCard}
          onChooseHokm={localGame.chooseHokm}
        />
      </div>
    )
  }

  if (mode === 'online') {
    return (
      <GameBoard
        game={onlineGame!}
        playerId={playerId}
        onPlayCard={playOnlineCard}
      />
    )
  }

  return null
}
