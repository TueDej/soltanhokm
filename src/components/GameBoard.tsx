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
}

interface GameBoardProps {
  game: LocalGameView | OnlineGameState
  playerId: string
  onPlayCard: (card: Card) => void
  onChooseHokm?: (suit: Suit) => void
  mode: 'local' | 'online'
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
    }}>
      {/* Status bar */}
      <div style={{
        background: 'rgba(0,0,0,0.4)',
        height: 48,
        padding: '0 10px',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        borderBottom: '1px solid rgba(255,255,255,0.1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {game.hokmSuit ? (
            <span style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: '0.95rem',
              fontWeight: 'bold',
              color: game.hokmSuit === Suit.Hearts || game.hokmSuit === Suit.Diamonds ? '#e74c3c' : '#fff',
            }}>
              {SUIT_SYMBOLS[game.hokmSuit]}
            </span>
          ) : (
            <span style={{ fontSize: '0.75rem', color: '#aaa' }}>Trump?</span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 1, minWidth: 0 }}>
          {/* Us score */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div className="score-dots" style={{ display: 'flex', gap: 2 }}>
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: i < game.northSouthScore ? '#4a9d8f' : 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  transition: 'background 0.3s',
                }} />
              ))}
            </div>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 'bold',
              color: '#4a9d8f',
            }}>
              {game.northSouthScore}/7
            </span>
          </div>

          <span style={{ color: '#444', fontSize: '0.7rem' }}>|</span>

          {/* Them score */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 'bold',
              color: '#d4726a',
            }}>
              {game.eastWestScore}/7
            </span>
            <div className="score-dots" style={{ display: 'flex', gap: 2 }}>
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: i < game.eastWestScore ? '#d4726a' : 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  transition: 'background 0.3s',
                }} />
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#4a9d8f' }}>
            {game.nsGamesWon ?? 0}
          </span>
          <span style={{ fontSize: '0.75rem', color: '#666' }}>-</span>
          <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#d4726a' }}>
            {game.ewGamesWon ?? 0}
          </span>
        </div>
      </div>

      {/* Reconnecting overlay */}
      {reconnecting && (
        <div style={{
          position: 'absolute',
          top: 48,
          left: 0,
          right: 0,
          zIndex: 100,
          background: 'rgba(212, 114, 106, 0.95)',
          color: '#fff',
          textAlign: 'center',
          padding: '8px 16px',
          fontSize: '0.85rem',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          animation: 'pulse 1.5s ease-in-out infinite',
        }}>
          <span style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#fff',
            display: 'inline-block',
            animation: 'blink 1s ease-in-out infinite',
          }} />
          Reconnecting...
        </div>
      )}

      {/* Center area: bot placeholders + table */}
      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        {otherPlayers.map((p) => {
          const screenPos = getRelativePosition(myPos, p.position)
          const style = SCREEN_POSITIONS[screenPos]
          if (!style) return null
          const isPlayerTurn = game.turn === p.position
          return (
            <div
              key={p.position}
              style={{
                ...style,
                position: 'absolute',
                padding: '6px 10px',
                borderRadius: 8,
                background: isPlayerTurn ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)',
                border: `1.5px solid ${isPlayerTurn ? '#ffd700' : 'rgba(255,255,255,0.1)'}`,
                textAlign: 'center',
                fontSize: '0.75rem',
                transition: 'border-color 0.3s, background 0.3s',
                zIndex: 5,
              }}
            >
              <div style={{ fontWeight: 'bold', fontSize: '0.8rem' }}>
                {p.name}
                {game.hokmPlayer === p.position && <span style={{ marginLeft: 4 }}>👑</span>}
              </div>
              <div style={{ color: '#aaa', fontSize: '0.7rem' }}>
                {getCardCount(p)} cards
              </div>
            </div>
          )
        })}

        {/* Table centered */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}>
          <Table trick={game.currentTrick} myPosition={myPos} />
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
            background: 'rgba(20, 30, 45, 0.95)',
            padding: '24px 32px',
            borderRadius: 16,
            border: '2px solid rgba(255,255,255,0.15)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}>
            <p style={{ fontSize: '1rem', marginBottom: 16, color: '#ccc' }}>Choose trump suit</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              {[Suit.Hearts, Suit.Diamonds, Suit.Clubs, Suit.Spades].map((suit) => (
                <button
                  key={suit}
                  onClick={() => onChooseHokm(suit)}
                  style={{
                    width: 64,
                    height: 80,
                    borderRadius: 10,
                    border: '2px solid rgba(255,255,255,0.2)',
                    background: 'rgba(255,255,255,0.08)',
                    color: suit === Suit.Hearts || suit === Suit.Diamonds ? '#e74c3c' : '#fff',
                    cursor: 'pointer',
                    fontSize: 28,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                    transition: 'background 0.15s, transform 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.18)'
                    e.currentTarget.style.transform = 'scale(1.08)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
                    e.currentTarget.style.transform = 'scale(1)'
                  }}
                >
                  {SUIT_SYMBOLS[suit]}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Player hand at bottom */}
      {me && (
        <div style={{
          flexShrink: 0,
          paddingBottom: 8,
          paddingTop: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}>
          {/* Team indicator */}
          {me.team && (
            <div style={{
              padding: '3px 12px',
              borderRadius: 12,
              background: me.team === 'ns' ? 'rgba(74,157,143,0.25)' : 'rgba(212,114,106,0.25)',
              border: `1px solid ${me.team === 'ns' ? '#4a9d8f' : '#d4726a'}`,
              fontSize: '0.7rem',
              fontWeight: 'bold',
              color: me.team === 'ns' ? '#4a9d8f' : '#d4726a',
              marginBottom: 6,
            }}>
              {me.team === 'ns' ? 'Green Team' : 'Red Team'}
            </div>
          )}
          <Hand
            cards={sortedHand}
            onPlayCard={onPlayCard}
            playableCards={playableCards}
            disabled={(isPlaying && !isMyTurn) || trickComplete}
          />
          <div style={{
            padding: '4px 14px',
            borderRadius: 8,
            background: isMyTurn ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)',
            border: `1.5px solid ${isMyTurn ? '#ffd700' : 'rgba(255,255,255,0.1)'}`,
            textAlign: 'center',
            fontSize: '0.75rem',
            marginTop: 6,
            transition: 'border-color 0.3s, background 0.3s',
          }}>
            <div style={{ fontWeight: 'bold', fontSize: '0.8rem' }}>
              {me.name}
              {game.hokmPlayer === myPos && <span style={{ marginLeft: 4 }}>👑</span>}
            </div>
            <div style={{ color: '#aaa', fontSize: '0.7rem' }}>{sortedHand.length} cards</div>
          </div>
        </div>
      )}
    </div>
  )
}
