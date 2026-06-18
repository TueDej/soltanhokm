import type { Card, Suit } from './card'
import type { GameState, PlayerPosition } from './game'

export enum MessageType {
  JoinGame = 'join_game',
  PlayerJoined = 'player_joined',
  GameState = 'game_state',
  ChooseHokm = 'choose_hokm',
  HokmChosen = 'hokm_chosen',
  ChooseTeammate = 'choose_teammate',
  TeammateChosen = 'teammate_chosen',
  PlayCard = 'play_card',
  CardPlayed = 'card_played',
  TrickComplete = 'trick_complete',
  Error = 'error',
}

export interface ClientMessage {
  type: MessageType.JoinGame
  payload: { playerName: string; gameId?: string }
}

export interface ChooseHokmMessage {
  type: MessageType.ChooseHokm
  payload: { suit: Suit }
}

export interface ChooseTeammateMessage {
  type: MessageType.ChooseTeammate
  payload: { position: PlayerPosition }
}

export interface PlayCardMessage {
  type: MessageType.PlayCard
  payload: { card: Card }
}

export type OutgoingMessage =
  | ClientMessage
  | ChooseHokmMessage
  | ChooseTeammateMessage
  | PlayCardMessage

export interface ServerMessage {
  type:
    | MessageType.PlayerJoined
    | MessageType.GameState
    | MessageType.HokmChosen
    | MessageType.TeammateChosen
    | MessageType.CardPlayed
    | MessageType.TrickComplete
    | MessageType.Error
  payload: GameState | { message: string }
}