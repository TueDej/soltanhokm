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
  WaitingForPlayers = 'WaitingForPlayers',
  ChoosingHokm = 'ChoosingHokm',
  ChoosingTeam = 'ChoosingTeam',
  Playing = 'Playing',
  Finished = 'Finished',
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