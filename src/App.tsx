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
  fontSize: 18,
  fontWeight: 400,
  borderRadius: 4,
  border: '2px solid #4a90b8',
  color: '#7ec8e3',
  cursor: 'pointer',
  fontFamily: "'Press Start 2P', monospace",
  letterSpacing: 0,
  transition: 'all 0.15s',
  textTransform: 'uppercase',
  background: '#0c1220',
}

const screenStyle: React.CSSProperties = {
  textAlign: 'center',
  marginTop: '12vh',
  animation: 'fadeIn 0.5s ease',
}

const titleStyle: React.CSSProperties = {
  fontFamily: "'Press Start 2P', monospace",
  fontSize: 28,
  fontWeight: 400,
  marginBottom: 12,
  color: '#7ec8e3',
  textShadow: '3px 3px 0px #1e3a50',
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

  function handleSelectMode(selectedMode: string, name: string, roomCode?: string, handsToWin?: number) {
    if (selectedMode === 'online_create') {
      setMode('online')
      onlineGame.createRoom(name, handsToWin)
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
            <h2 style={titleStyle}>GAME OVER</h2>
            <p style={{
              color: nsWins ? '#7ec8e3' : '#ff8a80',
              fontSize: '1.2rem',
              fontWeight: 400,
              marginBottom: 24,
              fontFamily: "'Press Start 2P', monospace",
              textShadow: nsWins
                ? '2px 2px 0px #1e3a50'
                : '2px 2px 0px #502020',
            }}>
              {nsWins ? 'BLUE WINS!' : 'RED WINS!'}
            </p>
            <button
              onClick={() => {
                onlineGame.reset()
                setMode(null)
              }}
              style={btnStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#4a90b8'
                e.currentTarget.style.color = '#0c1220'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#0c1220'
                e.currentTarget.style.color = '#7ec8e3'
              }}
            >
              PLAY AGAIN
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
              handsToWin: onlineGame.game.handsToWin,
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
              background: 'rgba(12,18,32,0.92)',
              animation: 'hokmRevealFade 1.8s ease-in-out forwards',
            }}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 16,
                animation: 'hokmRevealPop 0.3s ease-out',
              }}>
                <span style={{
                  fontSize: '1rem',
                  fontFamily: "'Press Start 2P', monospace",
                  color: '#7ec8e3',
                  textShadow: '2px 2px 0px #1e3a50',
                  letterSpacing: 2,
                }}>
                  HOKM
                </span>
                <span style={{
                  fontSize: '80px',
                  fontFamily: "'VT323', monospace",
                  color: hokmReveal === 'hearts' || hokmReveal === 'diamonds' ? '#ff8a80' : '#7ec8e3',
                  textShadow: hokmReveal === 'hearts' || hokmReveal === 'diamonds'
                    ? '4px 4px 0px #502020, 0 0 20px rgba(255,138,128,0.3)'
                    : '4px 4px 0px #1e3a50, 0 0 20px rgba(126,200,227,0.3)',
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
        color: '#7ec8e3',
        opacity: 0.5,
      }}>
        {onlineGame.error ? (
          <>
            <p style={{ color: '#ff8a80', marginBottom: 16, fontFamily: "'Press Start 2P', monospace", fontSize: 12 }}>{onlineGame.error}</p>
            <button
              onClick={() => {
                onlineGame.reset()
                setMode(null)
              }}
              style={{
                ...btnStyle,
                padding: '12px 28px',
                fontSize: 12,
              }}
            >
              GO BACK
            </button>
          </>
        ) : (
          <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 12 }}>CONNECTING...</p>
        )}
      </div>
    )
  }

  return null
}
