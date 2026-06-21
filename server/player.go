package main

import (
	"encoding/json"
	"log"
	"sync"

	"github.com/gorilla/websocket"
)

type Player struct {
	ID        string
	Name      string
	Position  PlayerPosition
	Hand      []Card
	TricksWon int
	IsBot     bool
	Team      string // "ns" or "ew"
}

type HumanPlayer struct {
	*Player
	Conn           *websocket.Conn
	Room           *Room
	Send           chan []byte
	mu             sync.Mutex
	Disconnected   bool
	DisconnectedAt int64
}

func NewHumanPlayer(id, name string, conn *websocket.Conn) *HumanPlayer {
	player := &Player{
		ID:       id,
		Name:     name,
		Position: South,
		Hand:     []Card{},
		IsBot:    false,
	}
	return &HumanPlayer{
		Player: player,
		Conn:   conn,
		Send:   make(chan []byte, 256),
	}
}

func (hp *HumanPlayer) SendMessage(msg ServerMessage) {
	data, err := json.Marshal(msg)
	if err != nil {
		log.Printf("Error marshaling message: %v", err)
		return
	}

	hp.mu.Lock()
	defer hp.mu.Unlock()

	if hp.Conn != nil && hp.Conn.WriteMessage(websocket.TextMessage, data) != nil {
		log.Printf("Error sending message to %s: %v", hp.Name, err)
	}
}

func (hp *HumanPlayer) ReadPump() {
	defer func() {
		if hp.Room != nil {
			hp.Room.OnDisconnect(hp.ID)
		}
		hp.Conn.Close()
	}()

	for {
		_, raw, err := hp.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseNormalClosure) {
				log.Printf("Read error: %v", err)
			}
			break
		}

		var msg ClientMessage
		if err := json.Unmarshal(raw, &msg); err != nil {
			log.Printf("Invalid message format: %v", err)
			continue
		}

		if hp.Room != nil {
			hp.Room.HandleMessage(hp, msg)
		}
	}
}
