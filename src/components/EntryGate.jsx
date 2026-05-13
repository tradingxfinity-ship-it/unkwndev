import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { sound } from '../lib/sound.js'

/**
 * Fullscreen entry gate. The wide "ENTER TO JOIN" button doubles as the
 * preloader — clicking it fills the button left-to-right, then unmounts
 * the gate to reveal the hero. The click also arms the browser's audio
 * context (autoplay policy), so the welcome voice + ambient music play.
 */
export default function EntryGate({ onEnter }) {
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [leaving, setLeaving] = useState(false)
  const [hexA, setHexA] = useState('00000000')
  const [hexB, setHexB] = useState('FFFFFFFF')
  const [showFlash, setShowFlash] = useState(false)
  const timers = useRef([])
  const stageMarkRef = useRef(0)

  function clearAll() {
    for (const t of timers.current) clearTimeout(t)
    timers.current = []
  }
  function later(fn, ms) {
    const id = window.setTimeout(fn, ms)
    timers.current.push(id)
    return id
  }

  // Rolling hex readouts — corner counters keep the gate feeling "live"
  useEffect(() => {
    const id = setInterval(() => {
      let a = '', b = ''
      for (let i = 0; i < 8; i++) {
        a += '0123456789ABCDEF'[(Math.random() * 16) | 0]
        b += '0123456789ABCDEF'[(Math.random() * 16) | 0]
      }
      setHexA(a)
      setHexB(b)
    }, 110)
    return () => clearInterval(id)
  }, [])

  // Trigger from Enter / Space key
  useEffect(() => {
    function onKey(e) {
      if (loading || leaving) return
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        startLoading()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, leaving])

  function startLoading() {
    if (loading || leaving) return
    setLoading(true)
    sound.click()
    later(() => sound.submit(), 60)

    // Drive progress 0 → 100 over ~2.6s with a soft, slightly bumpy curve
    let p = 0
    const tick = () => {
      const remaining = 100 - p
      const step = Math.max(0.6, remaining * 0.06 + Math.random() * 1.2)
      p = Math.min(100, p + step)
      setProgress(p)
      // soft tick every ~14%
      const mark = Math.floor(p / 14)
      if (mark > stageMarkRef.current) {
        stageMarkRef.current = mark
        sound.tick()
      }
      if (p < 100) {
        later(tick, 60 + Math.random() * 40)
      } else {
        sound.granted()
        later(() => setShowFlash(true), 80)
        later(() => setShowFlash(false), 280)
        later(() => setLeaving(true), 320)
        later(() => onEnter && onEnter(), 900)
      }
    }
    later(tick, 220)
  }

  useEffect(() => clearAll, [])

  return (
    <AnimatePresence>
      {!leaving && (
        <motion.div
          key="entrygate"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }}
          className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden bg-black text-neon-500"
        >
          {/* ---------- ATMOSPHERE LAYERS ---------- */}
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(50% 45% at 50% 50%, rgba(0,255,65,0.13) 0%, transparent 70%)',
            }}
          />
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[60vmin] w-[60vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-neon-500/15 mix-blend-screen animate-breathe blur-3xl" />
          <div className="pointer-events-none absolute inset-0 scanlines opacity-80" />
          <div className="pointer-events-none absolute inset-0 noise opacity-[0.08]" />
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

          {/* corner readouts */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="absolute left-6 top-6 font-mono text-[10px] leading-relaxed tracking-[0.3em] text-neon-500/80 sm:text-[11px]"
          >
            <div className="flex items-center gap-2">
              <span className="pulse-dot" />
              UNKWN&nbsp;//&nbsp;ENTRY GATE
            </div>
            <div className="mt-1 opacity-60">SIG&nbsp;0x{hexA}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.6 }}
            className="absolute right-6 top-6 text-right font-mono text-[10px] leading-relaxed tracking-[0.3em] text-neon-500/80 sm:text-[11px]"
          >
            <div className="opacity-70">{loading ? 'ESTABLISHING LINK' : 'AWAITING OPERATOR'}</div>
            <div className="opacity-50">KEY&nbsp;0x{hexB}</div>
          </motion.div>

          {/* ---------- CENTER STACK ---------- */}
          <div className="relative z-10 flex w-full max-w-3xl flex-col items-center px-6">
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="mb-5 font-mono text-[10px] tracking-[0.45em] text-neon-500/70 sm:text-[11px]"
            >
              ▸ SECURE CHANNEL DETECTED
            </motion.div>

            {/* ============ THE LONG ENTER BUTTON ============ */}
            <motion.button
              type="button"
              onClick={startLoading}
              onMouseEnter={() => !loading && sound.hover()}
              disabled={loading}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              whileTap={!loading ? { scale: 0.985 } : undefined}
              className={`group relative isolate flex h-16 w-full max-w-2xl items-center justify-center overflow-hidden rounded-md border bg-black/40 font-display text-2xl font-bold uppercase tracking-[0.4em] text-neon-200 shadow-neon transition-all focus:outline-none focus:ring-1 focus:ring-neon-500 sm:h-20 sm:text-3xl ${
                loading
                  ? 'border-neon-500/80 cursor-progress'
                  : 'border-neon-500/50 hover:border-neon-500 hover:bg-neon-500/10 hover:text-neon-100 hover:shadow-neon-lg cursor-pointer'
              }`}
              style={{
                textShadow:
                  '0 0 14px rgba(0,255,65,0.65), 0 0 40px rgba(0,255,65,0.3)',
              }}
              aria-label="Enter to join"
            >
              {/* FILL — solid neon, animates left→right when loading */}
              <motion.span
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.18, ease: 'linear' }}
                className="pointer-events-none absolute left-0 top-0 h-full bg-neon-500 shadow-[0_0_24px_#00ff41]"
              />

              {/* moving scanline beam inside button */}
              <span
                className="pointer-events-none absolute inset-x-0 h-[40px] animate-scanline opacity-60"
                style={{
                  background:
                    'linear-gradient(to bottom, transparent, rgba(0,255,65,0.18), transparent)',
                  filter: 'blur(2px)',
                }}
              />

              {/* internal corner brackets */}
              {[
                'top-1 left-1 border-l border-t',
                'top-1 right-1 border-r border-t',
                'bottom-1 left-1 border-l border-b',
                'bottom-1 right-1 border-r border-b',
              ].map((cls, i) => (
                <span
                  key={i}
                  className={`pointer-events-none absolute h-3 w-3 border-neon-500/70 ${cls}`}
                />
              ))}

              {/* hover sweep highlight (idle only) */}
              {!loading && (
                <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-neon-500/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              )}

              {/* LABEL — stays the same throughout */}
              <span
                className="glitch neon-flicker relative z-10"
                data-text="ENTER TO JOIN"
              >
                ENTER TO JOIN
              </span>
            </motion.button>

            {/* tagline below */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0.55, 1] }}
              transition={{ delay: 0.9, duration: 1.6 }}
              className="mt-6 font-mono text-[10px] tracking-[0.45em] text-neon-500/65 sm:text-[11px]"
            >
              {loading ? 'STAND BY · DO NOT REFRESH' : 'CLICK TO INITIATE  //  PRESS [ENTER]'}
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.4, duration: 0.6 }}
              className="mt-10 max-w-md text-center font-mono text-[9px] leading-relaxed tracking-[0.3em] text-neon-500/40 sm:text-[10px]"
            >
              ⚠ UNAUTHORIZED ACCESS IS LOGGED · YOUR SESSION IS PRIVATE
            </motion.div>
          </div>

          {/* bottom marquee */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.6 }}
            className="pointer-events-none absolute inset-x-0 bottom-6 overflow-hidden"
          >
            <div className="marquee whitespace-nowrap font-mono text-[10px] tracking-[0.35em] text-neon-500/45">
              {Array.from({ length: 2 }).map((_, i) => (
                <span key={i} className="px-8">
                  ◉ STANDBY&nbsp;//&nbsp;∮ AWAITING HANDSHAKE&nbsp;//&nbsp;⌬ ENTROPY 7.998&nbsp;//&nbsp;⚠ DO NOT SHARE THIS URL&nbsp;//&nbsp;⏃ PEERS 142&nbsp;//&nbsp;
                </span>
              ))}
            </div>
          </motion.div>

          {/* completion flash */}
          <AnimatePresence>
            {showFlash && (
              <motion.div
                key="flash"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.28, times: [0, 0.3, 1] }}
                className="pointer-events-none absolute inset-0 bg-neon-500/40 mix-blend-screen"
              />
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
