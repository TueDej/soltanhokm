import type { Card } from '../types/card'
import { Suit } from '../types/card'

interface CardProps {
  card: Card
  onClick?: () => void
  disabled?: boolean
  dimmed?: boolean
}

const SUIT_SYMBOLS: Record<string, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
}

const RED_SUITS = new Set([Suit.Hearts, Suit.Diamonds])

export function Card({ card, onClick, disabled, dimmed }: CardProps) {
  const color = dimmed
    ? (RED_SUITS.has(card.suit) ? '#b05550' : '#555')
    : (RED_SUITS.has(card.suit) ? '#e74c3c' : '#000')
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`game-card${dimmed ? ' game-card-dimmed' : ''}`}
      style={{ color }}
    >
      <span className="game-card-corner game-card-corner-tl">
        {card.rank}<br />{SUIT_SYMBOLS[card.suit]}
      </span>
      <span className="game-card-center">
        <span className="game-card-suit">{SUIT_SYMBOLS[card.suit]}</span>
      </span>
      <span className="game-card-corner game-card-corner-br">
        {SUIT_SYMBOLS[card.suit]}<br />{card.rank}
      </span>
    </button>
  )
}
