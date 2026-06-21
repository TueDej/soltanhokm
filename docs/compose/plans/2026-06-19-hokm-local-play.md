# Hokm Local Play (vs 3 Bots) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use compose:subagent (recommended) or compose:execute to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a fully playable single-player Hokm card game against 3 AI bots, running entirely in the browser with no backend dependency.

**Architecture:** A pure-logic game engine layer (`src/engine/`) handles all rules and state. A React hook (`useLocalGame`) wraps the engine with bot auto-play via `setTimeout`. A menu component routes between game modes. The existing WebSocket/online path remains untouched.

**Tech Stack:** TypeScript, React 19, Vite

---

## File Structure

```
src/
  engine/
    gameEngine.ts    — Pure game logic: phase transitions, trick resolution, win detection
    bot.ts           — Bot AI: choose Hokm, play card (strategic)
  hooks/
    useLocalGame.ts  — React hook wrapping engine, auto-plays bots, exposes player actions
  components/
    MainMenu.tsx     — Mode selection screen (Play vs 3 Bots, disabled multiplayer)
  App.tsx            — Modified: routes between MainMenu and GameBoard
  types/card.ts      — Modified: add deck utility functions
  types/game.ts      — Modified: add LocalGameState type
```

---

### Task 1: Game Engine Core

**Covers:** S1 (game rules), S2 (game flow), S3 (trick resolution)

**Files:**
- Modify: `src/types/card.ts`
- Modify: `src/types/game.ts`
- Create: `src/engine/gameEngine.ts`

- [ ] **Step 1: Add deck utility functions to card.ts**

Append to `src/types/card.ts` (after existing exports):

```typescript
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
```

This requires adding the import of `PlayerPosition` at the top. The file's existing imports already include `Suit`, `Rank`, `RANK_ORDER`. Add `PlayerPosition` from `./game`.

- [ ] **Step 2: Add LocalGameState to game.ts**

Append to `src/types/game.ts`:

```typescript
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
```

This requires adding `import type { Suit } from './card'` at the top of game.ts.

- [ ] **Step 3: Create the game engine**

Create `src/engine/gameEngine.ts`:

```typescript
import type { Card, Suit } from '../types/card'
import { createDeck, shuffleDeck, deal, pickWinner } from '../types/card'
import type { Player } from '../types/game'
import { TrickPhase, PlayerPosition } from '../types/game'
import type { LocalGameState } from '../types/game'

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
  const hands = deal(deck)

  const players: Player[] = POSITIONS.map((pos) => ({
    id: pos,
    name: pos === playerPosition ? playerName : `Bot ${pos}`,
    position: pos,
    hand: hands[pos],
    tricksWon: 0,
  }))

  const hokmPlayerIndex = Math.floor(Math.random() * 4)

  return {
    gameId: crypto.randomUUID(),
    phase: TrickPhase.ChoosingHokm,
    playerPosition,
    players,
    hokmPlayer: POSITIONS[hokmPlayerIndex],
    currentTrick: { cards: {}, leader: POSITIONS[(hokmPlayerIndex + 1) % 4] },
    northSouthScore: 0,
    eastWestScore: 0,
    turn: POSITIONS[hokmPlayerIndex],
    roundNumber: 1,
  }
}

export function chooseHokm(state: LocalGameState, suit: Suit): LocalGameState {
  if (state.phase !== TrickPhase.ChoosingHokm) return state
  return {
    ...state,
    hokmSuit: suit,
    phase: TrickPhase.Playing,
    turn: state.currentTrick.leader,
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
  const allPlayed = Object.keys(newTrickCards).length === 4

  if (allPlayed) {
    const trickWinner = pickWinner(newTrickCards, state.hokmSuit!)
    return resolveTrick(state, newPlayers, trickWinner)
  }

  return {
    ...state,
    players: newPlayers,
    currentTrick: { ...state.currentTrick, cards: newTrickCards },
    turn: nextPos(state.turn),
  }
}

function resolveTrick(
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

  // Match over if either side reaches 7 rounds (tracked via roundNumber)
  // Round over if either side reaches 7 tricks
  const roundOver = nsTricks >= 7 || ewTricks >= 7

  if (roundOver) {
    const nsWinsRound = nsTricks >= 7
    // Check if match is over (best of 7 = first to 4 round wins)
    // We track this via the northSouthScore/eastWestScore after round reset
    // Actually: northSouthScore/eastWestScore are trick counts per round.
    // We need a separate round wins counter. For now, we'll count rounds via roundNumber.
    // Match over when a team wins 4 rounds (roundNumber reaches 8 since we start at 1)
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

    // New round
    const deck = shuffleDeck(createDeck())
    const hands = deal(deck)
    const resetPlayers: Player[] = newPlayers.map((p) => ({
      ...p,
      hand: hands[p.position],
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
      currentTrick: { cards: {}, leader: POSITIONS[(nextHokmIndex + 1) % 4] },
      turn: POSITIONS[nextHokmIndex],
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

  // Must follow suit if possible
  if (hasLedSuit && card.suit !== ledSuit) return false

  // If void in led suit, must play trump if has any
  if (!hasLedSuit && state.hokmSuit) {
    const hasHokm = player.hand.some((c) => c.suit === state.hokmSuit)
    if (hasHokm && card.suit !== state.hokmSuit) return false
  }

  return true
}

export function getNextTurn(state: LocalGameState): PlayerPosition {
  return nextPos(state.turn)
}
```

