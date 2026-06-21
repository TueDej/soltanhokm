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
const STORAGE_KEY = 'soltanhokm_session'
const MAX_RECONNECT_DELAY = 30000
const INITIAL_RECONNECT_DELAY = 1000

type RoomPhase = 'idle' | 'lobby' | 'playing' | 'finished'

interface SavedSession {
  roomCode: string
  playerId: string
  playerName: string
  roomPhase: RoomPhase
}

function saveSession(session: SavedSession) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  } catch {}
}

function loadSession(): SavedSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function clearSession() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {}
}

export function useOnlineGame() {
  const [roomPhase, setRoomPhase] = useState<RoomPhase>('idle')
  const [roomCode, setRoomCode] = useState<string | null>(null)
  const [playerId, setPlayerId] = useState<string | null>(null)
  const [playerName, setPlayerName] = useState<string>('')
  const [players, setPlayers] = useState<PlayerInfo[]>([])
  const [game, setGame] = useState<OnlineGameState | null>(null)
  const [connected, setConnected] = useState(false)
  const [reconnecting, setReconnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const socketRef = useRef<ReturnType<typeof createSocket> | null>(null)
  const pendingRef = useRef<OutgoingMessage[]>([])
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const destroyedRef = useRef(false)
  const reconnectDelayRef = useRef(INITIAL_RECONNECT_DELAY)
  const savedSessionRef = useRef<SavedSession | null>(null)
  const manualCloseRef = useRef(false)

  // Expose saved session for MainMenu to read, but don't auto-reconnect
  const getSavedSession = useCallback(() => loadSession(), [])

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
    manualCloseRef.current = false

    const socket = createSocket(WS_URL)
    socketRef.current = socket

    socket.onOpen(() => {
      setConnected(true)
      setError(null)
      reconnectDelayRef.current = INITIAL_RECONNECT_DELAY

      // If we have a saved session, try to rejoin
      const saved = savedSessionRef.current
      if (saved) {
        setReconnecting(true)
        socket.send({
          type: MessageType.RejoinRoom,
          payload: {
            roomCode: saved.roomCode,
            playerId: saved.playerId,
            playerName: saved.playerName,
          },
        })
      } else {
        flushPending()
      }
    })

    socket.onClose(() => {
      socketRef.current = null
      setConnected(false)

      if (manualCloseRef.current || destroyedRef.current) return

      setReconnecting(true)

      // Exponential backoff
      const delay = reconnectDelayRef.current
      reconnectDelayRef.current = Math.min(delay * 2, MAX_RECONNECT_DELAY)

      reconnectTimer.current = setTimeout(() => {
        if (!destroyedRef.current) {
          reconnectTimer.current = null
          connect()
        }
      }, delay)
    })

    socket.onMessage((msg: ServerMessage) => {
      switch (msg.type) {
        case MessageType.RoomCreated: {
          const payload = msg.payload as { roomCode: string; playerId: string }
          setRoomCode(payload.roomCode)
          setPlayerId(payload.playerId)
          setRoomPhase('lobby')
          savedSessionRef.current = { roomCode: payload.roomCode, playerId: payload.playerId, playerName, roomPhase: 'lobby' }
          saveSession(savedSessionRef.current)
          break
        }
        case MessageType.RoomJoined: {
          const payload = msg.payload as { roomCode: string; playerId: string }
          setRoomCode(payload.roomCode)
          setPlayerId(payload.playerId)
          setRoomPhase('lobby')
          savedSessionRef.current = { roomCode: payload.roomCode, playerId: payload.playerId, playerName, roomPhase: 'lobby' }
          saveSession(savedSessionRef.current)
          break
        }
        case MessageType.RejoinSuccess: {
          const payload = msg.payload as { roomCode: string; playerId: string }
          setRoomCode(payload.roomCode)
          setPlayerId(payload.playerId)
          setReconnecting(false)
          // Restore roomPhase from saved session
          if (savedSessionRef.current) {
            setRoomPhase(savedSessionRef.current.roomPhase)
          }
          break
        }
        case MessageType.PlayerJoined: {
          const payload = msg.payload as { players: PlayerInfo[] }
          setPlayers(payload.players)
          break
        }
        case MessageType.GameStarted: {
          setRoomPhase('playing')
          if (savedSessionRef.current) {
            savedSessionRef.current.roomPhase = 'playing'
            saveSession(savedSessionRef.current)
          }
          break
        }
        case MessageType.GameState: {
          const state = msg.payload as OnlineGameState
          setGame(state)
          setReconnecting(false)
          if (state.phase === 'Finished') {
            setRoomPhase('finished')
            clearSession()
            savedSessionRef.current = null
          }
          break
        }
        case MessageType.Error: {
          const payload = msg.payload as { message: string }
          setError(payload.message)
          console.error('Server error:', payload.message)
          // If rejoin failed, clear saved session
          if (payload.message.includes('not found')) {
            clearSession()
            savedSessionRef.current = null
            setReconnecting(false)
            setRoomPhase('idle')
            setRoomCode(null)
            setPlayerId(null)
          }
          break
        }
      }
    })
  }, [flushPending, playerName])

  const reconnectToSavedSession = useCallback((name: string) => {
    const saved = loadSession()
    if (!saved) return
    savedSessionRef.current = saved
    setRoomCode(saved.roomCode)
    setPlayerId(saved.playerId)
    setPlayerName(name || saved.playerName)
    setRoomPhase(saved.roomPhase)
    connect()
  }, [connect])

  const sendOrQueue = useCallback((msg: OutgoingMessage) => {
    if (socketRef.current?.send) {
      socketRef.current.send(msg)
    } else {
      pendingRef.current.push(msg)
      connect()
    }
  }, [connect])

  const createRoom = useCallback((name: string) => {
    setPlayerName(name)
    clearSession()
    savedSessionRef.current = null
    sendOrQueue({
      type: MessageType.CreateRoom,
      payload: { playerName: name },
    })
  }, [sendOrQueue])

  const joinRoom = useCallback((name: string, code: string) => {
    setPlayerName(name)
    sendOrQueue({
      type: MessageType.JoinRoom,
      payload: { playerName: name, roomCode: code },
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
    manualCloseRef.current = true
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current)
      reconnectTimer.current = null
    }
    destroyedRef.current = true
    socketRef.current?.close()
    socketRef.current = null
    pendingRef.current = []
    savedSessionRef.current = null
    clearSession()
    setRoomPhase('idle')
    setRoomCode(null)
    setPlayerId(null)
    setPlayerName('')
    setPlayers([])
    setGame(null)
    setConnected(false)
    setReconnecting(false)
    setError(null)
    reconnectDelayRef.current = INITIAL_RECONNECT_DELAY
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
    reconnecting,
    error,
    createRoom,
    joinRoom,
    startGame,
    chooseHokm,
    playCard,
    selectTeam,
    reset,
    getSavedSession,
    reconnectToSavedSession,
  }
}
