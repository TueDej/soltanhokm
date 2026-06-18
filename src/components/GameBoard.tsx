import type { GameState } from '../types/game'
import { TrickPhase } from '../types/game'
import type { Card } from '../types/card'
import { Hand } from './Hand'
import { Table } from './Table'

interface GameBoardProps {
  game: GameState
  playerId: string
  onPlayCard: (card: Card) => void
}

const PHASE_LABEL: Record<TrickPhase, string> = {
  [TrickPhase.WaitingForPlayers]: 'منتظر سایر بازیکنان...',
  [TrickPhase.ChoosingHokm]: 'انتخاب حکم',
  [TrickPhase.ChoosingTeam]: 'انتخاب هم‌تیمی',
  [TrickPhase.Playing]: 'در حال بازی',
  [TrickPhase.Finished]: 'پایان بازی',
}

export function GameBoard({ game, playerId, onPlayCard }: GameBoardProps) {
  const me = game.players.find((p) => p.id === playerId)
  const isMyTurn = me && game.turn === me.position

  return (
    <div style={{ textAlign: 'center', padding: 20 }}>
      <h2>{PHASE_LABEL[game.phase]}</h2>
      {game.hokmSuit && <p>حکم: {game.hokmSuit}</p>}

      <div style={{ display: 'flex', justifyContent: 'space-between', margin: '10px 0' }}>
        <span>شمال-جنوب: {game.northSouthScore}</span>
        <span>شرق-غرب: {game.eastWestScore}</span>
      </div>

      <Table trick={game.currentTrick} />

      {me && (
        <div style={{ marginTop: 20 }}>
          <p>دست شما ({me.position}):</p>
          <Hand
            cards={me.hand}
            onPlayCard={onPlayCard}
            disabled={!isMyTurn || game.phase !== TrickPhase.Playing}
          />
        </div>
      )}
    </div>
  )
}