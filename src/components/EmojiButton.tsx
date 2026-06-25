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
  const isTouchRef = useRef(false)

  useEffect(() => {
    const mq = window.matchMedia('(hover: none) and (pointer: coarse)')
    isTouchRef.current = mq.matches
    const handler = (e: MediaQueryListEvent) => { isTouchRef.current = e.matches }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (leaveTimer.current) clearTimeout(leaveTimer.current)
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (!expanded) return
    const handleClick = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('[data-emoji-btn]')) {
        closePanel()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [expanded])

  const handleSend = useCallback((emoji: string) => {
    if (cooldown) return
    onSend(emoji)
    setCooldown(true)
    if (isTouchRef.current) {
      setExpanded(false)
      setClosing(false)
    }
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
    if (expanded) closePanel()
    else openPanel()
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
        position: 'absolute',
        top: 0,
        left: 12,
        transform: 'translateY(-50%)',
        zIndex: 50,
        width: 40,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        overflow: 'hidden',
        borderRadius: 14,
        background: 'rgba(12,22,36,0.94)',
        border: '1px solid rgba(197,163,90,0.12)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(197,163,90,0.06)',
        animation: closing ? 'emojiContainerClose 0.2s ease-in forwards' : (expanded ? 'emojiContainerOpen 0.2s ease-out forwards' : 'none'),
        transformOrigin: 'center center',
      }}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {/* Emoji list */}
      {showPanel && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          padding: '8px 4px 4px 4px',
          width: '100%',
        }}>
          {EMOJIS.map((emoji, i) => (
            <button
              key={emoji}
              onClick={(e) => { e.stopPropagation(); handleSend(emoji) }}
              onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); handleSend(emoji) }}
              disabled={cooldown}
              style={{
                width: '100%',
                height: 36,
                borderRadius: 10,
                border: 'none',
                background: 'transparent',
                cursor: cooldown ? 'not-allowed' : 'pointer',
                fontSize: 18,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: cooldown ? 0.35 : 1,
                transition: 'background 0.12s ease, transform 0.12s ease',
                padding: 0,
                animation: closing ? 'none' : `emojiItemIn 0.18s ease-out ${0.05 + i * 0.03}s both`,
              }}
              onMouseEnter={(e) => {
                if (!cooldown) {
                  e.currentTarget.style.background = 'rgba(197,163,90,0.1)'
                  e.currentTarget.style.transform = 'scale(1.1)'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Toggle button — only when collapsed */}
      {!showPanel && (
        <button
          onClick={handleToggle}
          onTouchEnd={(e) => { e.preventDefault(); handleToggle() }}
          style={{
            width: '100%',
            height: 40,
            borderRadius: 14,
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            fontSize: 18,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            flexShrink: 0,
          }}
        >
          <span className="suit-symbol" style={{ fontFamily: "'Noto Color Emoji', sans-serif" }}>🔪</span>
        </button>
      )}
    </div>
  )
}
