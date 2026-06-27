package main

import (
	"encoding/json"
	"math/rand"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

type RoomStatus string

const (
	RoomWaiting  RoomStatus = "waiting"
	RoomPlaying  RoomStatus = "playing"
	RoomFinished RoomStatus = "finished"
)

type Room struct {
	Code        string
	Status      RoomStatus
	CreatorID   string
	Players     []*HumanPlayer
	Game        *GameState
	HandsToWin  int
	mu          sync.Mutex
	stopCh      chan struct{}
}

type RoomManager struct {
	rooms map[string]*Room
	mu    sync.RWMutex
}

func NewRoomManager() *RoomManager {
	rm := &RoomManager{
		rooms: make(map[string]*Room),
	}
	go rm.cleanup()
	return rm
}

func (rm *RoomManager) CreateRoom(creator *HumanPlayer, handsToWin int) *Room {
	code := rm.generateCode()

	if handsToWin != 3 && handsToWin != 7 {
		handsToWin = 7
	}

	room := &Room{
		Code:       code,
		Status:     RoomWaiting,
		CreatorID:  creator.ID,
		Players:    []*HumanPlayer{creator},
		HandsToWin: handsToWin,
		stopCh:     make(chan struct{}),
	}

	creator.Room = room
	creator.Position = South

	rm.mu.Lock()
	rm.rooms[code] = room
	rm.mu.Unlock()

	return room
}

func (rm *RoomManager) JoinRoom(player *HumanPlayer, code string) (*Room, bool) {
	rm.mu.RLock()
	room, exists := rm.rooms[code]
	rm.mu.RUnlock()

	if !exists || room.Status != RoomWaiting {
		return nil, false
	}

	room.mu.Lock()
	defer room.mu.Unlock()

	if len(room.Players) >= 4 {
		return nil, false
	}

	// Assign position
	usedPositions := make(map[PlayerPosition]bool)
	for _, p := range room.Players {
		usedPositions[p.Position] = true
	}
	for _, pos := range AllPositions {
		if !usedPositions[pos] {
			player.Position = pos
			break
		}
	}

	player.Room = room
	room.Players = append(room.Players, player)
	return room, true
}

func (rm *RoomManager) GetRoom(code string) *Room {
	rm.mu.RLock()
	defer rm.mu.RUnlock()
	return rm.rooms[code]
}

func (rm *RoomManager) generateCode() string {
	for {
		code := RandomRoomCode()
		rm.mu.RLock()
		_, exists := rm.rooms[code]
		rm.mu.RUnlock()
		if !exists {
			return code
		}
	}
}

func (rm *RoomManager) cleanup() {
	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()

	for range ticker.C {
		rm.mu.Lock()
		for code, room := range rm.rooms {
			if room.Status == RoomFinished {
				delete(rm.rooms, code)
			}
		}
		rm.mu.Unlock()
	}
}

// --- Room Methods ---

func (r *Room) BroadcastToPlayers(msg ServerMessage) {
	for _, p := range r.Players {
		p.SendMessage(msg)
	}
}

func (r *Room) BroadcastGameState() {
	for _, p := range r.Players {
		state := r.Game.GetPublicState(p.Position)
		p.SendMessage(ServerMessage{
			Type:    "game_state",
			Payload: state,
		})
	}
}

func (r *Room) StartGame() {
	r.mu.Lock()
	if r.Status != RoomWaiting {
		r.mu.Unlock()
		return
	}
	r.Status = RoomPlaying

	// Randomly assign teams to players without one
	nsCount := 0
	ewCount := 0
	for _, hp := range r.Players {
		if hp.Team == "ns" {
			nsCount++
		} else if hp.Team == "ew" {
			ewCount++
		}
	}
	for _, hp := range r.Players {
		if hp.Team == "" {
			if nsCount < 2 {
				hp.Team = "ns"
				nsCount++
			} else {
				hp.Team = "ew"
				ewCount++
			}
		}
	}

	// Assign positions based on team choice
	nsPositions := []PlayerPosition{North, South}
	ewPositions := []PlayerPosition{East, West}
	nsIdx := 0
	ewIdx := 0
	usedPositions := make(map[PlayerPosition]bool)

	for _, hp := range r.Players {
		if hp.Team == "ew" && ewIdx < len(ewPositions) {
			hp.Position = ewPositions[ewIdx]
			ewIdx++
		} else if hp.Team == "ns" && nsIdx < len(nsPositions) {
			hp.Position = nsPositions[nsIdx]
			nsIdx++
		} else if nsIdx < len(nsPositions) {
			hp.Position = nsPositions[nsIdx]
			nsIdx++
		} else if ewIdx < len(ewPositions) {
			hp.Position = ewPositions[ewIdx]
			ewIdx++
		}
		usedPositions[hp.Position] = true
		hp.Player.Team = hp.Team
	}

	var allPlayers []*Player
	for _, hp := range r.Players {
		allPlayers = append(allPlayers, hp.Player)
	}

	// Fill empty positions with bots (each team must have exactly 2)
	for _, pos := range AllPositions {
		if !usedPositions[pos] {
			team := "ew"
			if pos == North || pos == South {
				team = "ns"
			}
			bot := &Player{
				ID:       "bot_" + string(pos),
				Name:     getRandomBotName(),
				Position: pos,
				Hand:     []Card{},
				IsBot:    true,
				Team:     team,
			}
			allPlayers = append(allPlayers, bot)
		}
	}

	// Pick random hokm player
	hokmIdx := rand.Intn(4)

	r.Game = CreateGame(allPlayers, hokmIdx, r.HandsToWin)
	r.mu.Unlock()

	// Notify game started
	r.BroadcastToPlayers(ServerMessage{
		Type:    "game_started",
		Payload: GameStartedPayload{},
	})

	r.BroadcastGameState()

	// Start game loop
	go r.GameLoop()
}

func (r *Room) GameLoop() {
	defer func() {
		r.mu.Lock()
		r.Status = RoomFinished
		r.mu.Unlock()
	}()

	for {
		r.mu.Lock()
		phase := r.Game.Phase
		turn := r.Game.Turn
		trickComplete := r.Game.IsTrickComplete()
		r.mu.Unlock()

		if phase == PhaseFinished {
			break
		}

		if trickComplete {
			time.Sleep(1500 * time.Millisecond)
			r.mu.Lock()
			r.Game.ResolveTrick()
			handWinner := r.Game.HandWinner
			r.mu.Unlock()
			r.BroadcastGameState()

			if handWinner != nil {
				time.Sleep(3500 * time.Millisecond)
				r.mu.Lock()
				r.Game.StartNewRound(r.Game.NextHokmPlayer)
				r.mu.Unlock()
				r.BroadcastGameState()
			}
			continue
		}

		// Find if current turn is a bot or disconnected player
		r.mu.Lock()
		player := r.Game.FindPlayer(turn)
		isBot := player != nil && player.IsBot
		isDisconnected := false
		if !isBot {
			for _, hp := range r.Players {
				if hp.Position == turn && hp.Disconnected {
					isDisconnected = true
					break
				}
			}
		}
		isChoosingHokm := phase == PhaseChoosingHokm && turn == r.Game.HokmPlayer
		r.mu.Unlock()

		if isBot || isDisconnected {
			time.Sleep(800 * time.Millisecond)

			r.mu.Lock()
			if isChoosingHokm {
				suit := BotChooseHokm(r.Game.FindPlayer(turn).Hand)
				r.Game.ChooseHokm(suit)
			} else {
				card := BotPlayCard(r.Game, turn)
				if card != nil {
					r.Game.PlayCard(turn, *card)
				}
			}
			r.mu.Unlock()

			r.BroadcastGameState()
			continue
		}

		// Human's turn - wait for message (handled by HandleMessage)
		time.Sleep(100 * time.Millisecond)
	}
}

func (r *Room) HandleMessage(sender *HumanPlayer, msg ClientMessage) {
	r.mu.Lock()
	defer r.mu.Unlock()

	switch msg.Type {
	case "choose_hokm":
		var payload ChooseHokmPayload
		if err := json.Unmarshal(msg.Payload, &payload); err != nil {
			return
		}
		if r.Game.Phase != PhaseChoosingHokm || r.Game.Turn != sender.Position {
			return
		}
		r.Game.ChooseHokm(payload.Suit)
		r.BroadcastGameState()

	case "play_card":
		var payload PlayCardPayload
		if err := json.Unmarshal(msg.Payload, &payload); err != nil {
			return
		}
		if r.Game.Phase != PhasePlaying || r.Game.Turn != sender.Position {
			return
		}
		if !CanPlayCard(r.Game, sender.Position, payload.Card) {
			sender.SendMessage(ServerMessage{
				Type:    "error",
				Payload: ErrorPayload{Message: "Invalid move"},
			})
			return
		}
		r.Game.PlayCard(sender.Position, payload.Card)
		r.BroadcastGameState()

	case "start_game":
		if sender.ID == r.CreatorID && r.Status == RoomWaiting {
			go r.StartGame()
		}

	case "select_team":
		var payload struct {
			Team string `json:"team"`
		}
		if err := json.Unmarshal(msg.Payload, &payload); err != nil {
			return
		}
		if payload.Team != "ns" && payload.Team != "ew" {
			return
		}
		// Count players on target team
		count := 0
		for _, p := range r.Players {
			if p.Team == payload.Team {
				count++
			}
		}
		if count >= 2 {
			sender.SendMessage(ServerMessage{
				Type:    "error",
				Payload: ErrorPayload{Message: "Team is full"},
			})
			return
		}
		sender.Team = payload.Team
		r.BroadcastToPlayers(ServerMessage{
			Type:    "player_joined",
			Payload: buildPlayerJoinedPayload(r),
		})

	case "emoji":
		var payload EmojiPayload
		if err := json.Unmarshal(msg.Payload, &payload); err != nil {
			return
		}
		if len(payload.Emoji) > 4 || payload.Emoji == "" {
			return
		}
		r.BroadcastToPlayers(ServerMessage{
			Type: "emoji",
			Payload: EmojiBroadcastPayload{
				Position: sender.Position,
				Emoji:    payload.Emoji,
			},
		})
	}
}

func (r *Room) RemovePlayer(id string) {
	r.mu.Lock()
	defer r.mu.Unlock()

	for i, p := range r.Players {
		if p.ID == id {
			r.Players = append(r.Players[:i], r.Players[i+1:]...)
			break
		}
	}

	if len(r.Players) == 0 && r.Status != RoomPlaying {
		r.Status = RoomFinished
	}
}

func (r *Room) OnDisconnect(id string) {
	r.mu.Lock()
	defer r.mu.Unlock()

	// In lobby, just remove the player
	if r.Status != RoomPlaying {
		for i, p := range r.Players {
			if p.ID == id {
				r.Players = append(r.Players[:i], r.Players[i+1:]...)
				break
			}
		}
		if len(r.Players) == 0 {
			r.Status = RoomFinished
		}
		return
	}

	// During active game, mark as disconnected but keep slot
	for _, p := range r.Players {
		if p.ID == id {
			p.Disconnected = true
			p.DisconnectedAt = time.Now().Unix()
			p.Conn = nil
			break
		}
	}
}

func (r *Room) RejoinPlayer(playerID string, conn *websocket.Conn) (*HumanPlayer, bool) {
	r.mu.Lock()
	defer r.mu.Unlock()

	for _, p := range r.Players {
		if p.ID == playerID {
			p.mu.Lock()
			p.Conn = conn
			p.Disconnected = false
			p.DisconnectedAt = 0
			p.mu.Unlock()
			return p, true
		}
	}
	return nil, false
}

// Bot names
var botNames = []string{
	"Alex", "Sam", "Jordan", "Casey", "Morgan", "Taylor",
	"Riley", "Quinn", "Drew", "Blake", "Avery", "Cameron",
	"Dakota", "Emery", "Finley", "Harper", "Hayden", "Jamie",
	"Kendall", "Logan",
}

func getRandomBotName() string {
	return botNames[rand.Intn(len(botNames))]
}
