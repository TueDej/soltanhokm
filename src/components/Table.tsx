import { useState, useEffect, useRef, useCallback } from 'react'
import type { Trick } from '../types/game'
import { PlayerPosition } from '../types/game'
import type { Card as CardType } from '../types/card'
import { pickWinner } from '../types/card'
import type { Suit } from '../types/card'
import { Card } from './Card'

const POSITIONS_ORDER: PlayerPosition[] = [PlayerPosition.North, PlayerPosition.East, PlayerPosition.South, PlayerPosition.West]

const TABLE_POSITIONS: Record<string, React.CSSProperties> = {
  bottom: { bottom: 8, left: '50%', transform: 'translateX(-50%)' },
  top: { top: 8, left: '50%', transform: 'translateX(-50%)' },
  left: { left: 8, top: '50%', transform: 'translateY(-50%)' },
  right: { right: 8, top: '50%', transform: 'translateY(-50%)' },
}

const EDGE_POSITIONS: Record<string, React.CSSProperties> = {
  bottom: { bottom: -80, top: 'auto', left: '50%', transform: 'translateX(-50%)' },
  top: { top: -80, bottom: 'auto', left: '50%', transform: 'translateX(-50%)' },
  left: { left: -80, right: 'auto', top: '50%', transform: 'translateY(-50%)' },
  right: { right: -80, left: 'auto', top: '50%', transform: 'translateY(-50%)' },
}

function getRelativePosition(myPos: PlayerPosition | undefined, otherPos: PlayerPosition): string {
  if (!myPos) return 'top'
  if (otherPos === myPos) return 'bottom'
  const myIdx = POSITIONS_ORDER.indexOf(myPos)
  const otherIdx = POSITIONS_ORDER.indexOf(otherPos)
  const diff = (otherIdx - myIdx + 4) % 4
  if (diff === 2) return 'top'
  if (diff === 1) return 'right'
  return 'left'
}

interface FlyingCard {
  key: string
  card: CardType
  fromStyle: React.CSSProperties
  toStyle: React.CSSProperties
}

interface TableProps {
  trick: Trick
  myPosition?: PlayerPosition
  hokmSuit?: Suit
}

export function Table({ trick, myPosition, hokmSuit }: TableProps) {
  const [flyingCards, setFlyingCards] = useState<FlyingCard[]>([])
  const [phase, setPhase] = useState<'playing' | 'flying'>('playing')
  const prevCardCountRef = useRef(Object.keys(trick.cards).length)

  const cardCount = Object.keys(trick.cards).length

  const startCollection = useCallback(() => {
    if (!hokmSuit) return

    const winner = pickWinner(trick.cards, hokmSuit, trick.leader)
    const targetPos = getRelativePosition(myPosition, winner)

    const cards: FlyingCard[] = Object.entries(trick.cards).map(([pos, card]) => {
      const relPos = getRelativePosition(myPosition, pos as PlayerPosition)
      return {
        key: pos,
        card: card as CardType,
        fromStyle: TABLE_POSITIONS[relPos],
        toStyle: EDGE_POSITIONS[targetPos],
      }
    })

    setFlyingCards(cards)
    setPhase('flying')

    setTimeout(() => {
      setFlyingCards([])
      setPhase('playing')
    }, 600)
  }, [trick, myPosition, hokmSuit])

  useEffect(() => {
    if (cardCount === 4 && prevCardCountRef.current < 4 && phase === 'playing') {
      const timer = setTimeout(startCollection, 900)
      return () => clearTimeout(timer)
    }

    if (cardCount < prevCardCountRef.current) {
      setPhase('playing')
      setFlyingCards([])
    }

    prevCardCountRef.current = cardCount
  }, [cardCount, startCollection, phase])

  return (
    <div className="game-table" style={{ overflow: 'visible' }}>
      {phase === 'playing' && Object.entries(trick.cards).map(([pos, card]) => {
        const relPos = getRelativePosition(myPosition, pos as PlayerPosition)
        return (
          <div
            key={pos}
            style={{
              position: 'absolute',
              ...TABLE_POSITIONS[relPos],
              animation: `cardPlay${relPos.charAt(0).toUpperCase() + relPos.slice(1)} 0.3s ease-out`,
            }}
          >
            <Card card={card as CardType} disabled />
          </div>
        )
      })}

      {flyingCards.map((fc) => (
        <FlyingCardElement key={`flying-${fc.key}`} card={fc.card} from={fc.fromStyle} to={fc.toStyle} />
      ))}
    </div>
  )
}

function FlyingCardElement({ card, from, to }: { card: CardType; from: React.CSSProperties; to: React.CSSProperties }) {
  const [target, setTarget] = useState<React.CSSProperties>(from)

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      setTarget(to)
    })
    return () => cancelAnimationFrame(raf)
  }, [to])

  return (
    <div
      style={{
        position: 'absolute',
        ...target,
        transition: 'all 0.5s ease-in',
        opacity: target === to ? 0 : 1,
        zIndex: 100,
      }}
    >
      <Card card={card} disabled />
    </div>
  )
}
