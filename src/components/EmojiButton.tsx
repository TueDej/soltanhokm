import { useState, useCallback, useRef } from 'react'

const EMOJIS = ['👍', '😂', '🔥', '💪', '😡', '🎉']

interface EmojiButtonProps {
  onSend: (emoji: string) => void
  disabled?: boolean
}

export function EmojiButton({ onSend, disabled }: EmojiButtonProps) {
  const [cooldown, setCooldown] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleSend = useCallback((emoji: string) => {
    if (cooldown || disabled) return
    onSend(emoji)
    setCooldown(true)
    setExpanded(false)
    timerRef.current = setTimeout(() => {
      setCooldown(false)
      timerRef.current = null
    }, 2000)
  }, [cooldown, disabled, onSend])

  const handleEnter = useCallback(() => {
    if (leaveTimer.current) { clearTimeout(leaveTimer.current); leaveTimer.current = null }
    setExpanded(true)
  }, [])

  const handleLeave = useCallback(() => {
    leaveTimer.current = setTimeout(() => setExpanded(false), 300)
  }, [])

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        left: 12,
        zIndex: 50,
      }}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {/* Expanded emoji list — positioned above the button */}
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
              onClick={() => handleSend(emoji)}
              disabled={cooldown || disabled}
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                border: 'none',
                background: 'transparent',
                cursor: cooldown || disabled ? 'not-allowed' : 'pointer',
                fontSize: 18,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: cooldown || disabled ? 0.4 : 1,
                transition: 'background 0.15s ease',
                padding: 0,
                animation: `emojiItemIn 0.15s ease-out ${i * 0.03}s both`,
              }}
              onMouseEnter={(e) => {
                if (!cooldown && !disabled) e.currentTarget.style.background = 'rgba(197,163,90,0.12)'
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
        style={{
          width: 38,
          height: 38,
          borderRadius: '50%',
          border: '2px solid rgba(197,163,90,0.25)',
          background: expanded ? 'rgba(197,163,90,0.12)' : 'rgba(17,31,51,0.9)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          fontSize: 18,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.4 : 1,
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
