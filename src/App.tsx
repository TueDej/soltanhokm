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
  borderRadius: 6,
  border: '2px solid rgba(197,163,90,0.25)',
  color: '#e8e4da',
  cursor: 'pointer',
  fontFamily: "'Science Gothic', cursive",
  letterSpacing: 0,
  transition: 'all 0.2s ease',
  textTransform: 'uppercase',
  background: 'rgba(26,46,71,0.8)',
}

const screenStyle: React.CSSProperties = {
  textAlign: 'center',
  marginTop: '12vh',
  animation: 'fadeIn 0.5s ease',
}

const titleStyle: React.CSSProperties = {
  fontFamily: "'Science Gothic', cursive",
  fontSize: 28,
  fontWeight: 400,
  marginBottom: 12,
  color: '#e8e4da',
  textShadow: '0 2px 12px rgba(197,163,90,0.2)',
}

export default function App() {
  const [mode, setMode] = useState<Mode>(null)
  const [hokmReveal, setHokmReveal] = useState<Suit | null>(null)
  const [handWinnerReveal, setHandWinnerReveal] = useState<'ns' | 'ew' | null>(null)
  const prevHokmRef = useRef<Suit | undefined>(undefined)
  const prevHandWinnerRef = useRef<'ns' | 'ew' | undefined>(undefined)
  const handWinnerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  useEffect(() => {
    const currentWinner = onlineGame.game?.handWinner
    if (currentWinner && !prevHandWinnerRef.current) {
      if (handWinnerTimerRef.current) clearTimeout(handWinnerTimerRef.current)
      const showTimer = setTimeout(() => {
        setHandWinnerReveal(currentWinner)
        const dismissTimer = setTimeout(() => setHandWinnerReveal(null), 2000)
        handWinnerTimerRef.current = dismissTimer
      }, 600)
      handWinnerTimerRef.current = showTimer
      return () => {
        if (handWinnerTimerRef.current) clearTimeout(handWinnerTimerRef.current)
      }
    }
    prevHandWinnerRef.current = currentWinner
  }, [onlineGame.game?.handWinner])

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
              color: nsWins ? '#4a907e' : '#b44646',
              fontSize: '1.2rem',
              fontWeight: 400,
              marginBottom: 24,
              fontFamily: "'Science Gothic', cursive",
              textShadow: nsWins
                ? '0 2px 12px rgba(74,144,126,0.3)'
                : '0 2px 8px rgba(180,70,70,0.3)',
            }}>
              {nsWins ? 'GREEN WINS!' : 'RED WINS!'}
            </p>
            <button
              onClick={() => {
                onlineGame.reset()
                setMode(null)
              }}
              style={btnStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(197,163,90,0.12)'
                e.currentTarget.style.borderColor = 'rgba(197,163,90,0.4)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(26,46,71,0.8)'
                e.currentTarget.style.borderColor = 'rgba(197,163,90,0.25)'
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
            onSendEmoji={onlineGame.sendEmoji}
            incomingEmojis={onlineGame.incomingEmojis}
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
              background: 'rgba(15,27,45,0.94)',
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
                  fontFamily: "'Science Gothic', cursive",
                  color: '#c5a35a',
                  textShadow: '0 2px 8px rgba(197,163,90,0.25)',
                  letterSpacing: 3,
                }}>
                  HOKM
                </span>
                <span className="suit-symbol" style={{
                  fontSize: '80px',
                  fontFamily: "'Noto Color Emoji', sans-serif",
                  color: hokmReveal === 'hearts' || hokmReveal === 'diamonds' ? '#b44646' : '#4a5568',
                  textShadow: hokmReveal === 'hearts' || hokmReveal === 'diamonds'
                    ? '0 4px 20px rgba(180,70,70,0.3), 0 0 40px rgba(180,70,70,0.15)'
                    : '0 4px 20px rgba(74,85,104,0.3), 0 0 40px rgba(74,85,104,0.15)',
                  lineHeight: 1,
                }}>
                  {{ hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' }[hokmReveal]}
                </span>
              </div>
            </div>
          )}
          {handWinnerReveal && onlineGame.game && (() => {
            const winners = onlineGame.game.players
              .filter(p => p.team === handWinnerReveal)
              .map(p => p.name)
            const teamColor = handWinnerReveal === 'ns' ? '#4a907e' : '#b44646'
            const teamGlow = handWinnerReveal === 'ns'
              ? '0 4px 20px rgba(74,144,126,0.3), 0 0 40px rgba(74,144,126,0.15)'
              : '0 4px 20px rgba(180,70,70,0.3), 0 0 40px rgba(180,70,70,0.15)'
            const teamLabel = handWinnerReveal === 'ns' ? 'GREEN' : 'RED'
            return (
              <div style={{
                position: 'fixed',
                inset: 0,
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(15,27,45,0.94)',
                animation: 'handWinnerFade 2.2s ease-in-out forwards',
              }}>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 12,
                  animation: 'hokmRevealPop 0.3s ease-out',
                }}>
                  <span style={{
                    fontSize: '1rem',
                    fontFamily: "'Science Gothic', cursive",
                    color: '#c5a35a',
                    textShadow: '0 2px 8px rgba(197,163,90,0.25)',
                    letterSpacing: 3,
                  }}>
                    HAND WON
                  </span>
                  <span style={{
                    fontSize: '2.5rem',
                    fontFamily: "'Science Gothic', cursive",
                    color: teamColor,
                    textShadow: teamGlow,
                    lineHeight: 1,
                  }}>
                    {teamLabel} WINS THE HAND
                  </span>
                  <span style={{
                    fontSize: '1rem',
                    fontFamily: "'Science Gothic', cursive",
                    color: '#e8e4da',
                    opacity: 0.8,
                    marginTop: 4,
                  }}>
                    {winners.join(' & ')}
                  </span>
                </div>
              </div>
            )
          })()}
        </>
      )
    }

    return (
      <div style={{
        ...screenStyle,
        color: '#e8e4da',
        opacity: 0.5,
      }}>
        {onlineGame.error ? (
          <>
            <p style={{ color: '#b44646', marginBottom: 16, fontFamily: "'Science Gothic', cursive", fontSize: 12 }}>{onlineGame.error}</p>
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
          <p style={{ fontFamily: "'Science Gothic', cursive", fontSize: 12 }}>CONNECTING...</p>
        )}
      </div>
    )
  }

  return null
}
