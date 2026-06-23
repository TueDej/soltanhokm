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
  top: { top: 8, left: '50%', transform: 'translateX(-50%)' },
  left: { left: 8, top: '50%', transform: 'translateY(-50%)' },
  right: { right: 8, top: '50%', transform: 'translateY(-50%)' },
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
      background: '#0c1220',
    }}>
      {/* Status bar */}
      <div style={{
        background: '#0c1220',
        height: 52,
        padding: '0 16px',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        borderBottom: '2px solid #1e3a50',
      }}>
        {/* Trump suit */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {game.hokmSuit ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 12px',
              borderRadius: 4,
              background: '#0f1e2e',
              border: '2px solid #2a5070',
              height: 32,
            }}>
              <span style={{
                fontFamily: "'Science Gothic', monospace",
                fontSize: 8,
                color: '#7ec8e3',
                display: 'flex',
                alignItems: 'center',
                height: '100%',
              }}>
                HOKM
              </span>
              <span style={{
                fontSize: '1.3rem',
                fontFamily: "'Science Gothic', monospace",
                display: 'flex',
                alignItems: 'center',
                height: '100%',
                color: game.hokmSuit === Suit.Hearts || game.hokmSuit === Suit.Diamonds ? '#ff6b6b' : '#7ec8e3',
                textShadow: game.hokmSuit === Suit.Hearts || game.hokmSuit === Suit.Diamonds
                  ? '2px 2px 0px #aa4444'
                  : '2px 2px 0px #4488aa',
              }}>
                {SUIT_SYMBOLS[game.hokmSuit]}
              </span>
            </div>
          ) : (
            <span style={{ fontFamily: "'Science Gothic', monospace", fontSize: 8, color: '#4a6a80', opacity: 0.6 }}>CHOOSING...</span>
          )}
        </div>

        {/* Score */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div className="score-dots" style={{ display: 'flex', gap: 3 }}>
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} style={{
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  background: i < game.northSouthScore ? '#7ec8e3' : '#1a2a35',
                  border: `2px solid ${i < game.northSouthScore ? '#4a90b8' : '#2a3a45'}`,
                  transition: 'none',
                }} />
              ))}
            </div>
            <span style={{
              fontFamily: "'Science Gothic', monospace",
              fontSize: 12,
              color: '#7ec8e3',
              minWidth: 28,
              textAlign: 'right',
            }}>
              {game.northSouthScore}
            </span>
          </div>

          <span style={{ fontFamily: "'Science Gothic', monospace", fontSize: 10, color: '#3a4a55' }}>/7</span>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              fontFamily: "'Science Gothic', monospace",
              fontSize: 12,
              color: '#ff8a80',
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
                  background: i < game.eastWestScore ? '#ff8a80' : '#1a2a35',
                  border: `2px solid ${i < game.eastWestScore ? '#cc5544' : '#2a3a45'}`,
                  transition: 'none',
                }} />
              ))}
            </div>
          </div>
        </div>

        {/* Games won */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
          <span style={{
            fontFamily: "'Science Gothic', monospace",
            fontSize: 12,
            color: '#7ec8e3',
            padding: '2px 8px',
            border: '2px solid #2a5070',
          }}>
            {game.nsGamesWon ?? 0}
          </span>
          <span style={{ fontFamily: "'Science Gothic', monospace", fontSize: 10, color: '#3a4a55' }}>-</span>
          <span style={{
            fontFamily: "'Science Gothic', monospace",
            fontSize: 12,
            color: '#ff8a80',
            padding: '2px 8px',
            border: '2px solid #502020',
          }}>
            {game.ewGamesWon ?? 0}
          </span>
          <span style={{ fontFamily: "'Science Gothic', monospace", fontSize: 8, color: '#3a4a55' }}>
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
          background: '#cc5544',
          color: '#0c1220',
          textAlign: 'center',
          padding: '10px 16px',
          fontFamily: "'Science Gothic', monospace",
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
            background: '#0a0a0a',
            display: 'inline-block',
            animation: 'blink 1s step-end infinite',
          }} />
          RECONNECTING...
        </div>
      )}

      {/* Center area */}
      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
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
                padding: '8px 14px',
                borderRadius: 4,
                background: isTrickWinner
                  ? '#1a3050'
                  : isPlayerTurn
                    ? '#152535'
                    : '#0c1220',
                border: `2px solid ${isTrickWinner ? '#7ec8e3' : isPlayerTurn ? '#4a90b8' : '#1e3a50'}`,
                textAlign: 'center',
                fontSize: '0.75rem',
                transition: 'none',
                zIndex: 5,
                boxShadow: isTrickWinner
                  ? '4px 4px 0px #4a90b8, 0 0 15px rgba(126,200,227,0.3)'
                  : isPlayerTurn
                    ? '0 0 12px rgba(126,200,227,0.15)'
                    : '3px 3px 0px #0a1a28',
                animation: isTrickWinner ? 'trickWinFlash 0.8s ease-out' : isPlayerTurn ? 'pulse 1.5s ease-in-out infinite' : 'none',
              }}
            >
              <div style={{
                fontFamily: "'Science Gothic', monospace",
                fontSize: 8,
                color: '#7ec8e3',
              }}>
                {p.name}
                {game.hokmPlayer === p.position && <span style={{ marginLeft: 4 }}>★</span>}
              </div>
              <div style={{
                fontFamily: "'Science Gothic', monospace",
                color: '#4a6a80',
                fontSize: '0.85rem',
                marginTop: 2,
              }}>
                {getCardCount(p)} cards
              </div>
            </div>
          )
        })}

        {/* Table */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}>
          <Table trick={game.currentTrick} myPosition={myPos} hokmSuit={game.hokmSuit} />
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
            background: '#0c1220',
            padding: '28px 36px',
            borderRadius: 8,
            border: '2px solid #4a90b8',
            boxShadow: '8px 8px 0px #1e3a50',
          }}>
            <p style={{
              fontFamily: "'Science Gothic', monospace",
              fontSize: 10,
              marginBottom: 20,
              color: '#7ec8e3',
              letterSpacing: 1,
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
                    borderRadius: 4,
                    border: '2px solid #2a5070',
                    background: '#0f1e2e',
                    color: suit === Suit.Hearts || suit === Suit.Diamonds ? '#ff8a80' : '#7ec8e3',
                    cursor: 'pointer',
                    fontSize: 30,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                    transition: 'all 0.15s',
                    fontFamily: "'Science Gothic', monospace",
                    textShadow: suit === Suit.Hearts || suit === Suit.Diamonds
                      ? '2px 2px 0px #502020'
                      : '2px 2px 0px #1e3a50',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#1e3a50'
                    e.currentTarget.style.borderColor = '#7ec8e3'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#0f1e2e'
                    e.currentTarget.style.borderColor = '#2a5070'
                  }}
                >
                  {SUIT_SYMBOLS[suit]}
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
          background: '#0c1220',
          borderTop: '2px solid #1e3a50',
        }}>
          {/* Team badge */}
          {me.team && (
            <div style={{
              padding: '4px 14px',
              borderRadius: 4,
              background: me.team === 'ns' ? '#0f2530' : '#2a1020',
              border: `2px solid ${me.team === 'ns' ? '#2a5070' : '#502020'}`,
              fontFamily: "'Science Gothic', monospace",
              fontSize: 8,
              color: me.team === 'ns' ? '#7ec8e3' : '#ff8a80',
              marginBottom: 6,
              textTransform: 'uppercase',
            }}>
              {me.team === 'ns' ? 'BLUE' : 'RED'}
            </div>
          )}
          <Hand
            cards={sortedHand}
            onPlayCard={onPlayCard}
            playableCards={playableCards}
            disabled={(isPlaying && !isMyTurn) || trickComplete}
          />
          <div style={{
            padding: '5px 16px',
            borderRadius: 4,
            background: trickWinner === myPos
              ? '#1a3050'
              : isMyTurn
                ? '#152535'
                : '#0c1220',
            border: `2px solid ${trickWinner === myPos ? '#7ec8e3' : isMyTurn ? '#4a90b8' : '#1e3a50'}`,
            textAlign: 'center',
            marginTop: 8,
            transition: 'none',
            boxShadow: trickWinner === myPos
              ? '4px 4px 0px #4a90b8, 0 0 15px rgba(126,200,227,0.3)'
              : isMyTurn
                ? '0 0 12px rgba(126,200,227,0.15)'
                : '3px 3px 0px #0a1a28',
            animation: trickWinner === myPos ? 'trickWinFlash 0.8s ease-out' : isMyTurn ? 'pulse 1.5s ease-in-out infinite' : 'none',
          }}>
            <div style={{
              fontFamily: "'Science Gothic', monospace",
              fontSize: 8,
              color: '#7ec8e3',
            }}>
              {me.name}
              {game.hokmPlayer === myPos && <span style={{ marginLeft: 4 }}>★</span>}
            </div>
            <div style={{
              fontFamily: "'Science Gothic', monospace",
              color: '#4a6a80',
              fontSize: '0.85rem',
              marginTop: 1,
            }}>{sortedHand.length} cards</div>
          </div>
        </div>
      )}
    </div>
  )
}
