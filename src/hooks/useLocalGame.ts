import { useState, useEffect, useCallback, useRef } from 'react'
import type { Card, Suit } from '../types/card'
import type { LocalGameState } from '../types/game'
import { TrickPhase, PlayerPosition } from '../types/game'
import {
  createLocalGame,
  chooseHokm as engineChooseHokm,
  playCard as enginePlayCard,
  canPlayCard,
  isTrickComplete,
  resolveTrick,
} from '../engine/gameEngine'
import { botChooseHokm, botPlayCard } from '../engine/bot'

export function useLocalGame(playerName: string) {
  const [game, setGame] = useState<LocalGameState | null>(null)
  const [isThinking, setIsThinking] = useState(false)
  const botTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const trickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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
      if (isTrickComplete(prev)) return prev
      if (!canPlayCard(prev, card)) return prev
      return enginePlayCard(prev, card)
    })
  }, [])

  // Trick resolution effect
  useEffect(() => {
    if (!game || game.phase === TrickPhase.Finished) return
    if (game.phase !== TrickPhase.Playing) return
    if (!isTrickComplete(game)) return

    trickTimerRef.current = setTimeout(() => {
      setGame((prev) => {
        if (!prev || prev.phase === TrickPhase.Finished) return prev
        if (!isTrickComplete(prev)) return prev
        return resolveTrick(prev)
      })
    }, 1500)

    return () => {
      if (trickTimerRef.current) clearTimeout(trickTimerRef.current)
    }
  }, [game?.phase, game?.currentTrick])

  // Bot turn effect — always returns a cleanup function
  useEffect(() => {
    // Always clear previous timer on every render
    if (botTimerRef.current) {
      clearTimeout(botTimerRef.current)
      botTimerRef.current = null
    }

    if (!game || game.phase === TrickPhase.Finished) return

    // Only schedule if it's the bot's turn
    if (game.turn === game.playerPosition) {
      setIsThinking(false)
      return () => {}
    }

    // During ChoosingHokm, don't check trick completion
    if (game.phase === TrickPhase.Playing && isTrickComplete(game)) {
      return () => {}
    }

    setIsThinking(true)

    const timer = setTimeout(() => {
      setGame((prev) => {
        if (!prev || prev.phase === TrickPhase.Finished) return prev
        if (prev.turn === prev.playerPosition) return prev

        if (prev.phase === TrickPhase.ChoosingHokm) {
          const suit = botChooseHokm(prev)
          if (suit) return engineChooseHokm(prev, suit)
          return prev
        }

        if (isTrickComplete(prev)) return prev

        const card = botPlayCard(prev)
        if (card) return enginePlayCard(prev, card)

        const bot = prev.players.find((p) => p.position === prev.turn)
        if (bot && bot.hand.length > 0) {
          return enginePlayCard(prev, bot.hand[0])
        }
        return prev
      })
    }, 800)

    botTimerRef.current = timer
    return () => clearTimeout(timer)
  }, [game?.turn, game?.phase, game?.playerPosition])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (botTimerRef.current) clearTimeout(botTimerRef.current)
      if (trickTimerRef.current) clearTimeout(trickTimerRef.current)
    }
  }, [])

  return {
    game,
    isThinking,
    startGame,
    chooseHokm: chooseHokmAction,
    playCard: playCardAction,
  }
}
