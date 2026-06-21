import type { Card, Suit } from '../types/card'
import { Rank, RANK_ORDER } from '../types/card'
import type { LocalGameState } from '../types/game'
import { TrickPhase } from '../types/game'

function canBotPlayCard(state: LocalGameState, card: Card): boolean {
  if (state.phase !== TrickPhase.Playing) return false
  const bot = state.players.find((p) => p.position === state.turn)
  if (!bot) return false
  if (!bot.hand.some((c) => c.suit === card.suit && c.rank === card.rank)) return false
  const trickCards = Object.values(state.currentTrick.cards).filter(Boolean) as Card[]
  if (trickCards.length === 0) return true
  const ledSuit = trickCards[0].suit
  const hasLedSuit = bot.hand.some((c) => c.suit === ledSuit)
  if (hasLedSuit && card.suit !== ledSuit) return false
  return true
}

export function botChooseHokm(state: LocalGameState): Suit | null {
  const bot = state.players.find((p) => p.position === state.turn)
  if (!bot) return null

  const suitCounts: Record<Suit, { count: number; highCards: number }> = {
    hearts: { count: 0, highCards: 0 },
    diamonds: { count: 0, highCards: 0 },
    clubs: { count: 0, highCards: 0 },
    spades: { count: 0, highCards: 0 },
  }

  for (const card of bot.hand) {
    suitCounts[card.suit].count++
    if (RANK_ORDER[card.rank] >= RANK_ORDER[Rank.Queen]) {
      suitCounts[card.suit].highCards++
    }
  }

  let bestSuit: Suit = 'hearts' as Suit
  let bestScore = -1

  for (const suit of Object.keys(suitCounts) as Suit[]) {
    const s = suitCounts[suit]
    const score = s.count * 2 + s.highCards * 3
    if (score > bestScore) {
      bestScore = score
      bestSuit = suit
    }
  }

  return bestSuit
}

export function botPlayCard(state: LocalGameState): Card | null {
  const bot = state.players.find((p) => p.position === state.turn)
  if (!bot || bot.hand.length === 0) return null

  const playable = bot.hand.filter((card) => canBotPlayCard(state, card))
  if (playable.length === 0) return bot.hand[0]

  const trickCards = Object.values(state.currentTrick.cards).filter(Boolean) as Card[]

  if (trickCards.length === 0) {
    return leadCard(state, bot.hand)
  }

  const ledSuit = trickCards[0].suit
  const hasLedSuit = bot.hand.some((c) => c.suit === ledSuit)

  if (hasLedSuit) {
    return followSuit(state, bot.hand, trickCards)
  }

  const hasHokm = state.hokmSuit && bot.hand.some((c) => c.suit === state.hokmSuit)
  if (hasHokm) {
    return trumpCard(state, bot.hand, trickCards)
  }

  return throwOff(bot.hand)
}

function leadCard(state: LocalGameState, hand: Card[]): Card {
  const hokmSuit = state.hokmSuit
  const hokmCards = hand.filter((c) => hokmSuit && c.suit === hokmSuit)
  if (hokmCards.length >= 3) {
    return hokmCards.sort((a, b) => RANK_ORDER[b.rank] - RANK_ORDER[a.rank])[0]
  }

  const nonHokm = hand.filter((c) => !hokmSuit || c.suit !== hokmSuit)
  if (nonHokm.length > 0) {
    const suitCounts: Record<string, number> = {}
    for (const card of nonHokm) {
      suitCounts[card.suit] = (suitCounts[card.suit] || 0) + 1
    }
    const longestSuit = Object.entries(suitCounts).sort((a, b) => b[1] - a[1])[0][0]
    const longestCards = nonHokm.filter((c) => c.suit === longestSuit)
    return longestCards.sort((a, b) => RANK_ORDER[b.rank] - RANK_ORDER[a.rank])[0]
  }

  return hand.sort((a, b) => RANK_ORDER[b.rank] - RANK_ORDER[a.rank])[0]
}

function followSuit(state: LocalGameState, hand: Card[], trickCards: Card[]): Card {
  const hokmSuit = state.hokmSuit!
  const currentWinner = trickCards.reduce((best, card) => {
    if (!best) return card
    const bestIsTrump = best.suit === hokmSuit
    const cardIsTrump = card.suit === hokmSuit
    if (cardIsTrump && !bestIsTrump) return card
    if (!cardIsTrump && bestIsTrump) return best
    if (card.suit !== best.suit) return best
    return RANK_ORDER[card.rank] > RANK_ORDER[best.rank] ? card : best
  }, undefined as Card | undefined)!

  const ledSuit = trickCards[0].suit
  const sameCards = hand.filter((c) => c.suit === ledSuit)

  const winning = sameCards.filter(
    (c) => RANK_ORDER[c.rank] > RANK_ORDER[currentWinner.rank]
  )

  if (winning.length > 0) {
    return winning.sort((a, b) => RANK_ORDER[a.rank] - RANK_ORDER[b.rank])[0]
  }

  return sameCards.sort((a, b) => RANK_ORDER[a.rank] - RANK_ORDER[b.rank])[0]
}

function trumpCard(state: LocalGameState, hand: Card[], _trickCards: Card[]): Card {
  const hokmSuit = state.hokmSuit!
  const hokmCards = hand.filter((c) => c.suit === hokmSuit)
  return hokmCards.sort((a, b) => RANK_ORDER[a.rank] - RANK_ORDER[b.rank])[0]
}

function throwOff(hand: Card[]): Card {
  return hand.sort((a, b) => RANK_ORDER[a.rank] - RANK_ORDER[b.rank])[0]
}

export function isBotTurn(state: LocalGameState): boolean {
  return state.turn !== state.playerPosition && state.phase !== TrickPhase.Finished
}
