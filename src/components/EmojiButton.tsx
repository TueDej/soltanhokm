import { useState, useCallback, useRef, useEffect } from 'react'

const EMOJIS = ['👍', '😂', '🔥', '💪', '🖕', '💩']

interface EmojiButtonProps {
  onSend: (emoji: string) => void
}

export function EmojiButton({ onSend }: EmojiButtonProps) {
  const [cooldown, setCooldown] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [closing, setClosing] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (leaveTimer.current) clearTimeout(leaveTimer.current)
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
    }
  }, [])

  const handleSend = useCallback((emoji: string) => {
    if (cooldown) return
    onSend(emoji)
    setCooldown(true)
    setExpanded(false)
    setClosing(false)
    timerRef.current = setTimeout(() => {
      setCooldown(false)
      timerRef.current = null
    }, 2500)
  }, [cooldown, onSend])

  const openPanel = useCallback(() => {
    if (closeTimerRef.current) { clearTimeout(closeTimerRef.current); closeTimerRef.current = null }
    setClosing(false)
    setExpanded(true)
  }, [])

  const closePanel = useCallback(() => {
    setClosing(true)
    closeTimerRef.current = setTimeout(() => {
      setExpanded(false)
      setClosing(false)
      closeTimerRef.current = null
    }, 200)
  }, [])

  const handleToggle = useCallback(() => {
    if (expanded) {
      closePanel()
    } else {
      openPanel()
    }
  }, [expanded, openPanel, closePanel])

  const handleEnter = useCallback(() => {
    if (leaveTimer.current) { clearTimeout(leaveTimer.current); leaveTimer.current = null }
    openPanel()
  }, [openPanel])

  const handleLeave = useCallback(() => {
    leaveTimer.current = setTimeout(() => closePanel(), 300)
  }, [closePanel])

  const showPanel = expanded || closing

  return (
    <div
      data-emoji-btn
      style={{
        position: 'fixed',
        bottom: 56,
        left: 12,
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        borderRadius: 14,
        background: 'rgba(17,31,51,0.92)',
        border: '1px solid rgba(197,163,90,0.15)',
        backdropFilter: 'blur(8px)',
        boxShadow: '0 2px 16px rgba(0,0,0,0.3)',
        overflow: 'hidden',
      }}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {/* Emoji list */}
      {showPanel && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          padding: '6px 6px 2px 6px',
          transformOrigin: 'bottom center',
          animation: closing ? 'emojiPanelClose 0.2s ease-in forwards' : 'emojiPanelOpen 0.2s ease-out',
        }}>
          {EMOJIS.map((emoji, i) => (
            <button
              key={emoji}
              onClick={(e) => { e.stopPropagation(); handleSend(emoji) }}
              onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); handleSend(emoji) }}
              disabled={cooldown}
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                border: 'none',
                background: 'transparent',
                cursor: cooldown ? 'not-allowed' : 'pointer',
                fontSize: 18,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: cooldown ? 0.4 : 1,
                transition: 'background 0.15s ease',
                padding: 0,
                animation: closing ? 'none' : `emojiItemIn 0.15s ease-out ${i * 0.03}s both`,
              }}
              onMouseEnter={(e) => {
                if (!cooldown) e.currentTarget.style.background = 'rgba(197,163,90,0.12)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Toggle button — bottom of the unified container */}
      <button
        onClick={handleToggle}
        onTouchEnd={(e) => { e.preventDefault(); handleToggle() }}
        style={{
          width: 38,
          height: 38,
          margin: '0 auto',
          marginBottom: 0,
          borderRadius: '0 0 12px 12px',
          border: 'none',
          borderTop: showPanel ? '1px solid rgba(197,163,90,0.08)' : 'none',
          background: expanded ? 'rgba(197,163,90,0.1)' : 'transparent',
          cursor: 'pointer',
          fontSize: 18,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 0.2s ease',
          padding: 0,
          flexShrink: 0,
        }}
      >
        😊
      </button>
    </div>
  )
}
