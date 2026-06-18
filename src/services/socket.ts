import type { OutgoingMessage, ServerMessage } from '../types/socket'

type MessageHandler = (msg: ServerMessage) => void

export function createSocket(url: string): {
  send: (msg: OutgoingMessage) => void
  onMessage: (handler: MessageHandler) => void
  close: () => void
} {
  let ws: WebSocket | null = null
  let handlers: MessageHandler[] = []

  function connect() {
    ws = new WebSocket(url)

    ws.onopen = () => console.log('connected')
    ws.onclose = () => console.log('disconnected')
    ws.onerror = (err) => console.error('ws error', err)

    ws.onmessage = (event) => {
      try {
        const msg: ServerMessage = JSON.parse(event.data)
        handlers.forEach((h) => h(msg))
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
      }
    },
    onMessage(handler: MessageHandler) {
      handlers.push(handler)
    },
    close() {
      ws?.close()
      handlers = []
    },
  }
}