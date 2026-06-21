import { useState } from 'react'
import { TrickPhase } from './types/game'
import { GameBoard } from './components/GameBoard'
import { MainMenu } from './components/MainMenu'
import { RoomLobby } from './components/RoomLobby'
import { useLocalGame } from './hooks/useLocalGame'
import { useOnlineGame } from './hooks/useOnlineGame'

type Mode = null | 'local' | 'online'

export default function App() {
  const [mode, setMode] = useState<Mode>(null)
  const [playerName, setPlayerName] = useState('')

  const localGame = useLocalGame(playerName)
  const onlineGame = useOnlineGame()

  function handleSelectMode(selectedMode: string, name: string, roomCode?: string) {
    setPlayerName(name)
    if (selectedMode === 'local') {
      setMode('local')
    } else if (selectedMode === 'online_create') {
      setMode('online')
      onlineGame.createRoom(name)
    } else if (selectedMode === 'online_join' && roomCode) {
      setMode('online')
      onlineGame.joinRoom(name, roomCode)
    }
  }

  if (!mode) {
    return <MainMenu onSelectMode={handleSelectMode} />
  }

  // --- Local mode ---
  if (mode === 'local') {
    if (!localGame.game) {
      return (
        <div style={{ textAlign: 'center', marginTop: 60 }}>
          <h2>Play vs 3 Bots</h2>
          <p style={{ color: '#aaa', marginBottom: 20 }}>
            Playing with: {playerName}
          </p>
          <button
            onClick={localGame.startGame}
            style={{
              padding: '14px 40px',
              fontSize: 18,
              borderRadius: 8,
              border: 'none',
              background: '#4a9d8f',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            Start Game
          </button>
        </div>
      )
    }

    if (localGame.game.phase === TrickPhase.Finished) {
      const nsWins = localGame.game.matchWinner === 'ns'
      return (
        <div style={{ textAlign: 'center', marginTop: 60 }}>
          <h2>Game Over!</h2>
          <p style={{ color: '#aaa', marginBottom: 10 }}>
            {nsWins ? 'You won!' : 'Bots won.'}
          </p>
          <p style={{ color: '#888', marginBottom: 20 }}>
            Rounds: {localGame.game.roundNumber - 1}
          </p>
          <button
            onClick={localGame.startGame}
            style={{
              padding: '14px 40px',
              fontSize: 18,
              borderRadius: 8,
              border: 'none',
              background: '#4a9d8f',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            Play Again
          </button>
        </div>
      )
    }

    return (
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
        mode="local"
      />
    )
  }

  // --- Online mode ---
  if (mode === 'online') {
    // Lobby
    if (onlineGame.roomPhase === 'lobby') {
      return (
        <RoomLobby
          roomCode={onlineGame.roomCode || ''}
          players={onlineGame.players}
          playerId={onlineGame.playerId}
          onStartGame={onlineGame.startGame}
          onSelectTeam={onlineGame.selectTeam}
          onBack={() => {
            onlineGame.reset()
            setMode(null)
          }}
        />
      )
    }

    // Playing or finished
    if (onlineGame.game) {
      if (onlineGame.roomPhase === 'finished' || onlineGame.game.phase === 'Finished') {
        const nsWins = onlineGame.game.matchWinner === 'ns'
        return (
          <div style={{ textAlign: 'center', marginTop: 60 }}>
            <h2>Game Over!</h2>
            <p style={{ color: '#aaa', marginBottom: 10 }}>
              {nsWins ? 'North-South won!' : 'East-West won!'}
            </p>
            <button
              onClick={() => {
                onlineGame.reset()
                setMode(null)
              }}
              style={{
                padding: '14px 40px',
                fontSize: 18,
                borderRadius: 8,
                border: 'none',
                background: '#4a9d8f',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              Play Again
            </button>
          </div>
        )
      }

      return (
        <GameBoard
          game={{
            id: onlineGame.game.gameId,
            phase: onlineGame.game.phase as unknown as TrickPhase,
            players: onlineGame.game.players.map((p) => ({
              id: p.id,
              name: p.name,
              position: p.position,
              hand: p.id === onlineGame.playerId ? onlineGame.game!.myHand : [],
              tricksWon: p.tricksWon,
              cardCount: p.cardCount,
              team: p.team,
            })),
            hokmSuit: onlineGame.game.hokmSuit,
            hokmPlayer: onlineGame.game.hokmPlayer,
            currentTrick: onlineGame.game.currentTrick,
            northSouthScore: onlineGame.game.northSouthScore,
            eastWestScore: onlineGame.game.eastWestScore,
            nsGamesWon: onlineGame.game.nsGamesWon,
            ewGamesWon: onlineGame.game.ewGamesWon,
            turn: onlineGame.game.turn,
          }}
          playerId={onlineGame.playerId || ''}
          onPlayCard={onlineGame.playCard}
          onChooseHokm={onlineGame.chooseHokm}
          mode="online"
          reconnecting={onlineGame.reconnecting}
        />
      )
    }

    // Waiting for game to start
    return (
      <div style={{ textAlign: 'center', marginTop: 60, color: '#aaa' }}>
        {onlineGame.error ? (
          <>
            <p style={{ color: '#d4726a', marginBottom: 12 }}>{onlineGame.error}</p>
            <button
              onClick={() => {
                onlineGame.reset()
                setMode(null)
              }}
              style={{
                padding: '10px 24px',
                fontSize: 16,
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.1)',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              Go Back
            </button>
          </>
        ) : (
          <p>Connecting to server...</p>
        )}
      </div>
    )
  }

  return null
}
