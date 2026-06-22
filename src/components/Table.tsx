import { useState, useEffect, useRef } from 'react'
import type { Trick } from '../types/game'
import { PlayerPosition } from '../types/game'
import type { Card as CardType } from '../types/card'
import { pickWinner } from '../types/card'
import type { Suit } from '../types/card'
import { Card } from './Card'

const POSITIONS_ORDER: PlayerPosition[] = [PlayerPosition.North, PlayerPosition.East, PlayerPosition.South, PlayerPosition.West]

const TABLE_POSITIONS: Record<string, { style: React.CSSProperties; animation: string }> = {
  bottom: { style: { bottom: 8, left: '50%', transform: 'translateX(-50%)' }, animation: 'cardPlayBottom 0.3s ease-out' },
  top: { style: { top: 8, left: '50%', transform: 'translateX(-50%)' }, animation: 'cardPlayTop 0.3s ease-out' },
  left: { style: { left: 8, top: '50%', transform: 'translateY(-50%)' }, animation: 'cardPlayLeft 0.3s ease-out' },
  right: { style: { right: 8, top: '50%', transform: 'translateY(-50%)' }, animation: 'cardPlayRight 0.3s ease-out' },
}

const COLLECT_TARGETS: Record<string, React.CSSProperties> = {
  bottom: { bottom: -40, left: '50%', transform: 'translateX(-50%)' },
  top: { top: -40, left: '50%', transform: 'translateX(-50%)' },
  left: { left: -40, top: '50%', transform: 'translateY(-50%)' },
  right: { right: -40, top: '50%', transform: 'translateY(-50%)' },
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

interface TableProps {
  trick: Trick
  myPosition?: PlayerPosition
  hokmSuit?: Suit
}

export function Table({ trick, myPosition, hokmSuit }: TableProps) {
  const [collecting, setCollecting] = useState(false)
  const [collectTarget, setCollectTarget] = useState<string | null>(null)
  const trickCountRef = useRef(Object.keys(trick.cards).length)

  const cardCount = Object.keys(trick.cards).length

  useEffect(() => {
    if (cardCount === 4 && trickCountRef.current < 4 && hokmSuit) {
      const winner = pickWinner(trick.cards, hokmSuit, trick.leader)
      const relWinner = getRelativePosition(myPosition, winner)
      setCollectTarget(relWinner)
      setCollecting(true)
      const timer = setTimeout(() => {
        setCollecting(false)
        setCollectTarget(null)
      }, 600)
      return () => clearTimeout(timer)
    }
    if (cardCount < trickCountRef.current) {
      setCollecting(false)
      setCollectTarget(null)
    }
    trickCountRef.current = cardCount
  }, [cardCount, trick.cards, trick.leader, myPosition, hokmSuit])

  return (
    <div className="game-table">
      {Object.entries(trick.cards).map(([pos, card]) => {
        const relPos = getRelativePosition(myPosition, pos as PlayerPosition)
        const isCollecting = collecting && collectTarget !== null
        const targetStyle = isCollecting ? COLLECT_TARGETS[collectTarget] : undefined
        const posData = TABLE_POSITIONS[relPos]
        return (
          <div
            key={pos}
            style={{
              position: 'absolute',
              ...(isCollecting && targetStyle ? targetStyle : posData.style),
              animation: isCollecting
                ? 'trickCollect 0.5s ease-in forwards'
                : posData.animation,
              opacity: isCollecting ? 0 : 1,
              transition: 'all 0.5s ease-in',
            }}
          >
            <Card card={card as CardType} disabled />
          </div>
        )
      })}
    </div>
  )
}
