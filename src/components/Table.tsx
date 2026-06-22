import type { Trick } from '../types/game'
import { PlayerPosition } from '../types/game'
import type { Card as CardType } from '../types/card'
import { Card } from './Card'

const POSITIONS_ORDER: PlayerPosition[] = [PlayerPosition.North, PlayerPosition.East, PlayerPosition.South, PlayerPosition.West]

const TABLE_POSITIONS: Record<string, React.CSSProperties> = {
  bottom: { bottom: 8, left: '50%', transform: 'translateX(-50%)' },
  top: { top: 8, left: '50%', transform: 'translateX(-50%)' },
  left: { left: 8, top: '50%', transform: 'translateY(-50%)' },
  right: { right: 8, top: '50%', transform: 'translateY(-50%)' },
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
  hokmSuit?: any
}

export function Table({ trick, myPosition }: TableProps) {
  return (
    <div className="game-table">
      {Object.entries(trick.cards).map(([pos, card]) => {
        if (!card) return null
        const relPos = getRelativePosition(myPosition, pos as PlayerPosition)
        return (
          <div
            key={pos}
            style={{
              position: 'absolute',
              ...TABLE_POSITIONS[relPos],
              animation: PLAY_ANIMATIONS[relPos],
            }}
          >
            <Card card={card as CardType} disabled />
          </div>
        )
      })}
    </div>
  )
}
