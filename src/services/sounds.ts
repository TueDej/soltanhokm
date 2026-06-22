let audioCtx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext()
  }
  return audioCtx
}

function resumeCtx() {
  const ctx = getCtx()
  if (ctx.state === 'suspended') ctx.resume()
}

export function playCardSound() {
  resumeCtx()
  const ctx = getCtx()
  const t = ctx.currentTime

  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(800, t)
  osc.frequency.exponentialRampToValueAtTime(400, t + 0.08)
  gain.gain.setValueAtTime(0.15, t)
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1)
  osc.connect(gain).connect(ctx.destination)
  osc.start(t)
  osc.stop(t + 0.1)
}

export function playTrumpSound() {
  resumeCtx()
  const ctx = getCtx()
  const t = ctx.currentTime

  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sawtooth'
  osc.frequency.setValueAtTime(220, t)
  osc.frequency.exponentialRampToValueAtTime(110, t + 0.15)
  gain.gain.setValueAtTime(0.12, t)
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2)
  osc.connect(gain).connect(ctx.destination)
  osc.start(t)
  osc.stop(t + 0.2)
}

export function playTrickWinSound() {
  resumeCtx()
  const ctx = getCtx()
  const t = ctx.currentTime

  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(523, t)
  osc.frequency.setValueAtTime(659, t + 0.1)
  osc.frequency.setValueAtTime(784, t + 0.2)
  gain.gain.setValueAtTime(0.12, t)
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35)
  osc.connect(gain).connect(ctx.destination)
  osc.start(t)
  osc.stop(t + 0.35)
}

export function playRoundEndSound() {
  resumeCtx()
  const ctx = getCtx()
  const t = ctx.currentTime

  const notes = [523, 659, 784, 1047]
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, t + i * 0.12)
    gain.gain.setValueAtTime(0, t + i * 0.12)
    gain.gain.linearRampToValueAtTime(0.1, t + i * 0.12 + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.12 + 0.3)
    osc.connect(gain).connect(ctx.destination)
    osc.start(t + i * 0.12)
    osc.stop(t + i * 0.12 + 0.3)
  })
}

export function playHokmRevealSound() {
  resumeCtx()
  const ctx = getCtx()
  const t = ctx.currentTime

  const osc1 = ctx.createOscillator()
  const osc2 = ctx.createOscillator()
  const gain = ctx.createGain()
  osc1.type = 'sine'
  osc2.type = 'sine'
  osc1.frequency.setValueAtTime(440, t)
  osc1.frequency.exponentialRampToValueAtTime(880, t + 0.3)
  osc2.frequency.setValueAtTime(442, t)
  osc2.frequency.exponentialRampToValueAtTime(884, t + 0.3)
  gain.gain.setValueAtTime(0.1, t)
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5)
  osc1.connect(gain)
  osc2.connect(gain)
  gain.connect(ctx.destination)
  osc1.start(t)
  osc2.start(t)
  osc1.stop(t + 0.5)
  osc2.stop(t + 0.5)
}
