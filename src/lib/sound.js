/**
 * Cyberpunk sound engine — Web Audio API only, no external files.
 * All sounds synthesized on demand. Volume is global and mute-able.
 *
 * Sounds:
 *   tick()      — keystroke / typing blip
 *   click()     — UI click
 *   hover()     — soft hover blip
 *   submit()    — transmission whoosh
 *   stage()     — per-stage progress beep
 *   glitch()    — glitch / scramble burst
 *   error()     — error buzz
 *   granted()   — success ascending chime
 *
 * Autoplay-safe: AudioContext is created lazily and resumed on first user gesture.
 */

let ctx = null
let masterGain = null
let muted = false
const LISTENERS = new Set()

// Ambient drone state
let ambient = null // { gain, nodes: [], stop: () => void }

function notify() {
  for (const cb of LISTENERS) cb(muted)
}

function getCtx() {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const Ctor = window.AudioContext || window.webkitAudioContext
    if (!Ctor) return null
    ctx = new Ctor()
    masterGain = ctx.createGain()
    masterGain.gain.value = muted ? 0 : 0.6
    masterGain.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') {
    // best-effort resume; ignore promise rejection
    ctx.resume().catch(() => {})
  }
  return ctx
}

// Re-arm on the first user gesture so iOS/Chrome let us play.
if (typeof window !== 'undefined') {
  const arm = () => {
    getCtx()
    // start ambient drone on first interaction (autoplay-policy safe)
    startAmbient()
    window.removeEventListener('pointerdown', arm)
    window.removeEventListener('keydown', arm)
    window.removeEventListener('touchstart', arm)
  }
  window.addEventListener('pointerdown', arm, { once: true, passive: true })
  window.addEventListener('keydown', arm, { once: true })
  window.addEventListener('touchstart', arm, { once: true, passive: true })
}

/**
 * Ominous ambient drone:
 *  - three slightly detuned oscillators forming a minor chord (root + min3 + 5)
 *  - a sub-bass sine for rumble
 *  - a slow LFO modulating a lowpass filter (eerie movement)
 *  - a slow amplitude LFO for breathing / heartbeat feel
 *  - occasional sparse "transmission whispers" — high detuned blips at random
 */
function startAmbient() {
  const c = getCtx()
  if (!c) return
  if (ambient) return // already running

  // Master ambient bus — sits under masterGain so mute kills it too.
  const bus = c.createGain()
  bus.gain.value = 0
  bus.connect(masterGain)

  // Fade in slowly
  const t0 = c.currentTime
  bus.gain.linearRampToValueAtTime(0.32, t0 + 6)

  // Lowpass filter shapes the whole drone
  const lp = c.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 380
  lp.Q.value = 4
  lp.connect(bus)

  // LFO on the filter cutoff for slow, eerie sweep
  const filterLfo = c.createOscillator()
  filterLfo.type = 'sine'
  filterLfo.frequency.value = 0.06 // ~16s period
  const filterLfoGain = c.createGain()
  filterLfoGain.gain.value = 180
  filterLfo.connect(filterLfoGain).connect(lp.frequency)
  filterLfo.start()

  // Slow amplitude LFO — adds a doom-laden "breathing" pulse
  const ampLfo = c.createOscillator()
  ampLfo.type = 'sine'
  ampLfo.frequency.value = 0.11 // ~9s period
  const ampLfoGain = c.createGain()
  ampLfoGain.gain.value = 0.18 // ± gain wobble
  ampLfo.connect(ampLfoGain).connect(bus.gain)
  ampLfo.start()

  // Three drone voices — A minor (A1 + C2 + E2), slightly detuned for thickness
  const voices = [
    { freq: 55.0, type: 'sawtooth', detuneCents: -7, gain: 0.07 }, // A1 root
    { freq: 65.41, type: 'sawtooth', detuneCents: +9, gain: 0.05 }, // C2 minor 3rd
    { freq: 82.41, type: 'triangle', detuneCents: -4, gain: 0.05 }, // E2 fifth
  ]
  const oscNodes = []
  for (const v of voices) {
    // Two detuned oscillators per voice for chorus-like thickness
    for (const offset of [-v.detuneCents, +v.detuneCents]) {
      const o = c.createOscillator()
      o.type = v.type
      o.frequency.value = v.freq
      o.detune.value = offset
      const g = c.createGain()
      g.gain.value = v.gain
      o.connect(g).connect(lp)
      o.start()
      oscNodes.push(o)
    }
  }

  // Sub-bass rumble — pure sine an octave below the root
  const sub = c.createOscillator()
  sub.type = 'sine'
  sub.frequency.value = 27.5 // A0
  const subGain = c.createGain()
  subGain.gain.value = 0.22
  sub.connect(subGain).connect(bus) // bypass filter, keep the bottom intact
  sub.start()
  oscNodes.push(sub)

  // Subtle low-noise wash (room tone / static)
  const noiseBuf = c.createBuffer(1, c.sampleRate * 4, c.sampleRate)
  const noiseData = noiseBuf.getChannelData(0)
  for (let i = 0; i < noiseData.length; i++) noiseData[i] = (Math.random() * 2 - 1) * 0.5
  const noise = c.createBufferSource()
  noise.buffer = noiseBuf
  noise.loop = true
  const noiseFilter = c.createBiquadFilter()
  noiseFilter.type = 'bandpass'
  noiseFilter.frequency.value = 420
  noiseFilter.Q.value = 0.8
  const noiseGain = c.createGain()
  noiseGain.gain.value = 0.025
  noise.connect(noiseFilter).connect(noiseGain).connect(bus)
  noise.start()

  ambient = {
    bus,
    stop() {
      try {
        const t = c.currentTime
        bus.gain.cancelScheduledValues(t)
        bus.gain.setValueAtTime(bus.gain.value, t)
        bus.gain.linearRampToValueAtTime(0, t + 1.2)
        // stop oscillators after the fade
        setTimeout(() => {
          try {
            filterLfo.stop()
            ampLfo.stop()
            noise.stop()
            for (const n of oscNodes) {
              try {
                n.stop()
              } catch {}
            }
            bus.disconnect()
          } catch {}
        }, 1300)
      } catch {}
      ambient = null
    },
  }
}

