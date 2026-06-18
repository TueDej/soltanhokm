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
