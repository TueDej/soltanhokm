import { useEffect, useRef, useCallback } from 'react'
import { createSocket } from '../services/socket'
import type { OutgoingMessage, ServerMessage } from '../types/socket'

export function useSocket(url: string) {
  const socketRef = useRef<ReturnType<typeof createSocket> | null>(null)
  const handlersRef = useRef<((msg: ServerMessage) => void)[]>([])

  useEffect(() => {
    const socket = createSocket(url)
    socketRef.current = socket

    socket.onMessage((msg) => {
      handlersRef.current.forEach((h) => h(msg))
    })

    return () => socket.close()
  }, [url])

  const send = useCallback((msg: OutgoingMessage) => {
    socketRef.current?.send(msg)
  }, [])

  const onMessage = useCallback((handler: (msg: ServerMessage) => void) => {
    handlersRef.current.push(handler)
  }, [])

  return { send, onMessage }
}