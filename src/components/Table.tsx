import type { Trick } from '../types/game'
import { PlayerPosition } from '../types/game'
import type { Card as CardType } from '../types/card'
import { Card } from './Card'

const POSITION_STYLE: Record<PlayerPosition, React.CSSProperties> = {
  [PlayerPosition.North]: { top: 0, left: '50%', transform: 'translateX(-50%)' },
  [PlayerPosition.South]: { bottom: 0, left: '50%', transform: 'translateX(-50%)' },
  [PlayerPosition.East]: { right: 0, top: '50%', transform: 'translateY(-50%)' },
  [PlayerPosition.West]: { left: 0, top: '50%', transform: 'translateY(-50%)' },
}

interface TableProps {
  trick: Trick
}

export function Table({ trick }: TableProps) {
  return (
    <div
      style={{
        position: 'relative',
        width: 300,
        height: 300,
        background: '#0d4f1a',
        borderRadius: '50%',
        border: '2px solid #2d8a3e',
        margin: '0 auto',
      }}
    >
      {Object.entries(trick.cards).map(([pos, card]) => (
        <div key={pos} style={{ position: 'absolute', ...POSITION_STYLE[pos as PlayerPosition] }}>
          <Card card={card as CardType} disabled />
        </div>
      ))}
    </div>
  )
}