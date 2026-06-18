import type { GameState } from '../types/game'
import { TrickPhase } from '../types/game'
import { Suit } from '../types/card'
import type { Card } from '../types/card'
import { Hand } from './Hand'
import { Table } from './Table'
import { useLanguage } from '../context/LanguageContext'

interface GameBoardProps {
  game: GameState
  playerId: string
  onPlayCard: (card: Card) => void
  onChooseHokm?: (suit: Suit) => void
}

export function GameBoard({ game, playerId, onPlayCard, onChooseHokm }: GameBoardProps) {
  const { t } = useLanguage()
  const me = game.players.find((p) => p.id === playerId)
  const isMyTurn = me && game.turn === me.position

  const PHASE_LABEL: Record<TrickPhase, string> = {
    [TrickPhase.WaitingForPlayers]: t('thinking'),
    [TrickPhase.ChoosingHokm]: t('selectingHokm'),
    [TrickPhase.ChoosingTeam]: t('choosingTeam'),
    [TrickPhase.Playing]: t('playing'),
    [TrickPhase.Finished]: t('finished'),
  }

  return (
    <div style={{ textAlign: 'center', padding: 20 }}>
      <h2>{PHASE_LABEL[game.phase]}</h2>
      {game.hokmSuit && <p>{t('hokmIs')}: {game.hokmSuit}</p>}

      <div style={{ display: 'flex', justifyContent: 'space-between', margin: '10px 0' }}>
        <span>{t('northSouth')}: {game.northSouthScore}</span>
        <span>{t('eastWest')}: {game.eastWestScore}</span>
      </div>

      <Table trick={game.currentTrick} />

      {game.phase === TrickPhase.ChoosingHokm && game.turn === playerId && onChooseHokm && (
        <div style={{ marginTop: 20 }}>
          <p>{t('pickTrump')}</p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 8 }}>
            {[Suit.Hearts, Suit.Diamonds, Suit.Clubs, Suit.Spades].map((suit) => (
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

      {me && (
        <div style={{ marginTop: 20 }}>
          <p>{t('yourHand')} ({me.position}):</p>
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
