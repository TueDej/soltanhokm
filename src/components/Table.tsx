import { useState, useEffect, useRef } from 'react'
import type { Trick } from '../types/game'
import { PlayerPosition } from '../types/game'
import type { Card as CardType } from '../types/card'
import { Card } from './Card'

const POSITIONS_ORDER: PlayerPosition[] = [PlayerPosition.North, PlayerPosition.East, PlayerPosition.South, PlayerPosition.West]

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

interface TableProps {
  trick: Trick
  myPosition?: PlayerPosition
}

export function Table({ trick, myPosition }: TableProps) {
  const [fading, setFading] = useState(false)
  const [lastCards, setLastCards] = useState<Record<string, CardType>>({})
  const prevCardCountRef = useRef(Object.keys(trick.cards).length)

  const cardCount = Object.keys(trick.cards).length

  useEffect(() => {
    if (cardCount === 0 && prevCardCountRef.current === 4) {
      setFading(true)
      const timer = setTimeout(() => {
        setFading(false)
        setLastCards({})
      }, 400)
      return () => clearTimeout(timer)
    }

    if (cardCount > 0) {
      setLastCards(trick.cards as Record<string, CardType>)
    }

    prevCardCountRef.current = cardCount
  }, [cardCount, trick.cards])

  const displayCards = fading ? lastCards : trick.cards

  return (
    <div className="game-table">
      {Object.entries(displayCards).map(([pos, card]) => {
        if (!card) return null
        const relPos = getRelativePosition(myPosition, pos as PlayerPosition)
        return (
          <div
            key={fading ? `fade-${pos}` : pos}
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              transition: fading ? 'opacity 0.4s ease-out' : undefined,
              opacity: fading ? 0 : 1,
              animation: fading ? undefined : `cardPlay${relPos.charAt(0).toUpperCase() + relPos.slice(1)} 0.3s ease-out`,
            }}
          >
            <Card card={card} disabled />
          </div>
        )
      })}
    </div>
  )
}
