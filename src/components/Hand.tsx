import { useState, useEffect, useRef } from 'react'
import type { Card as CardType } from '../types/card'
import { Card } from './Card'

interface HandProps {
  cards: CardType[]
  onPlayCard: (card: CardType) => void
  playableCards?: Set<string>
  disabled?: boolean
}

const MAX_CARDS = 13
const STEP = 3
const R_DESKTOP = 450
const R_MOBILE = 350
const CARD_W_DESKTOP = 88
const CARD_H_DESKTOP = 128
const CARD_W_MOBILE = 68
const CARD_H_MOBILE = 96

export function Hand({ cards, onPlayCard, playableCards, disabled }: HandProps) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [isTouch, setIsTouch] = useState(false)
  const [processing, setProcessing] = useState(false)
  const prevCardsRef = useRef(cards)
  const count = cards.length
  const R = isTouch ? R_MOBILE : R_DESKTOP
  const cardW = isTouch ? CARD_W_MOBILE : CARD_W_DESKTOP
  const cardH = isTouch ? CARD_H_MOBILE : CARD_H_DESKTOP

  const maxTotalAngle = (MAX_CARDS - 1) * STEP
  const maxHalfSpread = R * Math.sin((maxTotalAngle / 2) * Math.PI / 180)
  const maxY = R * (1 - Math.cos((maxTotalAngle / 2) * Math.PI / 180))
  const fixedWidth = maxHalfSpread * 2 + cardW
  const fixedHeight = maxY + cardH

  useEffect(() => {
    const mq = window.matchMedia('(hover: none) and (pointer: coarse)')
    setIsTouch(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsTouch(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Reset processing when cards change (server responded)
  useEffect(() => {
    if (cards !== prevCardsRef.current) {
      setProcessing(false)
      prevCardsRef.current = cards
    }
  }, [cards])

  function handleCardClick(card: CardType) {
    if (processing || disabled) return
    const key = `${card.suit}-${card.rank}`
    if (isTouch) {
      if (selectedKey === key) {
        setSelectedKey(null)
        setProcessing(true)
        onPlayCard(card)
      } else {
        setSelectedKey(key)
      }
    } else {
      setProcessing(true)
      onPlayCard(card)
    }
  }

  const isBlocked = disabled || processing

  return (
    <div
      style={{
        position: 'relative',
        width: fixedWidth,
        height: fixedHeight,
        margin: '0 auto',
        overflow: 'visible',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) setSelectedKey(null)
      }}
    >
      {cards.map((card, i) => {
        const key = `${card.suit}-${card.rank}`
        const isPlayable = !playableCards || playableCards.size === 0 || playableCards.has(key)
        const angle = (i - (count - 1) / 2) * STEP
        const rad = (angle * Math.PI) / 180
        const x = R * Math.sin(rad)
        const y = R * (1 - Math.cos(rad))
        const isSelected = selectedKey === key

        return (
          <div
            key={key}
            className={`hand-card${isSelected ? ' hand-card-selected' : ''}`}
            style={{
              position: 'absolute',
              left: `calc(50% + ${x}px - ${cardW / 2}px)`,
              top: y,
              transform: `rotate(${angle}deg)`,
              transformOrigin: 'bottom center',
              zIndex: i,
            }}
          >
            <Card
              card={card}
              onClick={() => handleCardClick(card)}
              disabled={!isPlayable || isBlocked}
              dimmed={!isPlayable}
            />
          </div>
        )
      })}
    </div>
  )
}
