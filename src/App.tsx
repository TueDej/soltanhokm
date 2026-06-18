import { useState } from 'react'
import { MessageType, type OutgoingMessage, type ServerMessage } from './types/socket'
import type { GameState } from './types/game'
import { TrickPhase } from './types/game'
import type { Card } from './types/card'
import { useSocket } from './hooks/useSocket'
import { GameBoard } from './components/GameBoard'
import { MainMenu } from './components/MainMenu'
import { useLocalGame } from './hooks/useLocalGame'
import { LanguageToggle } from './components/LanguageToggle'
import { useLanguage } from './context/LanguageContext'

const WS_URL = import.meta.env.VITE_WS_URL ?? 'ws://localhost:8080'

type Mode = null | 'local' | 'online'

export default function App() {
  const [mode, setMode] = useState<Mode>(null)
  const [playerName, setPlayerName] = useState('')
  const { t } = useLanguage()

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
    return (
      <>
        <LanguageToggle />
        <MainMenu onSelectMode={handleSelectMode} />
      </>
    )
  }

  if (mode === 'local') {
    if (!localGame.game) {
      return (
        <>
          <LanguageToggle />
          <div style={{ textAlign: 'center', marginTop: 60 }}>
            <h2>{t('playVs3Bots')}</h2>
            <p style={{ color: '#aaa', marginBottom: 20 }}>
              {t('playingWith')}: {playerName}
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
              {t('startGame')}
            </button>
          </div>
        </>
      )
    }

    if (localGame.game.phase === TrickPhase.Finished) {
      const nsWins = localGame.game.matchWinner === 'ns'
      return (
        <>
          <LanguageToggle />
          <div style={{ textAlign: 'center', marginTop: 60 }}>
            <h2>{t('gameFinished')}</h2>
            <p style={{ color: '#aaa', marginBottom: 10 }}>
              {nsWins ? t('youWon') : t('botsWon')}
            </p>
            <p style={{ color: '#888', marginBottom: 20 }}>
              {t('rounds')}: {localGame.game.roundNumber - 1}
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
              {t('playAgain')}
            </button>
          </div>
        </>
      )
    }

    const isMyTurn = localGame.game.turn === localGame.game.playerPosition

    return (
      <>
        <LanguageToggle />
        <div>
          <div style={{ textAlign: 'center', padding: 10, color: '#aaa', minHeight: 40 }}>
            {localGame.isThinking && t('thinking')}
            {!localGame.isThinking && isMyTurn && localGame.game.phase === TrickPhase.ChoosingHokm && (
              <p>{t('chooseHokm')}</p>
            )}
            {!localGame.isThinking && isMyTurn && localGame.game.phase === TrickPhase.Playing && (
              <p>{t('yourTurn')}</p>
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
      </>
    )
  }

  if (mode === 'online') {
    return (
      <>
        <LanguageToggle />
        <GameBoard
          game={onlineGame!}
          playerId={playerId}
          onPlayCard={playOnlineCard}
        />
      </>
    )
  }

  return null
}
