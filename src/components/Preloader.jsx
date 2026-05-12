import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { sound } from '../lib/sound.js'

const PHASES = {
  LOAD: 'load',
  REVEAL: 'reveal',
  DONE: 'done',
}

export default function Preloader({ onDone }) {
  const [phase, setPhase] = useState(PHASES.LOAD)
  const [progress, setProgress] = useState(0)
  const [showFlash, setShowFlash] = useState(false)
  const [hex, setHex] = useState('00000000')
  const timers = useRef([])
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone

  function clearAll() {
    for (const t of timers.current) clearTimeout(t)
    timers.current = []
  }
  function later(fn, ms) {
    const id = window.setTimeout(fn, ms)
    timers.current.push(id)
    return id
  }

  // Drive progress 0 → 100 over ~2.6s with a soft, slightly bumpy curve.
  useEffect(() => {
    if (phase !== PHASES.LOAD) return
    let p = 0
    let lastTick = 0
    const tick = () => {
      // ease-out: bigger steps at start, smaller at the end
      const remaining = 100 - p
      const step = Math.max(0.6, remaining * 0.06 + Math.random() * 1.2)
      p = Math.min(100, p + step)
      setProgress(p)
      // soft tick sound every ~12%
      if (Math.floor(p / 12) > lastTick) {
        lastTick = Math.floor(p / 12)
        sound.tick()
      }
      if (p < 100) {
        later(tick, 60 + Math.random() * 40)
      } else {
        sound.granted()
        later(() => setShowFlash(true), 80)
        later(() => setShowFlash(false), 240)
        later(() => setPhase(PHASES.REVEAL), 320)
      }
    }
    later(tick, 250)
    return clearAll
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // After the slat wipe finishes, notify parent.
  useEffect(() => {
    if (phase !== PHASES.REVEAL) return
    later(() => {
      setPhase(PHASES.DONE)
      onDoneRef.current && onDoneRef.current()
    }, 820)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // Rolling hex readout — gives the corner counter a "live" feel
  useEffect(() => {
    if (phase === PHASES.DONE) return
    const id = setInterval(() => {
      let s = ''
      for (let i = 0; i < 8; i++) s += '0123456789ABCDEF'[(Math.random() * 16) | 0]
      setHex(s)
    }, 90)
    return () => clearInterval(id)
  }, [phase])

  // Skip on any key/click — gated behind a grace period so the in-flight
  // load click can't instantly dismiss the preloader.
  useEffect(() => {
    let armed = false
    const armTimer = window.setTimeout(() => {
      armed = true
    }, 1000)

    function skip() {
      if (!armed) return
      if (phase === PHASES.DONE) return
      clearAll()
      setProgress(100)
      setPhase(PHASES.REVEAL)
      later(() => {
        setPhase(PHASES.DONE)
        onDoneRef.current && onDoneRef.current()
      }, 500)
    }
    window.addEventListener('keydown', skip)
    window.addEventListener('pointerdown', skip)
    return () => {
      clearTimeout(armTimer)
      window.removeEventListener('keydown', skip)
      window.removeEventListener('pointerdown', skip)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  return (
    <AnimatePresence>
      {phase !== PHASES.DONE && (
        <motion.div
          key="preloader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } }}
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-black text-neon-500"
        >
          {/* ---------- ATMOSPHERE LAYERS ---------- */}
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.4, ease: 'easeOut' }}
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(45% 40% at 50% 50%, rgba(0,255,65,0.12) 0%, transparent 70%)',
            }}
          />
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[50vmin] w-[50vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-neon-500/15 mix-blend-screen animate-breathe blur-3xl" />
          <div className="pointer-events-none absolute inset-0 scanlines opacity-80" />
          <div className="pointer-events-none absolute inset-0 noise opacity-[0.07]" />
          <div className="pointer-events-none absolute inset-0 vignette" />

          {/* corner brackets */}
          {[
            'top-4 left-4 border-l border-t',
            'top-4 right-4 border-r border-t',
            'bottom-4 left-4 border-l border-b',
            'bottom-4 right-4 border-r border-b',
          ].map((cls, i) => (
            <span
              key={i}
              className={`pointer-events-none absolute h-5 w-5 border-neon-500/80 ${cls}`}
            />
          ))}

          {/* corner SEED readout */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="absolute left-6 top-6 font-mono text-[10px] leading-relaxed tracking-[0.3em] text-neon-500/80 sm:text-[11px]"
          >
            <div className="flex items-center gap-2">
              <span className="pulse-dot" />
              UNKWN&nbsp;//&nbsp;NODE-07
            </div>
            <div className="mt-1 opacity-60">SEED&nbsp;0x{hex}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.6 }}
            className="absolute right-6 top-6 text-right font-mono text-[10px] leading-relaxed tracking-[0.3em] text-neon-500/80 sm:text-[11px]"
          >
            <div className="opacity-70">SECURE BOOT</div>
            <div className="opacity-50">ED25519 · AES-256-GCM</div>
          </motion.div>

          {/* ---------- CENTER STACK ---------- */}
          <div className="relative z-10 flex w-full max-w-2xl flex-col items-center px-6">
            <div className="relative mb-8 h-32 w-32 sm:h-40 sm:w-40">
              <Insignia />
            </div>

            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="glitch neon-flicker font-display text-2xl font-bold uppercase tracking-[0.32em] text-neon-200 sm:text-3xl"
              data-text="LOADING"
            >
              LOADING
            </motion.div>

            {/* Progress bar */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="mt-8 w-full max-w-md"
            >
              <div className="mb-2 flex items-center justify-between font-mono text-[10px] tracking-[0.3em] text-neon-500/80 sm:text-[11px]">
                <span>{progress >= 100 ? 'READY' : 'LOADING'}</span>
                <span>{Math.floor(progress).toString().padStart(3, '0')}%</span>
              </div>
              <div className="relative h-[3px] w-full overflow-hidden rounded-sm bg-neon-500/10">
                <motion.div
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.18, ease: 'linear' }}
                  className="absolute left-0 top-0 h-full bg-neon-500 shadow-[0_0_14px_#00ff41]"
                />
                <motion.div
                  animate={{ left: `${progress}%` }}
                  transition={{ duration: 0.18, ease: 'linear' }}
                  className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-neon-200 shadow-[0_0_14px_#00ff41]"
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.6, duration: 0.6 }}
              className="mt-8 font-mono text-[9px] tracking-[0.4em] text-neon-500/45 sm:text-[10px]"
            >
              PRESS ANY KEY TO SKIP
            </motion.div>
          </div>

          {/* ---------- FINAL FLASH ---------- */}
          <AnimatePresence>
            {showFlash && (
              <motion.div
                key="flash"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.24, times: [0, 0.3, 1] }}
                className="pointer-events-none absolute inset-0 bg-neon-500/40 mix-blend-screen"
              />
            )}
          </AnimatePresence>

          {/* ---------- EXIT WIPE (slats) ---------- */}
          {phase === PHASES.REVEAL && (
            <div className="pointer-events-none absolute inset-0 z-50">
              {Array.from({ length: 8 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scaleY: 1 }}
                  animate={{ scaleY: 0 }}
                  transition={{
                    duration: 0.55,
                    delay: i * 0.04,
                    ease: [0.85, 0, 0.15, 1],
                  }}
                  style={{
                    transformOrigin: i % 2 === 0 ? 'top' : 'bottom',
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    left: `${(i / 8) * 100}%`,
                    width: `${100 / 8}%`,
                    background: '#000',
                    borderLeft: i === 0 ? 'none' : '1px solid rgba(0,255,65,0.15)',
                  }}
                />
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Insignia() {
  return (
    <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
      <defs>
        <radialGradient id="ringFill" cx="50%" cy="50%" r="50%">
          <stop offset="60%" stopColor="rgba(0,255,65,0)" />
          <stop offset="100%" stopColor="rgba(0,255,65,0.18)" />
        </radialGradient>
        <linearGradient id="sweep" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(0,255,65,0)" />
          <stop offset="100%" stopColor="rgba(0,255,65,0.8)" />
        </linearGradient>
      </defs>

      <motion.circle
        cx="50"
        cy="50"
        r="46"
        fill="none"
        stroke="#00ff41"
        strokeWidth="0.6"
        strokeDasharray="289"
        initial={{ strokeDashoffset: 289, opacity: 0 }}
        animate={{ strokeDashoffset: 0, opacity: 1 }}
        transition={{ duration: 1.2, ease: 'easeInOut' }}
      />
      <motion.circle
        cx="50"
        cy="50"
        r="36"
        fill="none"
        stroke="#00ff41"
        strokeOpacity="0.55"
        strokeWidth="0.4"
        strokeDasharray="2 3"
        initial={{ rotate: 0 }}
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 14, ease: 'linear' }}
        style={{ transformOrigin: '50% 50%' }}
      />
      <motion.circle
        cx="50"
        cy="50"
        r="26"
        fill="url(#ringFill)"
        stroke="#00ff41"
        strokeOpacity="0.4"
        strokeWidth="0.3"
        initial={{ rotate: 0 }}
        animate={{ rotate: -360 }}
        transition={{ repeat: Infinity, duration: 22, ease: 'linear' }}
        style={{ transformOrigin: '50% 50%' }}
      />

      {Array.from({ length: 60 }).map((_, i) => {
        const a = (i / 60) * Math.PI * 2 - Math.PI / 2
        const r1 = 46
        const r2 = i % 5 === 0 ? 41 : 43.5
        return (
          <motion.line
            key={i}
            x1={50 + Math.cos(a) * r1}
            y1={50 + Math.sin(a) * r1}
            x2={50 + Math.cos(a) * r2}
            y2={50 + Math.sin(a) * r2}
            stroke="#00ff41"
            strokeOpacity={i % 5 === 0 ? 0.85 : 0.35}
            strokeWidth="0.4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 + i * 0.008, duration: 0.25 }}
          />
        )
      })}

      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.6 }}
      >
        <line x1="14" y1="50" x2="34" y2="50" stroke="#00ff41" strokeWidth="0.4" strokeOpacity="0.65" />
        <line x1="66" y1="50" x2="86" y2="50" stroke="#00ff41" strokeWidth="0.4" strokeOpacity="0.65" />
        <line x1="50" y1="14" x2="50" y2="34" stroke="#00ff41" strokeWidth="0.4" strokeOpacity="0.65" />
        <line x1="50" y1="66" x2="50" y2="86" stroke="#00ff41" strokeWidth="0.4" strokeOpacity="0.65" />
      </motion.g>

      <motion.circle
        cx="50"
        cy="50"
        r="2.8"
        fill="#00ff41"
        animate={{
          r: [2.4, 3.4, 2.4],
          opacity: [0.85, 1, 0.85],
        }}
        transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
        style={{ filter: 'drop-shadow(0 0 6px #00ff41)' }}
      />

      <motion.g
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 3.2, ease: 'linear' }}
        style={{ transformOrigin: '50% 50%' }}
      >
        <path d="M50 50 L 96 50 A 46 46 0 0 0 75 9 Z" fill="url(#sweep)" opacity="0.55" />
      </motion.g>
    </svg>
  )
}
