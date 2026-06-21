import type { Card, Suit } from '../types/card'
import { createDeck, shuffleDeck, deal, pickWinner, sortHand } from '../types/card'
import type { Player } from '../types/game'
import { TrickPhase, PlayerPosition } from '../types/game'
import type { LocalGameState } from '../types/game'

const BOT_NAMES = ['Alex', 'Sam', 'Jordan', 'Casey', 'Morgan', 'Taylor', 'Riley', 'Quinn', 'Drew', 'Blake', 'Avery', 'Cameron', 'Dakota', 'Emery', 'Finley', 'Harper', 'Hayden', 'Jamie', 'Kendall', 'Logan']

function getRandomBotName(): string {
  return BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)]
}

const POSITIONS: PlayerPosition[] = [
  PlayerPosition.North,
  PlayerPosition.East,
  PlayerPosition.South,
  PlayerPosition.West,
]

const NS_POSITIONS: PlayerPosition[] = [PlayerPosition.North, PlayerPosition.South]

function isNS(pos: PlayerPosition): boolean {
  return NS_POSITIONS.includes(pos)
}

function nextPos(pos: PlayerPosition): PlayerPosition {
  const idx = POSITIONS.indexOf(pos)
  return POSITIONS[(idx + 1) % 4]
}

export function createLocalGame(playerName: string, playerPosition: PlayerPosition): LocalGameState {
  const deck = shuffleDeck(createDeck())
  const initialHands = deal(deck.slice(0, 20))
  const remainingDeck = deck.slice(20)
  const players: Player[] = POSITIONS.map((pos) => ({
    id: pos,
    name: pos === playerPosition ? playerName : getRandomBotName(),
    position: pos,
    hand: sortHand(initialHands[pos]),
    tricksWon: 0,
  }))
  const hokmPlayerIndex = Math.floor(Math.random() * 4)
  return {
    gameId: crypto.randomUUID(),
    phase: TrickPhase.ChoosingHokm,
    playerPosition,
    players,
    hokmPlayer: POSITIONS[hokmPlayerIndex],
    currentTrick: { cards: {}, leader: POSITIONS[hokmPlayerIndex] },
    northSouthScore: 0,
    eastWestScore: 0,
    turn: POSITIONS[hokmPlayerIndex],
    roundNumber: 1,
    remainingDeck,
  }
}

export function chooseHokm(state: LocalGameState, suit: Suit): LocalGameState {
  if (state.phase !== TrickPhase.ChoosingHokm) return state
  const extraHands = deal(state.remainingDeck)
  const newPlayers = state.players.map((p) => ({
    ...p,
    hand: sortHand([...p.hand, ...extraHands[p.position]]),
  }))
  return {
    ...state,
    hokmSuit: suit,
    phase: TrickPhase.Playing,
    turn: state.hokmPlayer!,
    players: newPlayers,
    remainingDeck: [],
  }
}

export function playCard(state: LocalGameState, card: Card): LocalGameState {
  if (state.phase !== TrickPhase.Playing) return state
  const player = state.players.find((p) => p.position === state.turn)!
  const newHand = player.hand.filter(
    (c) => !(c.suit === card.suit && c.rank === card.rank)
  )
  const newPlayers = state.players.map((p) =>
    p.position === state.turn ? { ...p, hand: newHand } : p
  )
  const newTrickCards = { ...state.currentTrick.cards, [state.turn]: card }
  const trickComplete = Object.keys(newTrickCards).length === 4
  return {
    ...state,
    players: newPlayers,
    currentTrick: { ...state.currentTrick, cards: newTrickCards },
    turn: trickComplete ? state.turn : nextPos(state.turn),
  }
}

export function isTrickComplete(state: LocalGameState): boolean {
  return Object.keys(state.currentTrick.cards).length === 4
}

export function resolveTrick(state: LocalGameState): LocalGameState {
  if (!isTrickComplete(state)) return state
  const trickWinner = pickWinner(state.currentTrick.cards, state.hokmSuit!)
  return resolveTrickInner(state, state.players, trickWinner)
}

function resolveTrickInner(
  state: LocalGameState,
  players: Player[],
  trickWinner: PlayerPosition,
): LocalGameState {
  const winnerIsNS = isNS(trickWinner)
  const nsTricks = state.northSouthScore + (winnerIsNS ? 1 : 0)
  const ewTricks = state.eastWestScore + (winnerIsNS ? 0 : 1)
  const newPlayers = players.map((p) =>
    p.position === trickWinner ? { ...p, tricksWon: p.tricksWon + 1 } : p
  )
  const roundOver = nsTricks >= 7 || ewTricks >= 7
  if (roundOver) {
    const nsWinsRound = nsTricks >= 7
    const isMatchOver = state.roundNumber >= 7
    if (isMatchOver) {
      return {
        ...state,
        players: newPlayers,
        northSouthScore: nsTricks,
        eastWestScore: ewTricks,
        phase: TrickPhase.Finished,
        matchWinner: nsWinsRound ? 'ns' : 'ew',
        currentTrick: { cards: {}, leader: trickWinner },
      }
    }
    const deck = shuffleDeck(createDeck())
    const initialHands = deal(deck.slice(0, 20))
    const remainingDeck = deck.slice(20)
    const resetPlayers: Player[] = newPlayers.map((p) => ({
      ...p,
      hand: sortHand(initialHands[p.position]),
      tricksWon: 0,
    }))
    const nextHokmIndex = POSITIONS.indexOf(trickWinner)
    return {
      ...state,
      players: resetPlayers,
      northSouthScore: 0,
      eastWestScore: 0,
      roundNumber: state.roundNumber + 1,
      phase: TrickPhase.ChoosingHokm,
      hokmPlayer: POSITIONS[nextHokmIndex],
      hokmSuit: undefined,
      currentTrick: { cards: {}, leader: POSITIONS[nextHokmIndex] },
      turn: POSITIONS[nextHokmIndex],
      remainingDeck,
    }
  }
  return {
    ...state,
    players: newPlayers,
    northSouthScore: nsTricks,
    eastWestScore: ewTricks,
    currentTrick: { cards: {}, leader: trickWinner },
    turn: trickWinner,
  }
}

export function canPlayCard(state: LocalGameState, card: Card): boolean {
  if (state.phase !== TrickPhase.Playing) return false
  if (state.turn !== state.playerPosition) return false
  const player = state.players.find((p) => p.position === state.playerPosition)!
  if (!player.hand.some((c) => c.suit === card.suit && c.rank === card.rank)) return false
  const trickCards = Object.values(state.currentTrick.cards).filter(Boolean) as Card[]
  if (trickCards.length === 0) return true
  const ledSuit = trickCards[0].suit
  const hasLedSuit = player.hand.some((c) => c.suit === ledSuit)
  if (hasLedSuit && card.suit !== ledSuit) return false
  return true
}

export function getNextTurn(state: LocalGameState): PlayerPosition {
  return nextPos(state.turn)
}
