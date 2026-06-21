import type { Card, Suit } from './card'
import type { PlayerPosition } from './game'

export enum MessageType {
  CreateRoom = 'create_room',
  JoinRoom = 'join_room',
  RoomCreated = 'room_created',
  RoomJoined = 'room_joined',
  PlayerJoined = 'player_joined',
  SelectTeam = 'select_team',
  StartGame = 'start_game',
  GameStarted = 'game_started',
  GameState = 'game_state',
  ChooseHokm = 'choose_hokm',
  PlayCard = 'play_card',
  Error = 'error',
}

// --- Client Messages ---

export interface CreateRoomMessage {
  type: MessageType.CreateRoom
  payload: { playerName: string }
}

export interface JoinRoomMessage {
  type: MessageType.JoinRoom
  payload: { playerName: string; roomCode: string }
}

export interface StartGameMessage {
  type: MessageType.StartGame
  payload: Record<string, never>
}

export interface ChooseHokmMessage {
  type: MessageType.ChooseHokm
  payload: { suit: Suit }
}

export interface PlayCardMessage {
  type: MessageType.PlayCard
  payload: { card: Card }
}

export interface SelectTeamMessage {
  type: MessageType.SelectTeam
  payload: { team: 'ns' | 'ew' }
}

export type OutgoingMessage =
  | CreateRoomMessage
  | JoinRoomMessage
  | StartGameMessage
  | ChooseHokmMessage
  | PlayCardMessage
  | SelectTeamMessage

// --- Server Messages ---

export interface RoomCreatedPayload {
  roomCode: string
  playerId: string
}

export interface RoomJoinedPayload {
  roomCode: string
  playerId: string
}

export interface PlayerInfo {
  id: string
  name: string
  position: PlayerPosition
  isBot: boolean
  team?: 'ns' | 'ew'
}

export interface PlayerJoinedPayload {
  roomCode: string
  players: PlayerInfo[]
}

export interface OnlinePlayerInfo {
  id: string
  name: string
  position: PlayerPosition
  isBot: boolean
  cardCount: number
  tricksWon: number
  team?: 'ns' | 'ew'
}

export interface OnlineGameState {
  gameId: string
  phase: string
  myPosition: PlayerPosition
  myHand: Card[]
  players: OnlinePlayerInfo[]
  hokmSuit?: Suit
  hokmPlayer: PlayerPosition
  currentTrick: {
    cards: Partial<Record<PlayerPosition, Card>>
    leader: PlayerPosition
  }
  northSouthScore: number
  eastWestScore: number
  nsGamesWon: number
  ewGamesWon: number
  turn: PlayerPosition
  roundNumber: number
  matchWinner?: 'ns' | 'ew'
}

export interface ServerMessage {
  type:
    | MessageType.RoomCreated
    | MessageType.RoomJoined
    | MessageType.PlayerJoined
    | MessageType.GameStarted
    | MessageType.GameState
    | MessageType.Error
  payload:
    | RoomCreatedPayload
    | RoomJoinedPayload
    | PlayerJoinedPayload
    | OnlineGameState
    | { message: string }
}
