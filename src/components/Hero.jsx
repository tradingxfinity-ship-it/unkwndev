import { useEffect, useRef, useState } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { sound } from '../lib/sound.js'
import MatrixRain from './MatrixRain.jsx'
import MuteToggle from './MuteToggle.jsx'
import NeuralNet from './NeuralNet.jsx'
import FloatingFragments from './FloatingFragments.jsx'
import SystemHud from './SystemHud.jsx'
import ScrambleText from './ScrambleText.jsx'
import Typewriter from './Typewriter.jsx'
import AccessTerminal from './AccessTerminal.jsx'

const HEADLINES = [
  'ACCESS NETWORK',
  'SIGNAL DETECTED',
  'TRANSMISSION ACTIVE',
]

export default function Hero() {
  const containerRef = useRef(null)
  const mouseRef = useRef({ x: -9999, y: -9999, active: false })

  // mouse parallax (smoothed)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 60, damping: 18, mass: 0.6 })
  const sy = useSpring(my, { stiffness: 60, damping: 18, mass: 0.6 })
  const gridTx = useTransform(sx, (v) => `${v * -14}px`)
  const gridTy = useTransform(sy, (v) => `${v * -14}px`)
  const glowTx = useTransform(sx, (v) => `${v * -32}px`)
  const glowTy = useTransform(sy, (v) => `${v * -32}px`)
  const hudTx = useTransform(sx, (v) => `${v * 6}px`)
  const hudTy = useTransform(sy, (v) => `${v * 6}px`)

  const [headlineIdx, setHeadlineIdx] = useState(0)
  const [glitchOn, setGlitchOn] = useState(false)

  // Rotate headline every ~7s with a glitch burst on swap.
  useEffect(() => {
    const t = setInterval(() => {
      setGlitchOn(true)
      setTimeout(() => {
        setHeadlineIdx((i) => (i + 1) % HEADLINES.length)
        setGlitchOn(false)
      }, 380)
    }, 7400)
    return () => clearInterval(t)
  }, [])

  // Random ambient glitch flicker
  const [ambientFlicker, setAmbientFlicker] = useState(false)
  useEffect(() => {
    let cancelled = false
    function loop() {
      if (cancelled) return
      const wait = 4500 + Math.random() * 6000
      setTimeout(() => {
        if (cancelled) return
        setAmbientFlicker(true)
        setTimeout(() => setAmbientFlicker(false), 120 + Math.random() * 200)
        loop()
      }, wait)
    }
    loop()
    return () => {
      cancelled = true
    }
  }, [])

  function onMouseMove(e) {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const xRel = (e.clientX - rect.left) / rect.width - 0.5
    const yRel = (e.clientY - rect.top) / rect.height - 0.5
    mx.set(xRel)
    my.set(yRel)
    mouseRef.current.x = e.clientX - rect.left
    mouseRef.current.y = e.clientY - rect.top
    mouseRef.current.active = true
  }
  function onMouseLeave() {
    mouseRef.current.active = false
    mx.set(0)
    my.set(0)
  }

  return (
    <section
      ref={containerRef}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className="relative isolate h-[100svh] min-h-[640px] w-full overflow-hidden bg-black"
    >
      {/* ============ BACKGROUND LAYERS ============ */}

      {/* Base radial gradient + animated breathing glow */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(60% 50% at 50% 50%, rgba(0,255,65,0.07) 0%, rgba(0,40,18,0.04) 35%, rgba(0,0,0,1) 80%)',
          }}
        />
        <motion.div
          style={{ x: glowTx, y: glowTy }}
          className="absolute left-1/2 top-1/2 h-[80vmin] w-[80vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-neon-500/20 mix-blend-screen animate-breathe blur-[80px]"
        />
        <div className="absolute left-1/2 top-1/2 h-[120vmin] w-[120vmin] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40 mix-blend-screen animate-slowspin"
          style={{
            background:
              'conic-gradient(from 0deg, transparent 0deg, rgba(0,255,65,0.08) 30deg, transparent 60deg, transparent 180deg, rgba(0,255,65,0.05) 210deg, transparent 240deg)',
            filter: 'blur(50px)',
          }}
        />
      </div>

      {/* Perspective grid floor + ceiling — parallax shifted */}
      <motion.div
        style={{ x: gridTx, y: gridTy }}
        className="pointer-events-none absolute inset-0 z-0"
      >
        <div className="absolute inset-x-0 bottom-0 h-1/2 [perspective:800px]">
          <div
            className="absolute inset-0 origin-bottom [transform:rotateX(62deg)] opacity-50"
            style={{
              backgroundImage:
                'linear-gradient(rgba(0,255,65,0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,65,0.25) 1px, transparent 1px)',
              backgroundSize: '60px 60px',
              maskImage:
                'linear-gradient(to top, black 30%, transparent 95%)',
              WebkitMaskImage:
                'linear-gradient(to top, black 30%, transparent 95%)',
              animation: 'gridSlide 6s linear infinite',
            }}
          />
        </div>
        <div className="absolute inset-x-0 top-0 h-1/3 [perspective:800px]">
          <div
            className="absolute inset-0 origin-top [transform:rotateX(-62deg)] opacity-25"
            style={{
              backgroundImage:
                'linear-gradient(rgba(0,255,65,0.22) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,65,0.22) 1px, transparent 1px)',
              backgroundSize: '60px 60px',
              maskImage:
                'linear-gradient(to bottom, black 10%, transparent 90%)',
              WebkitMaskImage:
                'linear-gradient(to bottom, black 10%, transparent 90%)',
            }}
          />
        </div>
        <style>{`
          @keyframes gridSlide {
            0% { background-position: 0 0, 0 0; }
            100% { background-position: 0 60px, 0 60px; }
          }
        `}</style>
      </motion.div>

      {/* Neural network (mouse reactive) */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <NeuralNet mouseRef={mouseRef} />
      </div>

      {/* Matrix digital rain */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <MatrixRain opacity={0.45} />
      </div>

      {/* Floating data fragments */}
      <FloatingFragments count={18} />

      {/* Big rotating circular insignia behind headline */}
      <motion.div
        style={{ x: hudTx, y: hudTy }}
        className="pointer-events-none absolute left-1/2 top-1/2 z-0 -translate-x-1/2 -translate-y-1/2"
      >
        <div className="relative h-[78vmin] w-[78vmin] opacity-30 sm:opacity-40">
          <div className="absolute inset-0 animate-slowspin rounded-full border border-neon-500/30" />
          <div
            className="absolute inset-[5%] rounded-full border border-dashed border-neon-500/30"
            style={{ animation: 'slowspin 110s linear infinite reverse' }}
          />
          <div className="absolute inset-[16%] animate-slowspin rounded-full border border-neon-500/20" />
          {/* tick marks */}
          <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
            {Array.from({ length: 60 }).map((_, i) => {
              const a = (i / 60) * Math.PI * 2
              const x1 = 50 + Math.cos(a) * 48
              const y1 = 50 + Math.sin(a) * 48
              const x2 = 50 + Math.cos(a) * (i % 5 === 0 ? 44 : 46.5)
              const y2 = 50 + Math.sin(a) * (i % 5 === 0 ? 44 : 46.5)
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#00ff41"
                  strokeOpacity={i % 5 === 0 ? 0.6 : 0.25}
                  strokeWidth="0.2"
                />
              )
            })}
          </svg>
        </div>
      </motion.div>

      {/* Scanlines + noise + vignette + ambient flicker */}
      <div className="pointer-events-none absolute inset-0 z-40 scanlines" />
      <div className="pointer-events-none absolute inset-0 z-40 noise opacity-[0.08]" />
      <div className="pointer-events-none absolute inset-0 z-40 vignette" />
      {/* Moving scanline beam */}
      <div className="pointer-events-none absolute inset-0 z-40 overflow-hidden">
        <div
          className="absolute inset-x-0 h-[140px] animate-scanline"
          style={{
            background:
              'linear-gradient(to bottom, transparent 0%, rgba(0,255,65,0.06) 45%, rgba(0,255,65,0.12) 50%, rgba(0,255,65,0.06) 55%, transparent 100%)',
            filter: 'blur(2px)',
          }}
        />
      </div>
      {/* ambient hard flicker */}
      <div
        className="pointer-events-none absolute inset-0 z-40 transition-opacity duration-75"
        style={{
          background:
            'linear-gradient(180deg, rgba(0,255,65,0.04) 0%, transparent 50%, rgba(0,255,65,0.04) 100%)',
          opacity: ambientFlicker ? 0.85 : 0,
        }}
      />

      {/* ============ FOREGROUND HUD ============ */}
      <SystemHud />
      <MuteToggle />

      {/* ============ CONTENT ============ */}
      <div className="relative z-20 mx-auto flex h-full max-w-6xl flex-col items-center justify-center px-4 text-center sm:px-8">
        {/* status bar */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7 }}
          className="mb-6 flex items-center gap-3 rounded-full border border-neon-500/30 bg-black/40 px-3 py-1.5 font-mono text-[10px] tracking-[0.3em] text-neon-300 backdrop-blur sm:text-[11px]"
        >
          <span className="pulse-dot" />
          <span className="opacity-80">SECURE CHANNEL · 0x7F :: AES-256-GCM</span>
          <span className="hidden h-3 w-px bg-neon-500/40 sm:block" />
          <span className="hidden opacity-70 sm:inline">NODE 07 / 12 ONLINE</span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          key={headlineIdx}
          initial={{ opacity: 0, y: 24, letterSpacing: '0.5em' }}
          animate={{ opacity: 1, y: 0, letterSpacing: '0.05em' }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          className={`relative max-w-5xl select-none font-display text-[clamp(2rem,7vw,5.5rem)] font-bold leading-[0.95] text-neon-200 ${
            glitchOn ? 'glitch-burst' : ''
          }`}
          style={{
            textShadow:
              '0 0 18px rgba(0,255,65,0.55), 0 0 60px rgba(0,255,65,0.25)',
          }}
        >
          <span
            className="glitch neon-flicker"
            data-text={HEADLINES[headlineIdx]}
          >
            <ScrambleText
              key={`scramble-${headlineIdx}`}
              text={HEADLINES[headlineIdx]}
              speed={28}
              revealEvery={1}
              delay={120}
            />
          </span>
        </motion.h1>

        {/* divider */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 0.9, duration: 0.9 }}
          className="my-6 h-px w-40 origin-center bg-gradient-to-r from-transparent via-neon-500/80 to-transparent sm:w-72"
        />

        {/* Subtext / terminal lines */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0, duration: 0.6 }}
          className="mb-1 font-mono text-[11px] uppercase tracking-[0.35em] text-neon-500/70 sm:text-xs"
        >
          UNKWN&nbsp;//&nbsp;ENCRYPTED&nbsp;ACCESS&nbsp;NODE
        </motion.div>

        <div className="mx-auto mt-3 max-w-xl font-mono text-[12px] leading-relaxed text-neon-300/80 sm:text-sm">
          <Typewriter
            startDelay={1100}
            speed={22}
            lines={[
              'tracing origin… [REDACTED]',
              'leave an address. we will reach out when the gate opens.',
            ]}
          />
        </div>

        {/* Access terminal */}
        <div className="mt-8 w-full sm:mt-10">
          <AccessTerminal />
        </div>

        {/* Secondary actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.9, duration: 0.7 }}
          className="mt-6 flex flex-wrap items-center justify-center gap-3 font-mono text-[10px] tracking-[0.25em] text-neon-500/60 sm:text-[11px]"
        >
          <span onMouseEnter={() => sound.hover()} className="rounded border border-neon-500/20 bg-black/40 px-2.5 py-1 hover:border-neon-500/60 hover:text-neon-200">
            [ESC] ABORT
          </span>
          <span onMouseEnter={() => sound.hover()} className="rounded border border-neon-500/20 bg-black/40 px-2.5 py-1 hover:border-neon-500/60 hover:text-neon-200">
            [↩] TRANSMIT
          </span>
          <span onMouseEnter={() => sound.hover()} className="rounded border border-neon-500/20 bg-black/40 px-2.5 py-1 hover:border-neon-500/60 hover:text-neon-200">
            [⌃K] CIPHER
          </span>
        </motion.div>
      </div>

      {/* Bottom marquee — barely-readable system text */}
      <div className="pointer-events-none absolute inset-x-0 bottom-[68px] z-20 overflow-hidden border-y border-neon-500/15 bg-black/40 py-1 backdrop-blur-sm sm:bottom-[80px]">
        <div className="marquee whitespace-nowrap font-mono text-[10px] tracking-[0.3em] text-neon-500/55">
          {Array.from({ length: 2 }).map((_, i) => (
            <span key={i} className="px-8">
              ◉ NODE-07 ONLINE&nbsp;&nbsp;//&nbsp;&nbsp;∮ HANDSHAKE 0x7F::A2D9&nbsp;&nbsp;//&nbsp;&nbsp;⌬ ENTROPY 7.998/8.000&nbsp;&nbsp;//&nbsp;&nbsp;⏃ PEERS 142&nbsp;&nbsp;//&nbsp;&nbsp;✦ ROUTE OBFUSCATED&nbsp;&nbsp;//&nbsp;&nbsp;⚠ DO NOT SHARE THIS URL&nbsp;&nbsp;//&nbsp;&nbsp;◐ LAT 12ms&nbsp;&nbsp;//&nbsp;&nbsp;◈ CIPHER AES-256-GCM&nbsp;&nbsp;//&nbsp;&nbsp;∰ ZK-PROOF VALID&nbsp;&nbsp;//&nbsp;&nbsp;
            </span>
          ))}
        </div>
      </div>

      {/* Page-entrance black overlay sweep */}
      <motion.div
        initial={{ scaleY: 1 }}
        animate={{ scaleY: 0 }}
        transition={{ duration: 1.0, delay: 0.05, ease: [0.85, 0, 0.15, 1] }}
        style={{ transformOrigin: 'top' }}
        className="pointer-events-none absolute inset-0 z-50 bg-black"
      />
      <motion.div
        initial={{ scaleX: 1 }}
        animate={{ scaleX: 0 }}
        transition={{ duration: 0.8, delay: 0.6, ease: [0.85, 0, 0.15, 1] }}
        style={{ transformOrigin: 'right' }}
        className="pointer-events-none absolute inset-x-0 top-1/2 z-50 h-px bg-neon-500/80 shadow-neon"
      />
    </section>
  )
}
