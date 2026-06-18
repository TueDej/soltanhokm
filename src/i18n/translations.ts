export type Language = 'en' | 'fa'

const translations = {
  en: {
    title: 'Soltan Hokm',
    subtitle: 'Hokm Card Game',
    enterName: 'Enter your name',
    playVs3Bots: 'Play vs 3 Bots',
    twoPlayers: '2 Players (Coming Soon)',
    startGame: 'Start Game',
    playingWith: 'Playing with',
    gameFinished: 'Game Over!',
    youWon: 'You won!',
    botsWon: 'Bots won.',
    rounds: 'Rounds',
    playAgain: 'Play Again',
    thinking: 'Thinking...',
    chooseHokm: 'Your turn: Choose trump suit',
    yourTurn: 'Your turn: Play a card',
    selectingHokm: 'Choosing Trump',
    choosingTeam: 'Choosing Team',
    playing: 'Playing',
    finished: 'Finished',
    hokmIs: 'Trump is',
    northSouth: 'North-South',
    eastWest: 'East-West',
    yourHand: 'Your hand',
    pickTrump: 'Choose trump suit:',
  },
  fa: {
    title: 'سلطان حکم',
    subtitle: 'بازی کارتی حکم',
    enterName: 'نام خود را وارد کنید',
    playVs3Bots: 'بازی با ۳ ربات',
    twoPlayers: '۲ نفره (به زودی)',
    startGame: 'شروع بازی',
    playingWith: 'بازیکن',
    gameFinished: 'بازی تمام شد!',
    youWon: 'شما بردید!',
    botsWon: 'ربات‌ها بردند.',
    rounds: 'ست‌ها',
    playAgain: 'بازی دوباره',
    thinking: 'در حال فکر...',
    chooseHokm: 'نوبت شما: حکم را انتخاب کنید',
    yourTurn: 'نوبت شما: کارت بزنید',
    selectingHokm: 'انتخاب حکم',
    choosingTeam: 'انتخاب هم‌تیمی',
    playing: 'در حال بازی',
    finished: 'پایان بازی',
    hokmIs: 'حکم',
    northSouth: 'شمال-جنوب',
    eastWest: 'شرق-غرب',
    yourHand: 'دست شما',
    pickTrump: 'حکم را انتخاب کنید:',
  },
} as const

export type TranslationKey = keyof typeof translations.en

export function t(key: TranslationKey, lang: Language): string {
  return translations[lang][key]
}
