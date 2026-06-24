import { useState, useEffect, useRef } from 'react'
import { TrickPhase, PlayerPosition } from '../types/game'
import { Suit } from '../types/card'
import type { Card } from '../types/card'
import { sortHand } from '../types/card'
import type { OnlineGameState } from '../types/socket'
import { Hand } from './Hand'
import { Table } from './Table'

interface LocalGameView {
  id: string
  phase: TrickPhase
  players: { id: string; name: string; position: PlayerPosition; hand: Card[]; tricksWon: number; cardCount?: number; team?: 'ns' | 'ew' }[]
  hokmSuit?: Suit
  hokmPlayer?: PlayerPosition
  currentTrick: {
    cards: Partial<Record<PlayerPosition, Card>>
    leader: PlayerPosition
  }
  northSouthScore: number
  eastWestScore: number
  nsGamesWon?: number
  ewGamesWon?: number
  turn: PlayerPosition
  handsToWin?: number
}

interface GameBoardProps {
  game: LocalGameView | OnlineGameState
  playerId: string
  onPlayCard: (card: Card) => void
  onChooseHokm?: (suit: Suit) => void
  reconnecting?: boolean
}

const SUIT_SYMBOLS: Record<Suit, string> = {
  [Suit.Hearts]: '♥',
  [Suit.Diamonds]: '♦',
  [Suit.Clubs]: '♣',
  [Suit.Spades]: '♠',
}

function isOnline(game: LocalGameView | OnlineGameState): game is OnlineGameState {
  return 'myHand' in game
}

function getPlayerHand(game: LocalGameView | OnlineGameState, playerId: string): Card[] {
  if (isOnline(game)) {
    return game.myHand
  }
  const me = game.players.find((p) => p.id === playerId)
  return me?.hand || []
}

function getMyPosition(game: LocalGameView | OnlineGameState, playerId: string): PlayerPosition | undefined {
  if (isOnline(game)) {
    return game.myPosition
  }
  const me = game.players.find((p) => p.id === playerId)
  return me?.position
}

function getPlayableCards(game: LocalGameView | OnlineGameState, playerId: string): Set<string> {
  const playable = new Set<string>()
  if (game.phase !== TrickPhase.Playing) return playable

  const myPos = getMyPosition(game, playerId)
  if (!myPos || game.turn !== myPos) return playable

  const hand = getPlayerHand(game, playerId)
  if (!hand.length) return playable

  const trickCards = Object.values(game.currentTrick.cards).filter(Boolean) as Card[]
  if (trickCards.length === 0) {
    hand.forEach((c) => playable.add(`${c.suit}-${c.rank}`))
    return playable
  }

  const leaderCard = game.currentTrick.cards[game.currentTrick.leader]
  const ledSuit = leaderCard ? leaderCard.suit : trickCards[0].suit
  const hasLedSuit = hand.some((c) => c.suit === ledSuit)

  for (const card of hand) {
    if (hasLedSuit) {
      if (card.suit === ledSuit) playable.add(`${card.suit}-${card.rank}`)
    } else {
      playable.add(`${card.suit}-${card.rank}`)
    }
  }
  return playable
}

const POSITIONS_ORDER: PlayerPosition[] = [PlayerPosition.North, PlayerPosition.East, PlayerPosition.South, PlayerPosition.West]

function getRelativePosition(myPos: PlayerPosition | undefined, otherPos: PlayerPosition): 'top' | 'left' | 'right' {
  if (!myPos) return 'top'
  const myIdx = POSITIONS_ORDER.indexOf(myPos)
  const otherIdx = POSITIONS_ORDER.indexOf(otherPos)
  const diff = (otherIdx - myIdx + 4) % 4
  if (diff === 2) return 'top'
  if (diff === 1) return 'right'
  return 'left'
}

const SCREEN_POSITIONS: Record<string, React.CSSProperties> = {
  top: { top: 0, left: '50%', transform: 'translate(-50%, -50%)' },
  bottom: { bottom: 0, left: '50%', transform: 'translate(-50%, 50%)' },
  left: { left: 0, top: '50%', transform: 'translate(-50%, -50%)' },
  right: { right: 0, top: '50%', transform: 'translate(50%, -50%)' },
}

