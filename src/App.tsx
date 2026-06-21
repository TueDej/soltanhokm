import { useState } from 'react'
import { TrickPhase } from './types/game'
import { GameBoard } from './components/GameBoard'
import { MainMenu } from './components/MainMenu'
import { RoomLobby } from './components/RoomLobby'
import { useLocalGame } from './hooks/useLocalGame'
import { useOnlineGame } from './hooks/useOnlineGame'

type Mode = null | 'local' | 'online'

const btnStyle: React.CSSProperties = {
  padding: '14px 40px',
  fontSize: 17,
  fontWeight: 600,
  borderRadius: 12,
  border: 'none',
  color: '#fff',
  cursor: 'pointer',
  fontFamily: "'Outfit', sans-serif",
  letterSpacing: 0.3,
  transition: 'all 0.2s',
}

const screenStyle: React.CSSProperties = {
  textAlign: 'center',
  marginTop: '12vh',
  animation: 'fadeIn 0.5s ease',
}

const titleStyle: React.CSSProperties = {
  fontFamily: "'Playfair Display', serif",
  fontSize: 42,
  fontWeight: 800,
  marginBottom: 12,
  color: '#e8e6e1',
}

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

  function handleResumeGame(name: string) {
    setPlayerName(name)
    setMode('online')
    onlineGame.reconnectToSavedSession(name)
  }

  if (!mode) {
    return <MainMenu onSelectMode={handleSelectMode} onResumeGame={handleResumeGame} />
  }

  // --- Local mode ---
  if (mode === 'local') {
    if (!localGame.game) {
      return (
        <div style={screenStyle}>
          <h2 style={titleStyle}>Play vs 3 Bots</h2>
          <p style={{ color: 'rgba(232,230,225,0.4)', marginBottom: 28, fontWeight: 400 }}>
            Playing as: <span style={{ color: '#c9a84c', fontWeight: 500 }}>{playerName}</span>
          </p>
          <button
            onClick={localGame.startGame}
            style={{
              ...btnStyle,
              background: 'linear-gradient(135deg, #c9a84c, #b8943f)',
              boxShadow: '0 4px 16px rgba(201,168,76,0.25)',
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
        </div>
      )
    }

    if (localGame.game.phase === TrickPhase.Finished) {
      const nsWins = localGame.game.matchWinner === 'ns'
      return (
        <div style={screenStyle}>
          <h2 style={titleStyle}>Game Over</h2>
          <p style={{
            color: nsWins ? '#2ecc71' : '#e07060',
            fontSize: '1.1rem',
            fontWeight: 600,
            marginBottom: 8,
          }}>
            {nsWins ? 'You won!' : 'Bots won.'}
          </p>
          <p style={{ color: 'rgba(232,230,225,0.3)', marginBottom: 28, fontWeight: 400 }}>
            Rounds: {localGame.game.roundNumber - 1}
          </p>
          <button
            onClick={localGame.startGame}
            style={{
              ...btnStyle,
              background: 'linear-gradient(135deg, #c9a84c, #b8943f)',
              boxShadow: '0 4px 16px rgba(201,168,76,0.25)',
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
          hokmPlayer: localGame.game.hokmPlayer,
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

    if (onlineGame.game) {
      if (onlineGame.roomPhase === 'finished' || onlineGame.game.phase === 'Finished') {
        const nsWins = onlineGame.game.matchWinner === 'ns'
        return (
          <div style={screenStyle}>
            <h2 style={titleStyle}>Game Over</h2>
            <p style={{
              color: nsWins ? '#2ecc71' : '#e07060',
              fontSize: '1.1rem',
              fontWeight: 600,
              marginBottom: 24,
            }}>
              {nsWins ? 'North-South won!' : 'East-West won!'}
            </p>
            <button
              onClick={() => {
                onlineGame.reset()
                setMode(null)
              }}
              style={{
                ...btnStyle,
                background: 'linear-gradient(135deg, #c9a84c, #b8943f)',
                boxShadow: '0 4px 16px rgba(201,168,76,0.25)',
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

    return (
      <div style={{
        ...screenStyle,
        color: 'rgba(232,230,225,0.4)',
      }}>
        {onlineGame.error ? (
          <>
            <p style={{ color: '#e07060', marginBottom: 16, fontWeight: 500 }}>{onlineGame.error}</p>
            <button
              onClick={() => {
                onlineGame.reset()
                setMode(null)
              }}
              style={{
                ...btnStyle,
                padding: '12px 28px',
                fontSize: 15,
                background: 'transparent',
                border: '1.5px solid rgba(255,255,255,0.12)',
                color: 'rgba(232,230,225,0.6)',
              }}
            >
              Go Back
            </button>
          </>
        ) : (
          <p style={{ fontWeight: 400 }}>Connecting to server...</p>
        )}
      </div>
    )
  }

  return null
}
