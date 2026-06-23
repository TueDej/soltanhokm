import type { Card } from '../types/card'

import imgHearts2 from '../../assets/PNG/Cards (large)/card_hearts_2.png'
import imgHearts3 from '../../assets/PNG/Cards (large)/card_hearts_3.png'
import imgHearts4 from '../../assets/PNG/Cards (large)/card_hearts_4.png'
import imgHearts5 from '../../assets/PNG/Cards (large)/card_hearts_5.png'
import imgHearts6 from '../../assets/PNG/Cards (large)/card_hearts_6.png'
import imgHearts7 from '../../assets/PNG/Cards (large)/card_hearts_7.png'
import imgHearts8 from '../../assets/PNG/Cards (large)/card_hearts_8.png'
import imgHearts9 from '../../assets/PNG/Cards (large)/card_hearts_9.png'
import imgHearts10 from '../../assets/PNG/Cards (large)/card_hearts_10.png'
import imgHeartsJ from '../../assets/PNG/Cards (large)/card_hearts_J.png'
import imgHeartsQ from '../../assets/PNG/Cards (large)/card_hearts_Q.png'
import imgHeartsK from '../../assets/PNG/Cards (large)/card_hearts_K.png'
import imgHeartsA from '../../assets/PNG/Cards (large)/card_hearts_A.png'

import imgDiamonds2 from '../../assets/PNG/Cards (large)/card_diamonds_2.png'
import imgDiamonds3 from '../../assets/PNG/Cards (large)/card_diamonds_3.png'
import imgDiamonds4 from '../../assets/PNG/Cards (large)/card_diamonds_4.png'
import imgDiamonds5 from '../../assets/PNG/Cards (large)/card_diamonds_5.png'
import imgDiamonds6 from '../../assets/PNG/Cards (large)/card_diamonds_6.png'
import imgDiamonds7 from '../../assets/PNG/Cards (large)/card_diamonds_7.png'
import imgDiamonds8 from '../../assets/PNG/Cards (large)/card_diamonds_8.png'
import imgDiamonds9 from '../../assets/PNG/Cards (large)/card_diamonds_9.png'
import imgDiamonds10 from '../../assets/PNG/Cards (large)/card_diamonds_10.png'
import imgDiamondsJ from '../../assets/PNG/Cards (large)/card_diamonds_J.png'
import imgDiamondsQ from '../../assets/PNG/Cards (large)/card_diamonds_Q.png'
import imgDiamondsK from '../../assets/PNG/Cards (large)/card_diamonds_K.png'
import imgDiamondsA from '../../assets/PNG/Cards (large)/card_diamonds_A.png'

import imgClubs2 from '../../assets/PNG/Cards (large)/card_clubs_2.png'
import imgClubs3 from '../../assets/PNG/Cards (large)/card_clubs_3.png'
import imgClubs4 from '../../assets/PNG/Cards (large)/card_clubs_4.png'
import imgClubs5 from '../../assets/PNG/Cards (large)/card_clubs_5.png'
import imgClubs6 from '../../assets/PNG/Cards (large)/card_clubs_6.png'
import imgClubs7 from '../../assets/PNG/Cards (large)/card_clubs_7.png'
import imgClubs8 from '../../assets/PNG/Cards (large)/card_clubs_8.png'
import imgClubs9 from '../../assets/PNG/Cards (large)/card_clubs_9.png'
import imgClubs10 from '../../assets/PNG/Cards (large)/card_clubs_10.png'
import imgClubsJ from '../../assets/PNG/Cards (large)/card_clubs_J.png'
import imgClubsQ from '../../assets/PNG/Cards (large)/card_clubs_Q.png'
import imgClubsK from '../../assets/PNG/Cards (large)/card_clubs_K.png'
import imgClubsA from '../../assets/PNG/Cards (large)/card_clubs_A.png'

import imgSpades2 from '../../assets/PNG/Cards (large)/card_spades_2.png'
import imgSpades3 from '../../assets/PNG/Cards (large)/card_spades_3.png'
import imgSpades4 from '../../assets/PNG/Cards (large)/card_spades_4.png'
import imgSpades5 from '../../assets/PNG/Cards (large)/card_spades_5.png'
import imgSpades6 from '../../assets/PNG/Cards (large)/card_spades_6.png'
import imgSpades7 from '../../assets/PNG/Cards (large)/card_spades_7.png'
import imgSpades8 from '../../assets/PNG/Cards (large)/card_spades_8.png'
import imgSpades9 from '../../assets/PNG/Cards (large)/card_spades_9.png'
import imgSpades10 from '../../assets/PNG/Cards (large)/card_spades_10.png'
import imgSpadesJ from '../../assets/PNG/Cards (large)/card_spades_J.png'
import imgSpadesQ from '../../assets/PNG/Cards (large)/card_spades_Q.png'
import imgSpadesK from '../../assets/PNG/Cards (large)/card_spades_K.png'
import imgSpadesA from '../../assets/PNG/Cards (large)/card_spades_A.png'

const CARD_IMAGES: Record<string, Record<string, string>> = {
  hearts: {
    '2': imgHearts2, '3': imgHearts3, '4': imgHearts4, '5': imgHearts5,
    '6': imgHearts6, '7': imgHearts7, '8': imgHearts8, '9': imgHearts9,
    '10': imgHearts10, 'J': imgHeartsJ, 'Q': imgHeartsQ, 'K': imgHeartsK, 'A': imgHeartsA,
  },
  diamonds: {
    '2': imgDiamonds2, '3': imgDiamonds3, '4': imgDiamonds4, '5': imgDiamonds5,
    '6': imgDiamonds6, '7': imgDiamonds7, '8': imgDiamonds8, '9': imgDiamonds9,
    '10': imgDiamonds10, 'J': imgDiamondsJ, 'Q': imgDiamondsQ, 'K': imgDiamondsK, 'A': imgDiamondsA,
  },
  clubs: {
    '2': imgClubs2, '3': imgClubs3, '4': imgClubs4, '5': imgClubs5,
    '6': imgClubs6, '7': imgClubs7, '8': imgClubs8, '9': imgClubs9,
    '10': imgClubs10, 'J': imgClubsJ, 'Q': imgClubsQ, 'K': imgClubsK, 'A': imgClubsA,
  },
  spades: {
    '2': imgSpades2, '3': imgSpades3, '4': imgSpades4, '5': imgSpades5,
    '6': imgSpades6, '7': imgSpades7, '8': imgSpades8, '9': imgSpades9,
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
