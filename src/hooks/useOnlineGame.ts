import { useState, useEffect, useCallback, useRef } from 'react'
import type { Card, Suit } from '../types/card'
import { MessageType } from '../types/socket'
import type {
  OnlineGameState,
  PlayerInfo,
  ServerMessage,
} from '../types/socket'
import { createSocket } from '../services/socket'
import type { OutgoingMessage } from '../types/socket'

const WS_URL = import.meta.env.VITE_WS_URL ?? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`

type RoomPhase = 'idle' | 'lobby' | 'playing' | 'finished'

type PendingMessage = OutgoingMessage

export function useOnlineGame() {
  const [roomPhase, setRoomPhase] = useState<RoomPhase>('idle')
  const [roomCode, setRoomCode] = useState<string | null>(null)
  const [playerId, setPlayerId] = useState<string | null>(null)
  const [players, setPlayers] = useState<PlayerInfo[]>([])
  const [game, setGame] = useState<OnlineGameState | null>(null)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const socketRef = useRef<ReturnType<typeof createSocket> | null>(null)
  const pendingRef = useRef<PendingMessage[]>([])
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const destroyedRef = useRef(false)

  useEffect(() => {
    return () => {
      destroyedRef.current = true
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
      socketRef.current?.close()
    }
  }, [])

  const flushPending = useCallback(() => {
    const sock = socketRef.current
    if (!sock) return
    while (pendingRef.current.length > 0) {
      const msg = pendingRef.current.shift()!
      sock.send(msg)
    }
  }, [])

  const connect = useCallback(() => {
    if (socketRef.current) return
    destroyedRef.current = false

    const socket = createSocket(WS_URL)
    socketRef.current = socket

    socket.onOpen(() => {
      setConnected(true)
      setError(null)
      flushPending()
    })

    socket.onClose(() => {
      socketRef.current = null
      setConnected(false)

      if (!destroyedRef.current) {
        reconnectTimer.current = setTimeout(() => {
          if (!destroyedRef.current) {
            reconnectTimer.current = null
            connect()
          }
        }, 2000)
      }
    })

    socket.onMessage((msg: ServerMessage) => {
      switch (msg.type) {
        case MessageType.RoomCreated: {
          const payload = msg.payload as { roomCode: string; playerId: string }
          setRoomCode(payload.roomCode)
          setPlayerId(payload.playerId)
          setRoomPhase('lobby')
          break
        }
        case MessageType.RoomJoined: {
          const payload = msg.payload as { roomCode: string; playerId: string }
          setRoomCode(payload.roomCode)
          setPlayerId(payload.playerId)
          setRoomPhase('lobby')
          break
        }
        case MessageType.PlayerJoined: {
          const payload = msg.payload as { players: PlayerInfo[] }
          setPlayers(payload.players)
          break
        }
        case MessageType.GameStarted: {
          setRoomPhase('playing')
          break
        }
        case MessageType.GameState: {
          const state = msg.payload as OnlineGameState
          setGame(state)
          if (state.phase === 'Finished') {
            setRoomPhase('finished')
          }
          break
        }
        case MessageType.Error: {
          const payload = msg.payload as { message: string }
          setError(payload.message)
          console.error('Server error:', payload.message)
          break
        }
      }
    })
  }, [flushPending])

  const sendOrQueue = useCallback((msg: PendingMessage) => {
    if (socketRef.current?.send) {
      socketRef.current.send(msg)
    } else {
      pendingRef.current.push(msg)
      connect()
    }
  }, [connect])

  const createRoom = useCallback((playerName: string) => {
    sendOrQueue({
      type: MessageType.CreateRoom,
      payload: { playerName },
    })
  }, [sendOrQueue])

  const joinRoom = useCallback((playerName: string, code: string) => {
    sendOrQueue({
      type: MessageType.JoinRoom,
      payload: { playerName, roomCode: code },
    })
  }, [sendOrQueue])

  const startGame = useCallback(() => {
    sendOrQueue({
      type: MessageType.StartGame,
      payload: {},
    })
  }, [sendOrQueue])

  const chooseHokm = useCallback((suit: Suit) => {
    sendOrQueue({
      type: MessageType.ChooseHokm,
      payload: { suit },
    })
  }, [sendOrQueue])

  const playCard = useCallback((card: Card) => {
    sendOrQueue({
      type: MessageType.PlayCard,
      payload: { card },
    })
  }, [sendOrQueue])

  const reset = useCallback(() => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current)
      reconnectTimer.current = null
    }
    destroyedRef.current = true
    socketRef.current?.close()
    socketRef.current = null
    pendingRef.current = []
    setRoomPhase('idle')
    setRoomCode(null)
    setPlayerId(null)
    setPlayers([])
    setGame(null)
    setConnected(false)
    setError(null)
  }, [])

  const selectTeam = useCallback((team: 'ns' | 'ew') => {
    sendOrQueue({
      type: MessageType.SelectTeam,
      payload: { team },
    })
  }, [sendOrQueue])

  return {
    roomPhase,
    roomCode,
    playerId,
    players,
    game,
    connected,
    error,
    createRoom,
    joinRoom,
    startGame,
    chooseHokm,
    playCard,
    selectTeam,
    reset,
  }
}
