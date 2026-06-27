package main

import (
	"math/rand"
	"sort"
)

// --- Deck ---

type Trick struct {
	Cards  map[PlayerPosition]*Card `json:"cards"`
	Leader PlayerPosition           `json:"leader"`
}

type GameState struct {
	GameID          string
	Phase           TrickPhase
	Players         []*Player
	HokmSuit        *Suit
	HokmPlayer      PlayerPosition
	CurrentTrick    Trick
	NorthSouthScore int
	EastWestScore   int
	NsGamesWon      int
	EwGamesWon      int
	Turn            PlayerPosition
	RoundNumber     int
	MatchWinner     *string
	RemainingDeck   []Card
	HandsToWin      int
	HandWinner      *string
	NextHokmPlayer  PlayerPosition
}

var RANK_ORDER = map[Rank]int{
	Two: 0, Three: 1, Four: 2, Five: 3, Six: 4,
	Seven: 5, Eight: 6, Nine: 7, Ten: 8,
	Jack: 9, Queen: 10, King: 11, Ace: 12,
}

var SUIT_ORDER = map[Suit]int{
	Hearts: 0, Diamonds: 1, Clubs: 2, Spades: 3,
}

var AllRanks = []Rank{Two, Three, Four, Five, Six, Seven, Eight, Nine, Ten, Jack, Queen, King, Ace}
var AllSuits = []Suit{Hearts, Diamonds, Clubs, Spades}

func CreateDeck() []Card {
	var deck []Card
	for _, suit := range AllSuits {
		for _, rank := range AllRanks {
			deck = append(deck, Card{Suit: suit, Rank: rank})
		}
	}
	return deck
}

func ShuffleDeck(deck []Card) []Card {
	shuffled := make([]Card, len(deck))
	copy(shuffled, deck)
	for i := len(shuffled) - 1; i > 0; i-- {
		j := rand.Intn(i + 1)
		shuffled[i], shuffled[j] = shuffled[j], shuffled[i]
	}
	return shuffled
}

func SortHand(hand []Card) []Card {
	sorted := make([]Card, len(hand))
	copy(sorted, hand)
	sort.Slice(sorted, func(i, j int) bool {
		if SUIT_ORDER[sorted[i].Suit] != SUIT_ORDER[sorted[j].Suit] {
			return SUIT_ORDER[sorted[i].Suit] < SUIT_ORDER[sorted[j].Suit]
		}
		return RANK_ORDER[sorted[i].Rank] < RANK_ORDER[sorted[j].Rank]
	})
	return sorted
}

func Deal(deck []Card) map[PlayerPosition][]Card {
	hands := map[PlayerPosition][]Card{
		North: {}, East: {}, South: {}, West: {},
	}
	for i, card := range deck {
		pos := AllPositions[i%4]
		hands[pos] = append(hands[pos], card)
	}
	return hands
}

func IsNS(pos PlayerPosition) bool {
	return pos == North || pos == South
}

func NextPos(pos PlayerPosition) PlayerPosition {
	idx := -1
	for i, p := range AllPositions {
		if p == pos {
			idx = i
			break
		}
	}
	return AllPositions[(idx+1)%4]
}

// --- Trick Logic ---

func CanBeat(card, currentWinner Card, hokmSuit Suit) bool {
	cardIsTrump := card.Suit == hokmSuit
	winnerIsTrump := currentWinner.Suit == hokmSuit
	if cardIsTrump && !winnerIsTrump {
		return true
	}
	if !cardIsTrump && winnerIsTrump {
		return false
	}
	if card.Suit != currentWinner.Suit {
		return false
	}
	return RANK_ORDER[card.Rank] > RANK_ORDER[currentWinner.Rank]
}

func PickWinner(cards map[PlayerPosition]*Card, hokmSuit Suit, leader PlayerPosition) PlayerPosition {
	leaderCard := cards[leader]
	if leaderCard == nil {
		// fallback: shouldn't happen
		for pos, card := range cards {
			if card != nil {
				return pos
			}
		}
		return leader
	}

	winnerPos := leader
	winnerCard := *leaderCard

	for pos, card := range cards {
		if card == nil || pos == leader {
			continue
		}
		if CanBeat(*card, winnerCard, hokmSuit) {
			winnerPos = pos
			winnerCard = *card
		}
	}
	return winnerPos
}

// --- Game Creation ---

