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