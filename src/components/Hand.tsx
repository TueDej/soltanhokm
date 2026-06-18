import type { Card as CardType } from '../types/card'
import { Card } from './Card'

interface HandProps {
  cards: CardType[]
  onPlayCard: (card: CardType) => void
  disabled?: boolean
}

export function Hand({ cards, onPlayCard, disabled }: HandProps) {
  return (
    <div style={{ display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'wrap', maxWidth: '100%', padding: '0 10px' }}>
      {cards.map((card) => (
        <Card
          key={`${card.suit}-${card.rank}`}
          card={card}
          onClick={() => onPlayCard(card)}
          disabled={disabled}
        />
      ))}
    </div>
  )
}