func CreateGame(players []*Player, hokmPlayerIdx int, handsToWin int) *GameState {
	deck := ShuffleDeck(CreateDeck())
	hands := Deal(deck[:20])

	for _, p := range players {
		p.Hand = SortHand(hands[p.Position])
		p.TricksWon = 0
	}

	if handsToWin != 3 && handsToWin != 7 {
		handsToWin = 7
	}

	hokmPlayer := players[hokmPlayerIdx].Position
	return &GameState{
		GameID:        RandomID(),
		Phase:         PhaseChoosingHokm,
		Players:       players,
		HokmPlayer:    hokmPlayer,
		Turn:          hokmPlayer,
		CurrentTrick: Trick{
			Cards:  make(map[PlayerPosition]*Card),
			Leader: hokmPlayer,
		},
		RoundNumber:   1,
		RemainingDeck: deck[20:],
		HandsToWin:    handsToWin,
	}
}

// --- Game Actions ---

func (g *GameState) ChooseHokm(suit Suit) {
	g.HokmSuit = &suit

	// Deal the remaining cards from the original deck
	hands := Deal(g.RemainingDeck)
	for _, p := range g.Players {
		p.Hand = SortHand(append(p.Hand, hands[p.Position]...))
	}
	g.RemainingDeck = nil

	g.Phase = PhasePlaying
	g.Turn = g.HokmPlayer
}

func (g *GameState) PlayCard(pos PlayerPosition, card Card) bool {
	if g.Phase != PhasePlaying {
		return false
	}
	if g.Turn != pos {
		return false
	}

	player := g.FindPlayer(pos)
	if player == nil {
		return false
	}

	// Remove card from hand
	idx := -1
	for i, c := range player.Hand {
		if c.Suit == card.Suit && c.Rank == card.Rank {
			idx = i
			break
		}
	}
	if idx == -1 {
		return false
	}
	player.Hand = append(player.Hand[:idx], player.Hand[idx+1:]...)

	// Add to trick
	g.CurrentTrick.Cards[pos] = &card

	// Check if trick complete (4 cards)
	if len(g.CurrentTrick.Cards) == 4 {
		// Don't advance turn - caller will resolve
		return true
	}

	g.Turn = NextPos(pos)
	return true
}

func (g *GameState) IsTrickComplete() bool {
	return len(g.CurrentTrick.Cards) == 4
}

func (g *GameState) ResolveTrick() {
	trickWinner := PickWinner(g.CurrentTrick.Cards, *g.HokmSuit, g.CurrentTrick.Leader)
	winnerIsNS := IsNS(trickWinner)

	if winnerIsNS {
		g.NorthSouthScore++
	} else {
		g.EastWestScore++
	}

	winner := g.FindPlayer(trickWinner)
	if winner != nil {
		winner.TricksWon++
	}

	// Check if round over (first to 7 tricks wins the round)
	if g.NorthSouthScore >= 7 || g.EastWestScore >= 7 {
		nsWinsRound := g.NorthSouthScore >= 7

		// Determine shutout bonus: 7-0 means opponent got zero tricks
		isShutout := (nsWinsRound && g.EastWestScore == 0) || (!nsWinsRound && g.NorthSouthScore == 0)
		points := 1
		if isShutout {
			// Check if winning team is the hakem's team
			hakemPlayer := g.FindPlayer(g.HokmPlayer)
			winningTeamIsHakem := hakemPlayer != nil &&
				((hakemPlayer.Team == "ns" && nsWinsRound) || (hakemPlayer.Team == "ew" && !nsWinsRound))
			if winningTeamIsHakem {
				points = 2
			} else {
				points = 3
			}
		}

		if nsWinsRound {
			g.NsGamesWon += points
		} else {
			g.EwGamesWon += points
		}

		// Check if match over (first to HandsToWin games wins the match)
		if g.NsGamesWon >= g.HandsToWin || g.EwGamesWon >= g.HandsToWin {
			w := "ns"
			if g.EwGamesWon >= g.HandsToWin {
				w = "ew"
			}
			g.MatchWinner = &w
			g.Phase = PhaseFinished
			return
		}

		// Rotate hakem at end of hand: if hakem's team won, stay; otherwise pass to next player
		nextHokmPlayer := g.HokmPlayer
		hakemPlayer := g.FindPlayer(g.HokmPlayer)
		if hakemPlayer != nil {
			hakemTeamWon := (hakemPlayer.Team == "ns" && winnerIsNS) || (hakemPlayer.Team == "ew" && !winnerIsNS)
			if !hakemTeamWon {
				nextHokmPlayer = NextPos(g.HokmPlayer)
			}
		}

		// Set hand winner and next hakem — GameLoop will call StartNewRound after a delay
		winningTeam := "ns"
		if !nsWinsRound {
			winningTeam = "ew"
		}
		g.HandWinner = &winningTeam
		g.NextHokmPlayer = nextHokmPlayer

		// Clear trick so IsTrickComplete returns false
		g.CurrentTrick = Trick{
			Cards:  make(map[PlayerPosition]*Card),
			Leader: g.HokmPlayer,
		}
		return
	}

	// New trick
	g.CurrentTrick = Trick{
		Cards:  make(map[PlayerPosition]*Card),
		Leader: trickWinner,
	}
	g.Turn = trickWinner
}

