import type { OutgoingMessage, ServerMessage } from '../types/socket'

type MessageHandler = (msg: ServerMessage) => void

export function createSocket(url: string): {
  send: (msg: OutgoingMessage) => void
  onMessage: (handler: MessageHandler) => void
  onOpen: (handler: () => void) => void
  onClose: (handler: () => void) => void
  close: () => void
} {
  let ws: WebSocket | null = null
  let msgHandlers: MessageHandler[] = []
  let openHandlers: (() => void)[] = []
  let closeHandlers: (() => void)[] = []
  function connect() {
    ws = new WebSocket(url)

    ws.onopen = () => {
      console.log('connected')
      openHandlers.forEach((h) => h())
    }
    ws.onclose = () => {
      console.log('disconnected')
      closeHandlers.forEach((h) => h())
    }
    ws.onerror = (err) => console.error('ws error', err)

    ws.onmessage = (event) => {
      try {
        const msg: ServerMessage = JSON.parse(event.data)
        msgHandlers.forEach((h) => h(msg))
      } catch {
        console.error('invalid message', event.data)
      }
    }
  }

  connect()

  return {
    send(msg: OutgoingMessage) {
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(msg))
      } else {
        console.warn('WebSocket not open, message dropped:', msg.type)
      }
    },
    onMessage(handler: MessageHandler) {
      msgHandlers.push(handler)
    },
    onOpen(handler: () => void) {
      if (ws?.readyState === WebSocket.OPEN) {
        handler()
      } else {
        openHandlers.push(handler)
      }
    },
    onClose(handler: () => void) {
      closeHandlers.push(handler)
    },
    close() {
      ws?.close()
      ws = null
      msgHandlers = []
      openHandlers = []
      closeHandlers = []
    },
  }
}
