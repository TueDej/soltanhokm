import { PlayerPosition } from './game'

export enum Suit {
  Hearts = 'hearts',
  Diamonds = 'diamonds',
  Clubs = 'clubs',
  Spades = 'spades',
}

export enum Rank {
  Seven = '7',
  Eight = '8',
  Nine = '9',
  Ten = '10',
  Jack = 'J',
  Queen = 'Q',
  King = 'K',
  Ace = 'A',
}

export interface Card {
  suit: Suit
  rank: Rank
}

export const SUIT_ORDER: Record<Suit, number> = {
  [Suit.Hearts]: 0,
  [Suit.Diamonds]: 1,
  [Suit.Clubs]: 2,
  [Suit.Spades]: 3,
}

export const RANK_ORDER: Record<Rank, number> = {
  [Rank.Seven]: 0,
  [Rank.Eight]: 1,
  [Rank.Nine]: 2,
  [Rank.Ten]: 3,
  [Rank.Jack]: 4,
  [Rank.Queen]: 5,
  [Rank.King]: 6,
  [Rank.Ace]: 7,
}

export function createDeck(): Card[] {
  const deck: Card[] = []
  for (const suit of Object.values(Suit)) {
    for (const rank of Object.values(Rank)) {
      deck.push({ suit, rank })
    }
  }
  return deck
}

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export function deal(deck: Card[]): Record<PlayerPosition, Card[]> {
  const hands: Record<PlayerPosition, Card[]> = {
    [PlayerPosition.North]: [],
    [PlayerPosition.East]: [],
    [PlayerPosition.South]: [],
    [PlayerPosition.West]: [],
  }
  const positions = Object.values(PlayerPosition)
  for (let i = 0; i < deck.length; i++) {
    positions[i % 4] && hands[positions[i % 4]!].push(deck[i])
  }
  return hands
}

export function canBeat(
  card: Card,
  currentWinner: Card,
  hokmSuit: Suit,
): boolean {
  const cardIsTrump = card.suit === hokmSuit
  const winnerIsTrump = currentWinner.suit === hokmSuit
  if (cardIsTrump && !winnerIsTrump) return true
  if (!cardIsTrump && winnerIsTrump) return false
  if (card.suit !== currentWinner.suit) return false
  return RANK_ORDER[card.rank] > RANK_ORDER[currentWinner.rank]
}

export function pickWinner(
  cards: Partial<Record<PlayerPosition, Card>>,
  hokmSuit: Suit,
): PlayerPosition {
  const entries = Object.entries(cards).filter(([, c]) => c !== undefined) as [PlayerPosition, Card][]
  if (entries.length === 0) throw new Error('No cards played')
  let winner = entries[0]
  for (let i = 1; i < entries.length; i++) {
    if (canBeat(entries[i][1], winner[1], hokmSuit)) {
      winner = entries[i]
    }
  }
  return winner[0]
}