func (g *GameState) StartNewRound(nextHokmPlayer PlayerPosition) {
	deck := ShuffleDeck(CreateDeck())
	hands := Deal(deck[:20])

	for _, p := range g.Players {
		p.Hand = SortHand(hands[p.Position])
		p.TricksWon = 0
	}

	g.Phase = PhaseChoosingHokm
	g.HokmSuit = nil
	g.HokmPlayer = nextHokmPlayer
	g.Turn = nextHokmPlayer
	g.NorthSouthScore = 0
	g.EastWestScore = 0
	g.RoundNumber++
	g.RemainingDeck = deck[20:]
	g.CurrentTrick = Trick{
		Cards:  make(map[PlayerPosition]*Card),
		Leader: nextHokmPlayer,
	}
	g.HandWinner = nil
}

// --- Helpers ---

func (g *GameState) FindPlayer(pos PlayerPosition) *Player {
	for _, p := range g.Players {
		if p.Position == pos {
			return p
		}
	}
	return nil
}

func (g *GameState) GetPublicState(forPos PlayerPosition) GameStatePayload {
	var players []PublicPlayerInfo
	for _, p := range g.Players {
		info := PublicPlayerInfo{
			ID:        p.ID,
			Name:      p.Name,
			Position:  p.Position,
			IsBot:     p.IsBot,
			TricksWon: p.TricksWon,
			Team:      p.Team,
		}
		if p.Position == forPos {
			info.CardCount = len(p.Hand)
		} else {
			info.CardCount = len(p.Hand)
		}
		players = append(players, info)
	}

	var myHand []Card
	me := g.FindPlayer(forPos)
	if me != nil {
		myHand = me.Hand
	}

	return GameStatePayload{
		GameID:          g.GameID,
		Phase:           g.Phase,
		MyPosition:      forPos,
		MyHand:          myHand,
		Players:         players,
		HokmSuit:        g.HokmSuit,
		HokmPlayer:      g.HokmPlayer,
		CurrentTrick:    g.CurrentTrick,
		NorthSouthScore: g.NorthSouthScore,
		EastWestScore:   g.EastWestScore,
		NsGamesWon:      g.NsGamesWon,
		EwGamesWon:      g.EwGamesWon,
		Turn:            g.Turn,
		RoundNumber:     g.RoundNumber,
		MatchWinner:     g.MatchWinner,
		HandsToWin:      g.HandsToWin,
		HandWinner:      g.HandWinner,
	}
}

func CanPlayCard(state *GameState, pos PlayerPosition, card Card) bool {
	if state.Phase != PhasePlaying {
		return false
	}
	if state.Turn != pos {
		return false
	}
	player := state.FindPlayer(pos)
	if player == nil {
		return false
	}

	hasCard := false
	for _, c := range player.Hand {
		if c.Suit == card.Suit && c.Rank == card.Rank {
			hasCard = true
			break
		}
	}
	if !hasCard {
		return false
	}

	trickCards := state.CurrentTrick.Cards
	if len(trickCards) == 0 {
		return true
	}

	// Find led suit using the leader field (map iteration order is random)
	ledSuit := state.CurrentTrick.Cards[state.CurrentTrick.Leader]
	if ledSuit == nil {
		return true
	}
	ledSuitValue := ledSuit.Suit

	hasLedSuit := false
	for _, c := range player.Hand {
		if c.Suit == ledSuitValue {
			hasLedSuit = true
			break
		}
	}

	if hasLedSuit {
		return card.Suit == ledSuitValue
	}

	return true
}

func RandomID() string {
	const chars = "abcdefghijklmnopqrstuvwxyz0123456789"
	b := make([]byte, 8)
	for i := range b {
		b[i] = chars[rand.Intn(len(chars))]
	}
	return string(b)
}

func RandomRoomCode() string {
	const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
	b := make([]byte, 4)
	for i := range b {
		b[i] = chars[rand.Intn(len(chars))]
	}
	return string(b)
}
