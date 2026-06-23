import type { Trick } from '../types/game'
import { PlayerPosition } from '../types/game'
import type { Card as CardType } from '../types/card'
import { Card } from './Card'

const POSITIONS_ORDER: PlayerPosition[] = [PlayerPosition.North, PlayerPosition.East, PlayerPosition.South, PlayerPosition.West]

const CARD_POSITIONS: Record<string, React.CSSProperties> = {
  bottom: { bottom: 0, left: '50%', transform: 'translateX(-50%)' },
  top: { top: 0, left: '50%', transform: 'translateX(-50%)' },
  left: { left: 0, top: '50%', transform: 'translateY(-50%)' },
  right: { right: 0, top: '50%', transform: 'translateY(-50%)' },
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
      {/* Fixed compact play area in the center */}
      <div className="play-area" style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 180,
        height: 260,
      }}>
        {Object.entries(trick.cards).map(([pos, card]) => {
          if (!card) return null
          const relPos = getRelativePosition(myPosition, pos as PlayerPosition)
          return (
            <div
              key={pos}
              style={{
                position: 'absolute',
                ...CARD_POSITIONS[relPos],
                animation: PLAY_ANIMATIONS[relPos],
              }}
            >
              <Card card={card as CardType} disabled />
            </div>
          )
        })}
      </div>
    </div>
  )
}