- [ ] **Step 4: Run type check**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/types/card.ts src/types/game.ts src/engine/gameEngine.ts
git commit -m "feat: add pure game engine with trick resolution and win detection"
```

---

### Task 2: Bot AI

**Covers:** S1 (bot behavior), S3 (strategic card play)

**Files:**
- Create: `src/engine/bot.ts`

- [ ] **Step 1: Create bot decision logic**

Create `src/engine/bot.ts`:

```typescript
import type { Card, Suit } from '../types/card'
import { Rank, RANK_ORDER } from '../types/card'
import type { LocalGameState } from '../types/game'
import { TrickPhase, PlayerPosition } from '../types/game'
import { canPlayCard } from './gameEngine'

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

  const playable = bot.hand.filter((card) => canPlayCard(state, card))
  if (playable.length === 0) return null

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
```

- [ ] **Step 2: Run type check**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/engine/bot.ts
git commit -m "feat: add strategic bot AI for Hokm card play"
```

---

### Task 3: Local Game Hook

**Covers:** S2 (game flow), S4 (player interaction)

**Files:**
- Create: `src/hooks/useLocalGame.ts`

- [ ] **Step 1: Create the local game hook**

Create `src/hooks/useLocalGame.ts`:

```typescript
import { useState, useEffect, useCallback, useRef } from 'react'
import type { Card, Suit } from '../types/card'
import type { LocalGameState } from '../types/game'
import { TrickPhase, PlayerPosition } from '../types/game'
import {
  createLocalGame,
  chooseHokm as engineChooseHokm,
  playCard as enginePlayCard,
  canPlayCard,
} from '../engine/gameEngine'
import { botChooseHokm, botPlayCard } from '../engine/bot'

export function useLocalGame(playerName: string) {
  const [game, setGame] = useState<LocalGameState | null>(null)
  const [isThinking, setIsThinking] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const startGame = useCallback(() => {
    setGame(createLocalGame(playerName, PlayerPosition.South))
    setIsThinking(false)
  }, [playerName])

  const chooseHokmAction = useCallback((suit: Suit) => {
    setGame((prev) => {
      if (!prev || prev.phase !== TrickPhase.ChoosingHokm) return prev
      if (prev.turn !== prev.playerPosition) return prev
      return engineChooseHokm(prev, suit)
    })
  }, [])

  const playCardAction = useCallback((card: Card) => {
    setGame((prev) => {
      if (!prev || prev.phase !== TrickPhase.Playing) return prev
      if (prev.turn !== prev.playerPosition) return prev
      if (!canPlayCard(prev, card)) return prev
      return enginePlayCard(prev, card)
    })
  }, [])

  useEffect(() => {
    if (!game) return
    if (game.phase === TrickPhase.Finished) return

    if (game.turn === game.playerPosition) {
      setIsThinking(false)
      return
    }

    setIsThinking(true)

    timerRef.current = setTimeout(() => {
      setGame((prev) => {
        if (!prev || prev.phase === TrickPhase.Finished) return prev
        if (prev.turn === prev.playerPosition) return prev

        if (prev.phase === TrickPhase.ChoosingHokm) {
          const suit = botChooseHokm(prev)
          if (suit) return engineChooseHokm(prev, suit)
          return prev
        }

        const card = botPlayCard(prev)
        if (card) return enginePlayCard(prev, card)
        return prev
      })
    }, 800)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [game?.turn, game?.phase, game?.playerPosition])

  return {
    game,
    isThinking,
    startGame,
    chooseHokm: chooseHokmAction,
    playCard: playCardAction,
  }
}
```

