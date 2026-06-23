import type { Trick } from '../types/game'
import { PlayerPosition } from '../types/game'
import type { Card as CardType } from '../types/card'
import { Card } from './Card'

const POSITIONS_ORDER: PlayerPosition[] = [PlayerPosition.North, PlayerPosition.East, PlayerPosition.South, PlayerPosition.West]

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

function getPlayOrder(pos: PlayerPosition, leader: PlayerPosition): number {
  const leaderIdx = POSITIONS_ORDER.indexOf(leader)
  const posIdx = POSITIONS_ORDER.indexOf(pos)
  return (posIdx - leaderIdx + 4) % 4
}

function getCardOffset(relPos: string, playIndex: number): React.CSSProperties {
  const gap = 12
  switch (relPos) {
    case 'bottom':
      return { bottom: 0, left: `calc(50% + ${playIndex * gap}px)`, transform: 'translateX(-50%)' }
    case 'top':
      return { top: 0, left: `calc(50% - ${playIndex * gap}px)`, transform: 'translateX(-50%)' }
    case 'left':
      return { left: 0, top: `calc(50% - ${playIndex * gap}px)`, transform: 'translateY(-50%)' }
    case 'right':
      return { right: 0, top: `calc(50% + ${playIndex * gap}px)`, transform: 'translateY(-50%)' }
    default:
      return {}
  }
}

interface TableProps {
  trick: Trick
  myPosition?: PlayerPosition
  hokmSuit?: any
}

export function Table({ trick, myPosition }: TableProps) {
  const leader = trick.leader

  const sortedCards = Object.entries(trick.cards)
    .filter((entry): entry is [string, CardType] => entry[1] !== undefined)
    .sort((a, b) => getPlayOrder(a[0] as PlayerPosition, leader) - getPlayOrder(b[0] as PlayerPosition, leader))

  return (
    <div className="game-table">
      <div className="play-area" style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 180,
        height: 260,
      }}>
        {sortedCards.map(([pos, card], idx) => {
          const relPos = getRelativePosition(myPosition, pos as PlayerPosition)
          return (
            <div
              key={pos}
              style={{
                position: 'absolute',
                ...getCardOffset(relPos, idx),
                zIndex: idx,
                animation: PLAY_ANIMATIONS[relPos],
              }}
            >
              <Card card={card} disabled />
            </div>
          )
        })}
      </div>
    </div>
  )
}
