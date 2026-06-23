import type { Card } from '../types/card'

import imgHearts02 from '../../assets/PNG/Cards (large)/card_hearts_02.png'
import imgHearts03 from '../../assets/PNG/Cards (large)/card_hearts_03.png'
import imgHearts04 from '../../assets/PNG/Cards (large)/card_hearts_04.png'
import imgHearts05 from '../../assets/PNG/Cards (large)/card_hearts_05.png'
import imgHearts06 from '../../assets/PNG/Cards (large)/card_hearts_06.png'
import imgHearts07 from '../../assets/PNG/Cards (large)/card_hearts_07.png'
import imgHearts08 from '../../assets/PNG/Cards (large)/card_hearts_08.png'
import imgHearts09 from '../../assets/PNG/Cards (large)/card_hearts_09.png'
import imgHearts10 from '../../assets/PNG/Cards (large)/card_hearts_10.png'
import imgHeartsJ from '../../assets/PNG/Cards (large)/card_hearts_J.png'
import imgHeartsQ from '../../assets/PNG/Cards (large)/card_hearts_Q.png'
import imgHeartsK from '../../assets/PNG/Cards (large)/card_hearts_K.png'
import imgHeartsA from '../../assets/PNG/Cards (large)/card_hearts_A.png'

import imgDiamonds02 from '../../assets/PNG/Cards (large)/card_diamonds_02.png'
import imgDiamonds03 from '../../assets/PNG/Cards (large)/card_diamonds_03.png'
import imgDiamonds04 from '../../assets/PNG/Cards (large)/card_diamonds_04.png'
import imgDiamonds05 from '../../assets/PNG/Cards (large)/card_diamonds_05.png'
import imgDiamonds06 from '../../assets/PNG/Cards (large)/card_diamonds_06.png'
import imgDiamonds07 from '../../assets/PNG/Cards (large)/card_diamonds_07.png'
import imgDiamonds08 from '../../assets/PNG/Cards (large)/card_diamonds_08.png'
import imgDiamonds09 from '../../assets/PNG/Cards (large)/card_diamonds_09.png'
import imgDiamonds10 from '../../assets/PNG/Cards (large)/card_diamonds_10.png'
import imgDiamondsJ from '../../assets/PNG/Cards (large)/card_diamonds_J.png'
import imgDiamondsQ from '../../assets/PNG/Cards (large)/card_diamonds_Q.png'
import imgDiamondsK from '../../assets/PNG/Cards (large)/card_diamonds_K.png'
import imgDiamondsA from '../../assets/PNG/Cards (large)/card_diamonds_A.png'

import imgClubs02 from '../../assets/PNG/Cards (large)/card_clubs_02.png'
import imgClubs03 from '../../assets/PNG/Cards (large)/card_clubs_03.png'
import imgClubs04 from '../../assets/PNG/Cards (large)/card_clubs_04.png'
import imgClubs05 from '../../assets/PNG/Cards (large)/card_clubs_05.png'
import imgClubs06 from '../../assets/PNG/Cards (large)/card_clubs_06.png'
import imgClubs07 from '../../assets/PNG/Cards (large)/card_clubs_07.png'
import imgClubs08 from '../../assets/PNG/Cards (large)/card_clubs_08.png'
import imgClubs09 from '../../assets/PNG/Cards (large)/card_clubs_09.png'
import imgClubs10 from '../../assets/PNG/Cards (large)/card_clubs_10.png'
import imgClubsJ from '../../assets/PNG/Cards (large)/card_clubs_J.png'
import imgClubsQ from '../../assets/PNG/Cards (large)/card_clubs_Q.png'
import imgClubsK from '../../assets/PNG/Cards (large)/card_clubs_K.png'
import imgClubsA from '../../assets/PNG/Cards (large)/card_clubs_A.png'

import imgSpades02 from '../../assets/PNG/Cards (large)/card_spades_02.png'
import imgSpades03 from '../../assets/PNG/Cards (large)/card_spades_03.png'
import imgSpades04 from '../../assets/PNG/Cards (large)/card_spades_04.png'
import imgSpades05 from '../../assets/PNG/Cards (large)/card_spades_05.png'
import imgSpades06 from '../../assets/PNG/Cards (large)/card_spades_06.png'
import imgSpades07 from '../../assets/PNG/Cards (large)/card_spades_07.png'
import imgSpades08 from '../../assets/PNG/Cards (large)/card_spades_08.png'
import imgSpades09 from '../../assets/PNG/Cards (large)/card_spades_09.png'
import imgSpades10 from '../../assets/PNG/Cards (large)/card_spades_10.png'
import imgSpadesJ from '../../assets/PNG/Cards (large)/card_spades_J.png'
import imgSpadesQ from '../../assets/PNG/Cards (large)/card_spades_Q.png'
import imgSpadesK from '../../assets/PNG/Cards (large)/card_spades_K.png'
import imgSpadesA from '../../assets/PNG/Cards (large)/card_spades_A.png'

const CARD_IMAGES: Record<string, Record<string, string>> = {
  hearts: {
    '2': imgHearts02, '3': imgHearts03, '4': imgHearts04, '5': imgHearts05,
    '6': imgHearts06, '7': imgHearts07, '8': imgHearts08, '9': imgHearts09,
    '10': imgHearts10, 'J': imgHeartsJ, 'Q': imgHeartsQ, 'K': imgHeartsK, 'A': imgHeartsA,
  },
  diamonds: {
    '2': imgDiamonds02, '3': imgDiamonds03, '4': imgDiamonds04, '5': imgDiamonds05,
    '6': imgDiamonds06, '7': imgDiamonds07, '8': imgDiamonds08, '9': imgDiamonds09,
    '10': imgDiamonds10, 'J': imgDiamondsJ, 'Q': imgDiamondsQ, 'K': imgDiamondsK, 'A': imgDiamondsA,
  },
  clubs: {
    '2': imgClubs02, '3': imgClubs03, '4': imgClubs04, '5': imgClubs05,
    '6': imgClubs06, '7': imgClubs07, '8': imgClubs08, '9': imgClubs09,
    '10': imgClubs10, 'J': imgClubsJ, 'Q': imgClubsQ, 'K': imgClubsK, 'A': imgClubsA,
  },
  spades: {
    '2': imgSpades02, '3': imgSpades03, '4': imgSpades04, '5': imgSpades05,
    '6': imgSpades06, '7': imgSpades07, '8': imgSpades08, '9': imgSpades09,
    '10': imgSpades10, 'J': imgSpadesJ, 'Q': imgSpadesQ, 'K': imgSpadesK, 'A': imgSpadesA,
  },
}

interface CardProps {
  card: Card
  onClick?: () => void
  disabled?: boolean
  dimmed?: boolean
}

export function Card({ card, onClick, disabled, dimmed }: CardProps) {
  const src = CARD_IMAGES[card.suit]?.[card.rank]
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`game-card${dimmed ? ' game-card-dimmed' : ''}`}
    >
      {src && <img src={src} alt={`${card.rank} of ${card.suit}`} draggable={false} />}
    </button>
  )
}