export function GameBoard({ game, playerId, onPlayCard, onChooseHokm, reconnecting }: GameBoardProps) {
  const me = game.players.find((p) => p.id === playerId)
  const myPos = getMyPosition(game, playerId)
  const isMyTurn = myPos && game.turn === myPos
  const isPlaying = game.phase === TrickPhase.Playing
  const trickComplete = Object.keys(game.currentTrick.cards).length === 4
  const playableCards = getPlayableCards(game, playerId)
  const sortedHand = sortHand(getPlayerHand(game, playerId))
  const isChoosingHokm = game.phase === TrickPhase.ChoosingHokm
  const otherPlayers = game.players.filter((p) => p.position !== myPos)

  const [trickWinner, setTrickWinner] = useState<PlayerPosition | null>(null)
  const prevScoreRef = useRef({ ns: game.northSouthScore, ew: game.eastWestScore })
  const trickWinnerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const ns = game.northSouthScore
    const ew = game.eastWestScore
    if (ns + ew > prevScoreRef.current.ns + prevScoreRef.current.ew) {
      if (trickWinnerTimerRef.current) clearTimeout(trickWinnerTimerRef.current)
      setTrickWinner(game.turn)
      trickWinnerTimerRef.current = setTimeout(() => {
        setTrickWinner(null)
        trickWinnerTimerRef.current = null
      }, 800)
    }
    prevScoreRef.current = { ns, ew }

    return () => {
      if (trickWinnerTimerRef.current) {
        clearTimeout(trickWinnerTimerRef.current)
      }
    }
  }, [game.northSouthScore, game.eastWestScore])

  function getCardCount(p: typeof game.players[0]): number {
    if ('cardCount' in p && p.cardCount !== undefined) {
      return p.cardCount
    }
    if (isOnline(game)) {
      const op = game.players.find((op) => op.id === p.id)
      return op && 'cardCount' in op ? op.cardCount : 0
    }
    const localPlayer = p as { hand?: Card[] }
    return localPlayer.hand?.length || 0
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      background: '#0f1b2d',
    }}>
      {/* Status bar */}
      <div style={{
        background: 'rgba(17,31,51,0.95)',
        height: 52,
        padding: '0 16px',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        borderBottom: '1px solid rgba(197,163,90,0.12)',
        position: 'relative',
      }}>
        {/* Trump suit */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {game.hokmSuit ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 12px',
              borderRadius: 6,
              background: 'rgba(197,163,90,0.08)',
              border: '1px solid rgba(197,163,90,0.2)',
              height: 32,
            }}>
              <span style={{
                fontFamily: "'Science Gothic', cursive",
                fontSize: 8,
                color: '#c5a35a',
                display: 'flex',
                alignItems: 'center',
                height: '100%',
              }}>
                HOKM
              </span>
              <span className="suit-symbol" style={{
                fontSize: '1.3rem',
                fontFamily: "'Noto Color Emoji', sans-serif",
                display: 'flex',
                alignItems: 'center',
                height: '100%',
                color: game.hokmSuit === Suit.Hearts || game.hokmSuit === Suit.Diamonds ? '#b44646' : '#4a5568',
                textShadow: game.hokmSuit === Suit.Hearts || game.hokmSuit === Suit.Diamonds
                  ? '0 2px 6px rgba(180,70,70,0.4)'
                  : '0 2px 6px rgba(74,85,104,0.4)',
              }}>
                {SUIT_SYMBOLS[game.hokmSuit]}
              </span>
            </div>
          ) : (
            <span style={{ fontFamily: "'Science Gothic', cursive", fontSize: 8, color: 'rgba(197,163,90,0.3)' }}>CHOOSING...</span>
          )}
        </div>

        {/* Score */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div className="score-dots" style={{ display: 'flex', gap: 3 }}>
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} style={{
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  background: i < game.northSouthScore ? 'rgba(74,144,126,0.7)' : 'rgba(26,46,71,0.6)',
                  border: `1px solid ${i < game.northSouthScore ? 'rgba(74,144,126,0.4)' : 'rgba(197,163,90,0.1)'}`,
                  transition: 'none',
                }} />
              ))}
            </div>
            <span style={{
              fontFamily: "'Science Gothic', cursive",
              fontSize: 12,
              color: '#4a907e',
              minWidth: 28,
              textAlign: 'right',
            }}>
              {game.northSouthScore}
            </span>
          </div>

          <span style={{ fontFamily: "'Science Gothic', cursive", fontSize: 10, color: 'rgba(197,163,90,0.3)' }}>/7</span>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              fontFamily: "'Science Gothic', cursive",
              fontSize: 12,
              color: '#b44646',
              minWidth: 28,
            }}>
              {game.eastWestScore}
            </span>
            <div className="score-dots" style={{ display: 'flex', gap: 3 }}>
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} style={{
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  background: i < game.eastWestScore ? 'rgba(180,70,70,0.6)' : 'rgba(26,46,71,0.6)',
                  border: `1px solid ${i < game.eastWestScore ? 'rgba(180,70,70,0.3)' : 'rgba(197,163,90,0.1)'}`,
                  transition: 'none',
                }} />
              ))}
            </div>
          </div>
        </div>

        {/* Games won */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
          <span style={{
            fontFamily: "'Science Gothic', cursive",
            fontSize: 12,
            color: '#4a907e',
            padding: '2px 8px',
            border: '1px solid rgba(74,144,126,0.25)',
            borderRadius: 4,
          }}>
            {game.nsGamesWon ?? 0}
          </span>
          <span style={{ fontFamily: "'Science Gothic', cursive", fontSize: 10, color: 'rgba(197,163,90,0.3)' }}>-</span>
          <span style={{
            fontFamily: "'Science Gothic', cursive",
            fontSize: 12,
            color: '#b44646',
            padding: '2px 8px',
            border: '1px solid rgba(180,70,70,0.25)',
            borderRadius: 4,
          }}>
            {game.ewGamesWon ?? 0}
          </span>
          <span style={{ fontFamily: "'Science Gothic', cursive", fontSize: 8, color: 'rgba(197,163,90,0.3)' }}>
            /{game.handsToWin ?? 7}
          </span>
        </div>
      </div>

      {/* Reconnecting overlay */}
      {reconnecting && (
        <div style={{
          position: 'absolute',
          top: 52,
          left: 0,
          right: 0,
          zIndex: 100,
          background: 'linear-gradient(90deg, rgba(180,70,70,0.9), rgba(140,50,50,0.9))',
          color: '#e8e4da',
          textAlign: 'center',
          padding: '10px 16px',
          fontFamily: "'Science Gothic', cursive",
          fontSize: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          animation: 'pulse 1.5s ease-in-out infinite',
        }}>
          <span style={{
            width: 8,
            height: 8,
            borderRadius: 0,
            background: '#e8e4da',
            display: 'inline-block',
            animation: 'blink 1s step-end infinite',
          }} />
          RECONNECTING...
        </div>
      )}

      {/* Center area */}
      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        {/* Table */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '70%',
          height: '80%',
        }}>
          <Table trick={game.currentTrick} myPosition={myPos} hokmSuit={game.hokmSuit} />

          {otherPlayers.map((p) => {
            const screenPos = getRelativePosition(myPos, p.position)
            const style = SCREEN_POSITIONS[screenPos]
            if (!style) return null
            const isPlayerTurn = game.turn === p.position
            const isTrickWinner = trickWinner === p.position
            return (
              <div
                key={p.position}
                style={{
                  ...style,
                  position: 'absolute',
                  padding: '6px 12px',
                  borderRadius: 6,
                  background: isTrickWinner
                    ? 'rgba(197,163,90,0.1)'
                    : isPlayerTurn
                      ? 'rgba(26,46,71,0.8)'
                      : 'rgba(12,22,36,0.7)',
                  border: `1px solid ${isTrickWinner ? 'rgba(197,163,90,0.4)' : isPlayerTurn ? 'rgba(197,163,90,0.25)' : 'rgba(197,163,90,0.08)'}`,
                  textAlign: 'center',
                  fontSize: '0.75rem',
                  transition: 'none',
                  zIndex: 5,
                  boxShadow: isTrickWinner
                    ? '0 0 20px rgba(197,163,90,0.2), 0 0 40px rgba(197,163,90,0.08)'
                    : isPlayerTurn
                      ? '0 0 16px rgba(197,163,90,0.1)'
                      : '0 2px 8px rgba(0,0,0,0.2)',
                  animation: isTrickWinner ? 'trickWinFlash 0.8s ease-out' : isPlayerTurn ? 'pulse 1.5s ease-in-out infinite' : 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                <div style={{
                  fontFamily: "'Science Gothic', monospace",
                  fontSize: 10,
                  color: '#e8e4da',
                }}>
                  {p.name}
                  {game.hokmPlayer === p.position && <span style={{ marginLeft: 4, color: '#c5a35a' }}>★</span>}
                </div>
                <div style={{
                  fontFamily: "'Science Gothic', monospace",
                  color: 'rgba(197,163,90,0.4)',
                  fontSize: 7,
                  marginTop: 2,
                }}>
                  {getCardCount(p)} cards
                </div>
              </div>
            )
          })}

          {/* My indicator at table bottom edge */}
          {me && (
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: '50%',
                transform: 'translate(-50%, 50%)',
                padding: '6px 12px',
                borderRadius: 6,
                background: trickWinner === myPos
                  ? 'rgba(197,163,90,0.1)'
                  : isMyTurn
                    ? 'rgba(26,46,71,0.8)'
                    : 'rgba(12,22,36,0.7)',
                border: `1px solid ${trickWinner === myPos ? 'rgba(197,163,90,0.4)' : isMyTurn ? 'rgba(197,163,90,0.25)' : 'rgba(197,163,90,0.08)'}`,
                textAlign: 'center',
                fontSize: '0.75rem',
                transition: 'none',
                zIndex: 5,
                boxShadow: trickWinner === myPos
                  ? '0 0 20px rgba(197,163,90,0.2), 0 0 40px rgba(197,163,90,0.08)'
                  : isMyTurn
                    ? '0 0 16px rgba(197,163,90,0.1)'
                    : '0 2px 8px rgba(0,0,0,0.2)',
                animation: trickWinner === myPos ? 'trickWinFlash 0.8s ease-out' : isMyTurn ? 'pulse 1.5s ease-in-out infinite' : 'none',
                whiteSpace: 'nowrap',
              }}
            >
              <div style={{
                fontFamily: "'Science Gothic', monospace",
                fontSize: 10,
                color: '#e8e4da',
              }}>
                {me.name}
                {game.hokmPlayer === myPos && <span style={{ marginLeft: 4, color: '#c5a35a' }}>★</span>}
              </div>
              <div style={{
                fontFamily: "'Science Gothic', monospace",
                color: 'rgba(197,163,90,0.4)',
                fontSize: 7,
                marginTop: 2,
              }}>
                {sortedHand.length} cards
              </div>
            </div>
          )}
        </div>

        {/* Hokm picker */}
        {isChoosingHokm && game.hokmPlayer === myPos && !game.hokmSuit && onChooseHokm && (
          <div style={{
            position: 'absolute',
            top: '30%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            zIndex: 10,
            background: 'rgba(17,31,51,0.95)',
            padding: '28px 36px',
            borderRadius: 10,
            border: '1px solid rgba(197,163,90,0.2)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.4), 0 0 30px rgba(197,163,90,0.06)',
          }}>
            <p style={{
              fontFamily: "'Science Gothic', cursive",
              fontSize: 10,
              marginBottom: 20,
              color: '#c5a35a',
              letterSpacing: 2,
            }}>
              CHOOSE HOKM
            </p>
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center' }}>
              {[Suit.Hearts, Suit.Diamonds, Suit.Clubs, Suit.Spades].map((suit) => (
                <button
                  key={suit}
                  onClick={() => onChooseHokm(suit)}
                  style={{
                    width: 68,
                    height: 88,
                    borderRadius: 8,
                    border: '1px solid rgba(197,163,90,0.15)',
                    background: 'rgba(26,46,71,0.6)',
                    color: suit === Suit.Hearts || suit === Suit.Diamonds ? '#b44646' : '#4a5568',
                    cursor: 'pointer',
                    fontSize: 30,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                    transition: 'all 0.2s ease',
                    fontFamily: "'Science Gothic', cursive",
                    textShadow: suit === Suit.Hearts || suit === Suit.Diamonds
                      ? '0 2px 8px rgba(180,70,70,0.3)'
                      : '0 2px 8px rgba(74,85,104,0.3)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(197,163,90,0.1)'
                    e.currentTarget.style.borderColor = 'rgba(197,163,90,0.35)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(26,46,71,0.6)'
                    e.currentTarget.style.borderColor = 'rgba(197,163,90,0.15)'
                  }}
                >
                  <span className="suit-symbol" style={{ fontFamily: "'Noto Color Emoji', sans-serif" }}>{SUIT_SYMBOLS[suit]}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Player hand */}
      {me && (
        <div style={{
          flexShrink: 0,
          paddingBottom: 10,
          paddingTop: 6,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          background: 'rgba(17,31,51,0.95)',
          borderTop: '1px solid rgba(197,163,90,0.1)',
        }}>
          <Hand
            cards={sortedHand}
            onPlayCard={onPlayCard}
            playableCards={playableCards}
            disabled={(isPlaying && !isMyTurn) || trickComplete}
          />
          {/* Team badge */}
          {me.team && (
            <div style={{
              padding: '4px 14px',
              borderRadius: 4,
              background: me.team === 'ns' ? 'rgba(74,144,126,0.1)' : 'rgba(180,70,70,0.1)',
              border: `1px solid ${me.team === 'ns' ? 'rgba(74,144,126,0.25)' : 'rgba(180,70,70,0.25)'}`,
              fontFamily: "'Science Gothic', cursive",
              fontSize: 8,
              color: me.team === 'ns' ? '#4a907e' : '#b44646',
              marginTop: 6,
              textTransform: 'uppercase',
            }}>
              {me.team === 'ns' ? 'TEAM GREEN' : 'TEAM RED'}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
