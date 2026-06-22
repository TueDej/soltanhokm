import { PlayerPosition } from './game'

export enum Suit {
  Hearts = 'hearts',
  Diamonds = 'diamonds',
  Clubs = 'clubs',
  Spades = 'spades',
}

export enum Rank {
  Two = '2',
  Three = '3',
  Four = '4',
  Five = '5',
  Six = '6',
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
  [Suit.Clubs]: 1,
  [Suit.Diamonds]: 2,
  [Suit.Spades]: 3,
}

export const RANK_ORDER: Record<Rank, number> = {
  [Rank.Two]: 0,
  [Rank.Three]: 1,
  [Rank.Four]: 2,
  [Rank.Five]: 3,
  [Rank.Six]: 4,
  [Rank.Seven]: 5,
  [Rank.Eight]: 6,
  [Rank.Nine]: 7,
  [Rank.Ten]: 8,
  [Rank.Jack]: 9,
  [Rank.Queen]: 10,
  [Rank.King]: 11,
  [Rank.Ace]: 12,
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

export function sortHand(hand: Card[]): Card[] {
  return [...hand].sort((a, b) => {
    const suitDiff = SUIT_ORDER[a.suit] - SUIT_ORDER[b.suit]
    if (suitDiff !== 0) return suitDiff
    return RANK_ORDER[a.rank] - RANK_ORDER[b.rank]
  })
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
  leader: PlayerPosition,
): PlayerPosition {
  const entries = Object.entries(cards).filter(([, c]) => c !== undefined) as [PlayerPosition, Card][]
  if (entries.length === 0) throw new Error('No cards played')
  const leaderEntry = entries.find(([pos]) => pos === leader)
  if (!leaderEntry) return entries[0][0]
  let winner = leaderEntry
  for (const entry of entries) {
    if (entry[0] === leader) continue
    if (canBeat(entry[1], winner[1], hokmSuit)) {
      winner = entry
    }
  }
  return winner[0]
}