- [ ] **Step 2: Run type check**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useLocalGame.ts
git commit -m "feat: add useLocalGame hook with bot auto-play"
```

---

### Task 4: MainMenu Component

**Covers:** S5 (game mode selection)

**Files:**
- Create: `src/components/MainMenu.tsx`

- [ ] **Step 1: Create MainMenu component**

Create `src/components/MainMenu.tsx`:

```tsx
import { useState } from 'react'

interface MainMenuProps {
  onSelectMode: (mode: 'local' | 'online', playerName: string) => void
}

export function MainMenu({ onSelectMode }: MainMenuProps) {
  const [playerName, setPlayerName] = useState('')

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 20,
        marginTop: 100,
      }}
    >
      <h1 style={{ fontSize: 48, marginBottom: 10 }}>سلطان حکم</h1>
      <p style={{ color: '#aaa' }}>Hokm Card Game</p>

      <input
        placeholder="نام خود را وارد کنید"
        value={playerName}
        onChange={(e) => setPlayerName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && playerName.trim() && onSelectMode('local', playerName.trim())}
        style={{
          padding: '12px 20px',
          fontSize: 18,
          borderRadius: 8,
          border: '2px solid #444',
          background: '#222',
          color: '#fff',
          width: 280,
          textAlign: 'center',
        }}
      />

      <button
        onClick={() => onSelectMode('local', playerName.trim())}
        disabled={!playerName.trim()}
        style={{
          padding: '14px 40px',
          fontSize: 18,
          borderRadius: 8,
          border: 'none',
          background: playerName.trim() ? '#2d8a3e' : '#444',
          color: '#fff',
          cursor: playerName.trim() ? 'pointer' : 'not-allowed',
          width: 320,
        }}
      >
        بازی با ۳ ربات
      </button>

      <button
        disabled
        title="به زودی..."
        style={{
          padding: '14px 40px',
          fontSize: 18,
          borderRadius: 8,
          border: 'none',
          background: '#333',
          color: '#666',
          cursor: 'not-allowed',
          width: 320,
        }}
      >
        ۲ نفره (به زودی)
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Run type check**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/MainMenu.tsx
git commit -m "feat: add MainMenu with game mode selection"
```

---

### Task 5: Wire Up App.tsx

**Covers:** S5 (routing), S2 (game flow)

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Rewrite App.tsx**

Replace entire `src/App.tsx`:

```tsx
import { useState } from 'react'
import { MessageType, type OutgoingMessage, type ServerMessage } from './types/socket'
import type { GameState } from './types/game'
import { TrickPhase } from './types/game'
import type { Card } from './types/card'
import { useSocket } from './hooks/useSocket'
import { GameBoard } from './components/GameBoard'
import { MainMenu } from './components/MainMenu'
import { useLocalGame } from './hooks/useLocalGame'

const WS_URL = import.meta.env.VITE_WS_URL ?? 'ws://localhost:8080'

type Mode = null | 'local' | 'online'

