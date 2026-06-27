package main

import "encoding/json"

// --- Enums ---

type Suit string

const (
	Hearts   Suit = "hearts"
	Diamonds Suit = "diamonds"
	Clubs    Suit = "clubs"
	Spades   Suit = "spades"
)

type Rank string

const (
	Two   Rank = "2"
	Three Rank = "3"
	Four  Rank = "4"
	Five  Rank = "5"
	Six   Rank = "6"
	Seven Rank = "7"
	Eight Rank = "8"
	Nine  Rank = "9"
	Ten   Rank = "10"
	Jack  Rank = "J"
	Queen Rank = "Q"
	King  Rank = "K"
	Ace   Rank = "A"
)

type PlayerPosition string

const (
	North PlayerPosition = "north"
	East  PlayerPosition = "east"
	South PlayerPosition = "south"
	West  PlayerPosition = "west"
)

var AllPositions = []PlayerPosition{North, East, South, West}

type TrickPhase string

const (
	PhaseChoosingHokm TrickPhase = "ChoosingHokm"
	PhasePlaying      TrickPhase = "Playing"
	PhaseFinished     TrickPhase = "Finished"
)

// --- Card ---

type Card struct {
	Suit Suit `json:"suit"`
	Rank Rank `json:"rank"`
}

// --- Client Messages ---

type ClientMessage struct {
	Type    string          `json:"type"`
	Payload json.RawMessage `json:"payload"`
}

type CreateRoomPayload struct {
	PlayerName  string `json:"playerName"`
	HandsToWin  int    `json:"handsToWin"`
}

type JoinRoomPayload struct {
	PlayerName string `json:"playerName"`
	RoomCode   string `json:"roomCode"`
}

type RejoinRoomPayload struct {
	RoomCode   string `json:"roomCode"`
	PlayerID   string `json:"playerId"`
	PlayerName string `json:"playerName"`
}

type ChooseHokmPayload struct {
	Suit Suit `json:"suit"`
}

type PlayCardPayload struct {
	Card Card `json:"card"`
}

type EmojiPayload struct {
	Emoji string `json:"emoji"`
}

// --- Server Messages ---

type ServerMessage struct {
	Type    string      `json:"type"`
	Payload interface{} `json:"payload"`
}

type RoomCreatedPayload struct {
	RoomCode string `json:"roomCode"`
	PlayerID string `json:"playerId"`
}

type RoomJoinedPayload struct {
	RoomCode string `json:"roomCode"`
	PlayerID string `json:"playerId"`
}

type RejoinSuccessPayload struct {
	RoomCode string `json:"roomCode"`
	PlayerID string `json:"playerId"`
}

type PlayerInfo struct {
	ID       string         `json:"id"`
	Name     string         `json:"name"`
	Position PlayerPosition `json:"position"`
	IsBot    bool           `json:"isBot"`
	Team     string         `json:"team"`
}

type PlayerJoinedPayload struct {
	RoomCode string       `json:"roomCode"`
	Players  []PlayerInfo `json:"players"`
}

type GameStartedPayload struct{}

type PublicPlayerInfo struct {
	ID         string         `json:"id"`
	Name       string         `json:"name"`
	Position   PlayerPosition `json:"position"`
	IsBot      bool           `json:"isBot"`
	CardCount  int            `json:"cardCount"`
	TricksWon  int            `json:"tricksWon"`
	Team       string         `json:"team"`
}

type GameStatePayload struct {
	GameID          string             `json:"gameId"`
	Phase           TrickPhase         `json:"phase"`
	MyPosition      PlayerPosition     `json:"myPosition"`
	MyHand          []Card             `json:"myHand"`
	Players         []PublicPlayerInfo `json:"players"`
	HokmSuit        *Suit              `json:"hokmSuit,omitempty"`
	HokmPlayer      PlayerPosition     `json:"hokmPlayer"`
	CurrentTrick    Trick              `json:"currentTrick"`
	NorthSouthScore int                `json:"northSouthScore"`
	EastWestScore   int                `json:"eastWestScore"`
	NsGamesWon      int                `json:"nsGamesWon"`
	EwGamesWon      int                `json:"ewGamesWon"`
	Turn            PlayerPosition     `json:"turn"`
	RoundNumber     int                `json:"roundNumber"`
	MatchWinner     *string            `json:"matchWinner,omitempty"`
	HandsToWin      int                `json:"handsToWin"`
	HandWinner      *string            `json:"handWinner,omitempty"`
}

type ErrorPayload struct {
	Message string `json:"message"`
}

type EmojiBroadcastPayload struct {
	Position PlayerPosition `json:"position"`
	Emoji    string         `json:"emoji"`
}
