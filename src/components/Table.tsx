import { useState, useEffect, useRef } from 'react'
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

const COLLECT_POSITIONS: Record<string, React.CSSProperties> = {
  bottom: { bottom: -50, left: '50%', transform: 'translateX(-50%)' },
  top: { top: -50, left: '50%', transform: 'translateX(-50%)' },
  left: { left: -50, top: '50%', transform: 'translateY(-50%)' },
  right: { right: -50, top: '50%', transform: 'translateY(-50%)' },
}

const PLAY_ANIMATIONS: Record<string, string> = {
  bottom: 'cardPlayBottom 0.3s ease-out',
  top: 'cardPlayTop 0.3s ease-out',
  left: 'cardPlayLeft 0.3s ease-out',
  right: 'cardPlayRight 0.3s ease-out',
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
  const [phase, setPhase] = useState<'playing' | 'waiting' | 'collecting' | 'done'>('playing')
  const [collectTarget, setCollectTarget] = useState<string | null>(null)
  const prevCardCountRef = useRef(Object.keys(trick.cards).length)

  const cardCount = Object.keys(trick.cards).length

  useEffect(() => {
    if (cardCount === 4 && prevCardCountRef.current < 4 && hokmSuit) {
      const winner = pickWinner(trick.cards, hokmSuit, trick.leader)
      const relWinner = getRelativePosition(myPosition, winner)
      setCollectTarget(relWinner)
      setPhase('waiting')

      const waitTimer = setTimeout(() => {
        setPhase('collecting')
        const collectTimer = setTimeout(() => {
          setPhase('done')
        }, 500)
        return () => clearTimeout(collectTimer)
      }, 800)

      return () => clearTimeout(waitTimer)
    }

    if (cardCount < prevCardCountRef.current) {
      setPhase('playing')
      setCollectTarget(null)
    }

    prevCardCountRef.current = cardCount
  }, [cardCount, trick.cards, trick.leader, myPosition, hokmSuit])

  if (phase === 'done') {
    return <div className="game-table" />
  }

  return (
    <div className="game-table">
      {Object.entries(trick.cards).map(([pos, card]) => {
        const relPos = getRelativePosition(myPosition, pos as PlayerPosition)
        const isCollecting = phase === 'collecting' && collectTarget !== null
        const style = isCollecting ? COLLECT_POSITIONS[collectTarget!] : TABLE_POSITIONS[relPos]
        return (
          <div
            key={pos}
            style={{
              position: 'absolute',
              ...style,
              animation: isCollecting ? undefined : PLAY_ANIMATIONS[relPos],
              transition: isCollecting ? 'all 0.5s ease-in' : undefined,
              opacity: isCollecting ? 0 : 1,
            }}
          >
            <Card card={card as CardType} disabled />
          </div>
        )
      })}
    </div>
  )
}
