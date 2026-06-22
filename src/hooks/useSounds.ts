import { useEffect, useRef } from 'react'
import type { Suit } from '../types/card'
import {
  playTrickWinSound,
  playRoundEndSound,
  playHokmRevealSound,
} from '../services/sounds'

interface UseSoundsOptions {
  northSouthScore: number
  eastWestScore: number
  hokmReveal: Suit | null
}

export function useSounds({
  northSouthScore,
  eastWestScore,
  hokmReveal,
}: UseSoundsOptions) {
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