export default function App() {
  const [mode, setMode] = useState<Mode>(null)
  const [playerName, setPlayerName] = useState('')

  const [onlineGame, setOnlineGame] = useState<GameState | null>(null)
  const [playerId, setPlayerId] = useState('')

  const { send, onMessage } = useSocket(WS_URL)

  onMessage((msg: ServerMessage) => {
    if (msg.type === MessageType.GameState) {
      setOnlineGame(msg.payload as GameState)
    }
  })

  const localGame = useLocalGame(playerName)

  function handleSelectMode(selectedMode: Mode, name: string) {
    setPlayerName(name)
    setMode(selectedMode)
  }

  function playOnlineCard(card: Card) {
    if (!onlineGame) return
    send({
      type: MessageType.PlayCard,
      payload: { card },
    } as OutgoingMessage)
  }

  if (!mode) {
    return <MainMenu onSelectMode={handleSelectMode} />
  }

  if (mode === 'local') {
    if (!localGame.game) {
      return (
        <div style={{ textAlign: 'center', marginTop: 60 }}>
          <h2>بازی با ۳ ربات</h2>
          <p style={{ color: '#aaa', marginBottom: 20 }}>
            بازیکن: {playerName}
          </p>
          <button
            onClick={localGame.startGame}
            style={{
              padding: '14px 40px',
              fontSize: 18,
              borderRadius: 8,
              border: 'none',
              background: '#2d8a3e',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            شروع بازی
          </button>
        </div>
      )
    }

    if (localGame.game.phase === TrickPhase.Finished) {
      const nsWins = localGame.game.matchWinner === 'ns'
      return (
        <div style={{ textAlign: 'center', marginTop: 60 }}>
          <h2>بازی تمام شد!</h2>
          <p style={{ color: '#aaa', marginBottom: 10 }}>
            {nsWins ? 'شما بردید!' : 'ربات‌ها بردند.'}
          </p>
          <p style={{ color: '#888', marginBottom: 20 }}>
            ست‌ها: {localGame.game.roundNumber - 1}
          </p>
          <button
            onClick={localGame.startGame}
            style={{
              padding: '14px 40px',
              fontSize: 18,
              borderRadius: 8,
              border: 'none',
              background: '#2d8a3e',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            بازی دوباره
          </button>
        </div>
      )
    }

    const isMyTurn = localGame.game.turn === localGame.game.playerPosition

    return (
      <div>
        <div style={{ textAlign: 'center', padding: 10, color: '#aaa', minHeight: 40 }}>
          {localGame.isThinking && 'در حال فکر...'}
          {!localGame.isThinking && isMyTurn && localGame.game.phase === TrickPhase.ChoosingHokm && (
            <p>نوبت شما: حکم را انتخاب کنید</p>
          )}
          {!localGame.isThinking && isMyTurn && localGame.game.phase === TrickPhase.Playing && (
            <p>نوبت شما: کارت بزنید</p>
          )}
        </div>
        <GameBoard
          game={{
            id: localGame.game.gameId,
            phase: localGame.game.phase,
            players: localGame.game.players,
            hokmSuit: localGame.game.hokmSuit,
            currentTrick: localGame.game.currentTrick,
            northSouthScore: localGame.game.northSouthScore,
            eastWestScore: localGame.game.eastWestScore,
            turn: localGame.game.turn,
          }}
          playerId={localGame.game.playerPosition}
          onPlayCard={localGame.playCard}
          onChooseHokm={localGame.chooseHokm}
        />
      </div>
    )
  }

  if (mode === 'online') {
    return (
      <GameBoard
        game={onlineGame!}
        playerId={playerId}
        onPlayCard={playOnlineCard}
      />
    )
  }

  return null
}
```

- [ ] **Step 2: Run type check**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat: wire up MainMenu and local game into App.tsx"
```

---

### Task 6: Update GameBoard for Hokm Selection

**Covers:** S4 (hokm selection UI)

**Files:**
- Modify: `src/components/GameBoard.tsx`

- [ ] **Step 1: Add onChooseHokm prop and suit picker**

Read `src/components/GameBoard.tsx`, then add the `onChooseHokm` optional prop to the interface and add a suit picker UI. After the `<Table>` component, add:

```tsx
{game.phase === TrickPhase.ChoosingHokm && game.turn === playerId && onChooseHokm && (
  <div style={{ marginTop: 20 }}>
    <p>حکم را انتخاب کنید:</p>
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 8 }}>
      {(['hearts', 'diamonds', 'clubs', 'spades'] as const).map((suit) => (
        <button
          key={suit}
          onClick={() => onChooseHokm(suit)}
          style={{
            padding: '10px 18px',
            borderRadius: 6,
            border: '2px solid #444',
            background: '#333',
            color: '#fff',
            cursor: 'pointer',
            fontSize: 16,
          }}
        >
          {suit}
        </button>
      ))}
    </div>
  </div>
)}
```

Also update the interface:

```tsx
interface GameBoardProps {
  game: GameState
  playerId: string
  onPlayCard: (card: Card) => void
  onChooseHokm?: (suit: Suit) => void
}
```

- [ ] **Step 2: Run type check**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/GameBoard.tsx
git commit -m "feat: add Hokm suit picker to GameBoard"
```

---

### Task 7: Full Integration Test

**Covers:** S6 (verification)

**Files:** None

- [ ] **Step 1: Run type check**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 2: Run production build**

Run: `npx vite build`
Expected: SUCCESS, dist/ directory created

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: verify build passes for local play mode"
```
