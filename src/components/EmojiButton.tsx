import { useState, useCallback, useRef } from 'react'

const EMOJIS = ['👍', '😂', '🔥', '💪', '😡', '🎉']

interface EmojiButtonProps {
  onSend: (emoji: string) => void
}

export function EmojiButton({ onSend }: EmojiButtonProps) {
  const [cooldown, setCooldown] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleSend = useCallback((emoji: string) => {
    if (cooldown) return
    onSend(emoji)
    setCooldown(true)
    setExpanded(false)
    timerRef.current = setTimeout(() => {
      setCooldown(false)
      timerRef.current = null
    }, 2000)
  }, [cooldown, onSend])

  const handleToggle = useCallback(() => {
    setExpanded((prev) => !prev)
  }, [])

  const handleEnter = useCallback(() => {
    if (leaveTimer.current) { clearTimeout(leaveTimer.current); leaveTimer.current = null }
    setExpanded(true)
  }, [])

  const handleLeave = useCallback(() => {
    leaveTimer.current = setTimeout(() => setExpanded(false), 300)
  }, [])

  const handleTouchOutside = useCallback((e: React.TouchEvent) => {
    const target = e.target as HTMLElement
    if (!target.closest('[data-emoji-btn]')) {
      setExpanded(false)
    }
  }, [])

  return (
    <div
      data-emoji-btn
      style={{
        position: 'fixed',
        bottom: 20,
        left: 12,
        zIndex: 50,
      }}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onTouchStart={handleTouchOutside}
    >
      {/* Expanded emoji list */}
      {expanded && (
        <div style={{
          position: 'absolute',
          bottom: 46,
          left: 0,
          display: 'flex',
          flexDirection: 'column-reverse',
          gap: 4,
          padding: 4,
          borderRadius: 12,
          background: 'rgba(17,31,51,0.92)',
          border: '1px solid rgba(197,163,90,0.15)',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          transformOrigin: 'bottom left',
          animation: 'emojiPanelOpen 0.2s ease-out',
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
                animation: `emojiItemIn 0.15s ease-out ${i * 0.03}s both`,
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

      {/* Main toggle button */}
      <button
        onClick={handleToggle}
        onTouchEnd={(e) => { e.preventDefault(); handleToggle() }}
        style={{
          width: 38,
          height: 38,
          borderRadius: '50%',
          border: '2px solid rgba(197,163,90,0.25)',
          background: expanded ? 'rgba(197,163,90,0.12)' : 'rgba(17,31,51,0.9)',
          cursor: 'pointer',
          fontSize: 18,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 0.2s ease, border-color 0.2s ease',
          padding: 0,
          backdropFilter: 'blur(8px)',
        }}
      >
        😊
      </button>
    </div>
  )
}
