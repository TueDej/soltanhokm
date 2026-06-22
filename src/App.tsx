import { useState, useEffect, useRef } from 'react'
import { TrickPhase } from './types/game'
import type { Suit } from './types/card'
import { GameBoard } from './components/GameBoard'
import { MainMenu } from './components/MainMenu'
import { RoomLobby } from './components/RoomLobby'
import { useOnlineGame } from './hooks/useOnlineGame'
import { useSounds } from './hooks/useSounds'

type Mode = null | 'online'

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
  const [hokmReveal, setHokmReveal] = useState<Suit | null>(null)
  const prevHokmRef = useRef<Suit | undefined>(undefined)

  const onlineGame = useOnlineGame()

  useSounds({
    northSouthScore: onlineGame.game?.northSouthScore ?? 0,
    eastWestScore: onlineGame.game?.eastWestScore ?? 0,
    hokmReveal,
  })

  useEffect(() => {
    const currentHokm = onlineGame.game?.hokmSuit
    if (currentHokm && !prevHokmRef.current) {
      setHokmReveal(currentHokm)
      const timer = setTimeout(() => setHokmReveal(null), 1800)
      return () => clearTimeout(timer)
    }
    prevHokmRef.current = currentHokm
  }, [onlineGame.game?.hokmSuit])

  function handleSelectMode(selectedMode: string, name: string, roomCode?: string) {
    if (selectedMode === 'online_create') {
      setMode('online')
      onlineGame.createRoom(name)
    } else if (selectedMode === 'online_join' && roomCode) {
      setMode('online')
      onlineGame.joinRoom(name, roomCode)
    }
  }

  function handleResumeGame(name: string) {
    setMode('online')
    onlineGame.reconnectToSavedSession(name)
  }

  if (!mode) {
    return <MainMenu onSelectMode={handleSelectMode} onResumeGame={handleResumeGame} />
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
        <>
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
            reconnecting={onlineGame.reconnecting}
          />
          {hokmReveal && (
            <div style={{
              position: 'fixed',
              inset: 0,
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(10,26,18,0.85)',
              backdropFilter: 'blur(8px)',
              animation: 'hokmRevealFade 1.8s ease-in-out forwards',
            }}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
                animation: 'hokmRevealPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}>
                <span style={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: 'rgba(201,168,76,0.7)',
                  fontFamily: "'Estedad', sans-serif",
                  letterSpacing: 1,
                }}>
                  حکم
                </span>
                <span style={{
                  fontSize: '80px',
                  fontFamily: "'Noto Sans Symbols 2', sans-serif",
                  color: hokmReveal === 'hearts' || hokmReveal === 'diamonds' ? '#e07060' : '#c9a84c',
                  textShadow: hokmReveal === 'hearts' || hokmReveal === 'diamonds'
                    ? '0 0 30px rgba(224,112,96,0.7), 0 0 60px rgba(224,112,96,0.3)'
                    : '0 0 30px rgba(201,168,76,0.7), 0 0 60px rgba(201,168,76,0.3)',
                  lineHeight: 1,
                }}>
                  {{ hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' }[hokmReveal]}
                </span>
              </div>
            </div>
          )}
        </>
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
