import type { Card } from '../types/card'

interface CardProps {
  card: Card
  onClick?: () => void
  disabled?: boolean
}

const SUIT_SYMBOLS: Record<string, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
}

const SUIT_COLORS: Record<string, string> = {
  hearts: '#e74c3c',
  diamonds: '#e74c3c',
  clubs: '#fff',
  spades: '#fff',
}

export function Card({ card, onClick, disabled }: CardProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 60,
        minWidth: 60,
        height: 84,
        background: disabled ? '#555' : '#fff',
        color: disabled ? '#999' : SUIT_COLORS[card.suit],
        border: '2px solid #333',
        borderRadius: 8,
        fontSize: 16,
        cursor: disabled ? 'default' : 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <span>{card.rank}</span>
      <span>{SUIT_SYMBOLS[card.suit]}</span>
    </button>
  )
}