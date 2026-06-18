import type { Card, Suit } from './card'

export enum PlayerPosition {
  North = 'north',
  East = 'east',
  South = 'south',
  West = 'west',
}

export interface Player {
  id: string
  name: string
  position: PlayerPosition
  hand: Card[]
  tricksWon: number
}

export enum TrickPhase {
  WaitingForPlayers,
  ChoosingHokm,
  ChoosingTeam,
  Playing,
  Finished,
}

export interface Trick {
  cards: Partial<Record<PlayerPosition, Card>>
  leader: PlayerPosition
  winner?: PlayerPosition
}

export interface GameState {
  id: string
  phase: TrickPhase
  players: Player[]
  hokmSuit?: Suit
  hokmPlayer?: PlayerPosition
  teammate?: PlayerPosition
  currentTrick: Trick
  northSouthScore: number
  eastWestScore: number
  turn: PlayerPosition
}

export interface LocalGameState {
  gameId: string
  phase: TrickPhase
  playerPosition: PlayerPosition
  players: Player[]
  hokmSuit?: Suit
  hokmPlayer?: PlayerPosition
  currentTrick: Trick
  northSouthScore: number
  eastWestScore: number
  turn: PlayerPosition
  roundNumber: number
  matchWinner?: 'ns' | 'ew'
}