export const sound = {
  startAmbient,
  stopAmbient() {
    if (ambient) ambient.stop()
  },
  isAmbientPlaying: () => !!ambient,
  isMuted: () => muted,
  toggleMute() {
    muted = !muted
    if (masterGain) masterGain.gain.value = muted ? 0 : 0.6
    notify()
    return muted
  },
  setMuted(v) {
    muted = !!v
    if (masterGain) masterGain.gain.value = muted ? 0 : 0.6
    notify()
  },
  subscribe(cb) {
    LISTENERS.add(cb)
    return () => LISTENERS.delete(cb)
  },

  /** short ticky keystroke — used while typing */
  tick() {
    const c = getCtx()
    if (!c || muted) return
    const t = c.currentTime
    const osc = c.createOscillator()
    const g = c.createGain()
    osc.type = 'square'
    osc.frequency.setValueAtTime(900 + Math.random() * 700, t)
    osc.frequency.exponentialRampToValueAtTime(220, t + 0.04)
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.08, t + 0.005)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06)
    osc.connect(g).connect(masterGain)
    osc.start(t)
    osc.stop(t + 0.07)
  },

  /** firm UI click */
  click() {
    const c = getCtx()
    if (!c || muted) return
    const t = c.currentTime
    const osc = c.createOscillator()
    const g = c.createGain()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(1400, t)
    osc.frequency.exponentialRampToValueAtTime(420, t + 0.08)
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.18, t + 0.005)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12)
    osc.connect(g).connect(masterGain)
    osc.start(t)
    osc.stop(t + 0.14)
  },

  /** soft hover blip */
  hover() {
    const c = getCtx()
    if (!c || muted) return
    const t = c.currentTime
    const osc = c.createOscillator()
    const g = c.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(1200, t)
    osc.frequency.exponentialRampToValueAtTime(2200, t + 0.06)
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.05, t + 0.01)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09)
    osc.connect(g).connect(masterGain)
    osc.start(t)
    osc.stop(t + 0.1)
  },

  /** soft cinematic transmit — low woosh + airy down-sweep, no beeps */
  submit() {
    const c = getCtx()
    if (!c || muted) return
    const t = c.currentTime

    // Low body — short sine swell, no harsh harmonics
    const body = c.createOscillator()
    const bodyG = c.createGain()
    body.type = 'sine'
    body.frequency.setValueAtTime(90, t)
    body.frequency.exponentialRampToValueAtTime(45, t + 0.35)
    bodyG.gain.setValueAtTime(0.0001, t)
    bodyG.gain.linearRampToValueAtTime(0.22, t + 0.05)
    bodyG.gain.exponentialRampToValueAtTime(0.0001, t + 0.4)
    body.connect(bodyG).connect(masterGain)
    body.start(t)
    body.stop(t + 0.42)

    // Airy down-sweep — filtered noise, like a packet leaving the room
    const noise = createNoise(c, 0.5)
    const ng = c.createGain()
    const lp = c.createBiquadFilter()
    lp.type = 'lowpass'
    lp.Q.value = 2
    lp.frequency.setValueAtTime(3200, t)
    lp.frequency.exponentialRampToValueAtTime(280, t + 0.45)
    ng.gain.setValueAtTime(0.0001, t)
    ng.gain.linearRampToValueAtTime(0.05, t + 0.04)
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.5)
    noise.connect(lp).connect(ng).connect(masterGain)
    noise.start(t)
    noise.stop(t + 0.52)
  },

  /** per-stage progress blip — soft sine, subtle */
  stage() {
    const c = getCtx()
    if (!c || muted) return
    const t = c.currentTime
    const osc = c.createOscillator()
    const g = c.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(1400 + Math.random() * 200, t)
    osc.frequency.exponentialRampToValueAtTime(900, t + 0.09)
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.025, t + 0.005)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.1)
    osc.connect(g).connect(masterGain)
    osc.start(t)
    osc.stop(t + 0.12)
  },

  /** static / glitch burst */
  glitch() {
    const c = getCtx()
    if (!c || muted) return
    const t = c.currentTime
    const noise = createNoise(c, 0.22)
    const g = c.createGain()
    const hp = c.createBiquadFilter()
    hp.type = 'highpass'
    hp.frequency.value = 800 + Math.random() * 800
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.12, t + 0.005)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18)
    noise.connect(hp).connect(g).connect(masterGain)
    noise.start(t)
    noise.stop(t + 0.2)
  },

  /** error buzz */
  error() {
    const c = getCtx()
    if (!c || muted) return
    const t = c.currentTime
    const osc = c.createOscillator()
    const g = c.createGain()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(220, t)
    osc.frequency.linearRampToValueAtTime(140, t + 0.25)
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.18, t + 0.01)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3)
    osc.connect(g).connect(masterGain)
    osc.start(t)
    osc.stop(t + 0.32)
  },

  /** access granted — soft warm pad chord that resolves and blooms */
  granted() {
    const c = getCtx()
    if (!c || muted) return
    const t0 = c.currentTime

    // Warm major-add9 chord: D, A, F#, E (octave) — peaceful, resolved
    // Played as a single bloom, not an arpeggio
    const chord = [
      { freq: 146.83, type: 'sine', gain: 0.18 }, // D3 root
      { freq: 220.0, type: 'sine', gain: 0.14 }, // A3 fifth
      { freq: 369.99, type: 'sine', gain: 0.11 }, // F#4 third
      { freq: 659.25, type: 'sine', gain: 0.08 }, // E5 ninth (sparkle)
    ]

    // Shared lowpass to keep it warm, not glassy
    const lp = c.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.setValueAtTime(900, t0)
    lp.frequency.exponentialRampToValueAtTime(2800, t0 + 0.5)
    lp.Q.value = 0.6
    lp.connect(masterGain)

    chord.forEach((v) => {
      const osc = c.createOscillator()
      const g = c.createGain()
      osc.type = v.type
      osc.frequency.setValueAtTime(v.freq, t0)
      g.gain.setValueAtTime(0.0001, t0)
      g.gain.linearRampToValueAtTime(v.gain, t0 + 0.18) // slow bloom-in
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.4)
      osc.connect(g).connect(lp)
      osc.start(t0)
      osc.stop(t0 + 1.5)
    })

    // Subtle airy shimmer that fades in/out under the chord
    const noise = createNoise(c, 1.3)
    const ng = c.createGain()
    const bp = c.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.setValueAtTime(3200, t0)
    bp.frequency.exponentialRampToValueAtTime(5200, t0 + 1.0)
    bp.Q.value = 1.4
    ng.gain.setValueAtTime(0.0001, t0)
    ng.gain.linearRampToValueAtTime(0.018, t0 + 0.4)
    ng.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.3)
    noise.connect(bp).connect(ng).connect(masterGain)
    noise.start(t0)
    noise.stop(t0 + 1.35)
  },
}

function createNoise(c, durationSec) {
  const length = Math.max(1, Math.floor(c.sampleRate * durationSec))
  const buf = c.createBuffer(1, length, c.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1
  const src = c.createBufferSource()
  src.buffer = buf
  return src
}
