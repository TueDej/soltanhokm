package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"sync/atomic"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins in dev
	},
}

var playerCounter uint64

func main() {
	rm := NewRoomManager()

	distDir := os.Getenv("DIST_DIR")
	if distDir == "" {
		distDir = "./dist"
	}

	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		handleWebSocket(w, r, rm)
	})

	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"ok"}`))
	})

	fs := http.FileServer(http.Dir(distDir))
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		path := filepath.Join(distDir, r.URL.Path)
		if _, err := os.Stat(path); os.IsNotExist(err) && !strings.HasPrefix(r.URL.Path, "/assets/") {
			http.ServeFile(w, r, filepath.Join(distDir, "index.html"))
			return
		}
		fs.ServeHTTP(w, r)
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "5566"
	}

	log.Printf("Soltan Hokm server starting on :%s (dist: %s)", port, distDir)
	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.Fatal(err)
	}
}

func handleWebSocket(w http.ResponseWriter, r *http.Request, rm *RoomManager) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade error: %v", err)
		return
	}

	// Wait for first message (create_room or join_room)
	_, raw, err := conn.ReadMessage()
	if err != nil {
		conn.Close()
		return
	}

	var msg ClientMessage
	if err := json.Unmarshal(raw, &msg); err != nil {
		conn.WriteJSON(ServerMessage{
			Type:    "error",
			Payload: ErrorPayload{Message: "Invalid message format"},
		})
		conn.Close()
		return
	}

	playerID := atomic.AddUint64(&playerCounter, 1)

	switch msg.Type {
	case "create_room":
		var payload CreateRoomPayload
		if err := json.Unmarshal(msg.Payload, &payload); err != nil {
			conn.Close()
			return
		}

		player := NewHumanPlayer(
			fmt.Sprintf("p_%d", playerID),
			payload.PlayerName,
			conn,
		)

		room := rm.CreateRoom(player)

		player.SendMessage(ServerMessage{
			Type:    "room_created",
			Payload: RoomCreatedPayload{RoomCode: room.Code, PlayerID: player.ID},
		})

		// Send initial player list
		room.BroadcastToPlayers(ServerMessage{
			Type:    "player_joined",
			Payload: buildPlayerJoinedPayload(room),
		})

		player.ReadPump()

	case "join_room":
		var payload JoinRoomPayload
		if err := json.Unmarshal(msg.Payload, &payload); err != nil {
			conn.Close()
			return
		}

		player := NewHumanPlayer(
			fmt.Sprintf("p_%d", playerID),
			payload.PlayerName,
			conn,
		)

		room, ok := rm.JoinRoom(player, payload.RoomCode)
		if !ok {
			player.SendMessage(ServerMessage{
				Type:    "error",
				Payload: ErrorPayload{Message: "Room not found or full"},
			})
			conn.Close()
			return
		}

		player.SendMessage(ServerMessage{
			Type:    "room_joined",
			Payload: RoomJoinedPayload{RoomCode: room.Code, PlayerID: player.ID},
		})

		room.BroadcastToPlayers(ServerMessage{
			Type:    "player_joined",
			Payload: buildPlayerJoinedPayload(room),
		})

		player.ReadPump()

	default:
		conn.WriteJSON(ServerMessage{
			Type:    "error",
			Payload: ErrorPayload{Message: "First message must be create_room or join_room"},
		})
		conn.Close()
	}
}

func buildPlayerJoinedPayload(room *Room) PlayerJoinedPayload {
	var players []PlayerInfo
	for _, p := range room.Players {
		players = append(players, PlayerInfo{
			ID:       p.ID,
			Name:     p.Name,
			Position: p.Position,
			IsBot:    false,
			Team:     p.Team,
		})
	}
	return PlayerJoinedPayload{
		RoomCode: room.Code,
		Players:  players,
	}
}
