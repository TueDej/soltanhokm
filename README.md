# Soltan Hokm

A multiplayer Hokm (Persian trick-taking card game) built with React + TypeScript frontend and Go backend.

## Play

- **Local mode** — Play vs 3 AI bots, no server needed
- **Online mode** — Create/join rooms, play with friends via WebSocket

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Backend**: Go, Gorilla WebSocket
- **Deployment**: Caddy reverse proxy, systemd

## Getting Started

### Prerequisites

- Node.js 18+
- Go 1.21+ (for online mode)

### Development

```bash
# Frontend
npm install
npm run dev

# Server (separate terminal)
cd server
go run .
```

Frontend runs on `http://localhost:5173`, server on `http://localhost:5566`.

### Build

```bash
npm run build
cd server && go build -o soltanhokm-server .
```

## Project Structure

```
soltanhokm/
├── src/
│   ├── components/    # React UI (GameBoard, Card, Hand, Table, MainMenu)
│   ├── engine/        # Local game logic (gameEngine, bot AI)
│   ├── hooks/         # React hooks (useLocalGame, useOnlineGame)
│   ├── services/      # WebSocket client
│   ├── types/         # TypeScript types (card, game, socket)
│   └── index.css      # Global styles
├── server/
│   ├── main.go        # WebSocket handler, HTTP server
│   ├── game.go        # Game state, rules, card logic
│   ├── room.go        # Room management, game loop
│   ├── player.go      # Player types, read/write pumps
│   ├── bot.go         # Bot AI
│   └── messages.go    # Message types and payloads
├── Caddyfile          # Reverse proxy config
└── soltanhokm.service # systemd service file
```

## Features

- 4-player Hokm with trump selection
- Follow-suit rules enforcement
- Bot AI with strategic play
- Online multiplayer with room system
- Reconnection support with session persistence
- Mobile-friendly card fan layout
- Responsive design

## Deploy

See [DEPLOY.md](DEPLOY.md) for VPS deployment instructions.
