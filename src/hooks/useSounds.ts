import { useEffect, useRef } from 'react'
import type { TrickPhase } from '../types/game'
import type { Suit } from '../types/card'
import {
  playCardSound,
  playTrumpSound,
  playTrickWinSound,
  playRoundEndSound,
  playHokmRevealSound,
} from '../services/sounds'

interface UseSoundsOptions {
  phase: TrickPhase | undefined
  turn: string | undefined
  playerId: string | undefined
  hokmSuit: Suit | undefined
  trickCardCount: number
  northSouthScore: number
  eastWestScore: number
  hokmReveal: Suit | null
}

export function useSounds({
  phase,
  turn,
  playerId,
  hokmSuit,
  trickCardCount,
  northSouthScore,
  eastWestScore,
  hokmReveal,
}: UseSoundsOptions) {
  const prevTrickCountRef = useRef(trickCardCount)
  const prevNSScoreRef = useRef(northSouthScore)
  const prevEWScoreRef = useRef(eastWestScore)
  const prevHokmRevealRef = useRef<Suit | null>(hokmReveal)

  useEffect(() => {
    if (hokmReveal && !prevHokmRevealRef.current) {
      playHokmRevealSound()
    }
    prevHokmRevealRef.current = hokmReveal
  }, [hokmReveal])

  useEffect(() => {
    if (phase !== 'Playing' || !playerId) return

    if (turn === playerId && trickCardCount === 0) {
      return
    }

    if (trickCardCount > prevTrickCountRef.current) {
      if (hokmSuit && phase === 'Playing') {
        playTrumpSound()
      } else {
        playCardSound()
      }
    }

    prevTrickCountRef.current = trickCardCount
  }, [trickCardCount, turn, playerId, phase, hokmSuit])

  useEffect(() => {
    if (northSouthScore + eastWestScore > prevNSScoreRef.current + prevEWScoreRef.current) {
      if (northSouthScore >= 7 || eastWestScore >= 7) {
        playRoundEndSound()
      } else {
        playTrickWinSound()
      }
    }
    prevNSScoreRef.current = northSouthScore
    prevEWScoreRef.current = eastWestScore
  }, [northSouthScore, eastWestScore])
}
