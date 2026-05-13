import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { sound } from '../lib/sound.js'

const STAGES = [
  'INITIALIZING HANDSHAKE',
  'NEGOTIATING CIPHER SUITE',
  'EXCHANGING PUBLIC KEYS',
  'VERIFYING NODE INTEGRITY',
  'ENCRYPTING PAYLOAD',
  'TRANSMITTING',
  'ACCESS GRANTED',
]

export default function AccessTerminal() {
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('') // honeypot — must stay empty
  const [focus, setFocus] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [stage, setStage] = useState(0)
  const [progress, setProgress] = useState(0)
  const [done, setDone] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [err, setErr] = useState('')
  const inputRef = useRef(null)
  const progressTimerRef = useRef(null)

  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  // Maps API error codes to user-facing terminal strings.
  function errorMessage(code, status) {
    switch (code) {
      case 'INVALID_EMAIL':
        return 'INVALID_SIGNATURE :: VERIFY ADDRESS FORMAT'
      case 'RATE_LIMITED':
        return 'CHANNEL THROTTLED :: RETRY IN A MOMENT'
      case 'FORBIDDEN':
        return 'TRANSMISSION REJECTED :: INTEGRITY CHECK FAILED'
      case 'STORAGE_FAILED':
        return 'NODE OFFLINE :: RELAY UNAVAILABLE'
      case 'METHOD_NOT_ALLOWED':
      case 'BAD_REQUEST':
        return 'MALFORMED PACKET :: REFRESH AND RETRY'
      default:
        return status
          ? `LINK FAILED :: CODE ${status}`
          : 'LINK FAILED :: NETWORK UNREACHABLE'
    }
  }

  function failWithError(message) {
    if (progressTimerRef.current) {
      clearTimeout(progressTimerRef.current)
      progressTimerRef.current = null
    }
    setSubmitting(false)
    setProgress(0)
    setStage(0)
    setErr(message)
    sound.error()
    inputRef.current?.classList.add('glitch-burst')
    setTimeout(() => inputRef.current?.classList.remove('glitch-burst'), 450)
  }

  async function onSubmit(e) {
    e.preventDefault()
    if (submitting || done) return
    if (!valid) {
      failWithError('INVALID_SIGNATURE :: VERIFY ADDRESS FORMAT')
      return
    }
    setErr('')
    setSubmitting(true)
    setStage(0)
    setProgress(0)
    sound.submit()

    // Progress animation: climbs to ~90% while the network call is in flight,
    // then jumps to 100% on success. Keeps the "negotiating cipher / verifying"
    // theatre while we actually wait on the API.
    let p = 0
    let s = 0
    const stageCount = STAGES.length - 1
    const tick = () => {
      const ceiling = 90 // never auto-pass 90% — that's reserved for the real ack
      p = Math.min(ceiling, p + Math.random() * 6 + 1.5)
      setProgress(p)
      const nextStage = Math.min(stageCount - 1, Math.floor((p / 100) * stageCount))
      if (nextStage !== s) {
        s = nextStage
        setStage(s)
        sound.stage()
      }
      if (p < ceiling) {
        progressTimerRef.current = setTimeout(tick, 110 + Math.random() * 160)
      }
    }
    progressTimerRef.current = setTimeout(tick, 200)

    // Real API call.
    let res
    let body = null
    try {
      res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          source: 'hero',
          company, // honeypot — bots fill, real users leave blank
        }),
      })
      try {
        body = await res.json()
      } catch {
        body = null
      }
    } catch (networkErr) {
      console.error('[subscribe] network error', networkErr)
      failWithError(errorMessage(null, null))
      return
    }

    if (!res.ok || !body?.ok) {
      failWithError(errorMessage(body?.error, res.status))
      return
    }

    // Success — finish the progress bar with a flourish.
    if (progressTimerRef.current) {
      clearTimeout(progressTimerRef.current)
      progressTimerRef.current = null
    }
    setProgress(100)
    setStage(STAGES.length - 1)
    setTimeout(() => {
      setDone(true)
      setModalOpen(true)
      setSubmitting(false)
      sound.granted()
      sound.speak('access granted!!')
    }, 500)
  }

  // Cleanup any in-flight progress timer on unmount.
  useEffect(() => {
    return () => {
      if (progressTimerRef.current) clearTimeout(progressTimerRef.current)
    }
  }, [])

  function closeModal() {
    sound.click()
    setModalOpen(false)
  }

  // close modal on Escape
  useEffect(() => {
    if (!modalOpen) return
    function onKey(e) {
      if (e.key === 'Escape') closeModal()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [modalOpen])

  // keep the input width comfortable but allow it to flex on mobile
  return (
    <>
    <motion.form
      onSubmit={onSubmit}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.6, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      className="relative z-20 mx-auto w-full max-w-xl"
    >
      <div className="mb-3 flex items-center justify-between font-mono text-[10px] tracking-[0.3em] text-neon-500/70 sm:text-[11px]">
        <span className="flex items-center gap-2">
          <span className="pulse-dot" /> REQUEST ACCESS
        </span>
        <span className="opacity-60">PORT&nbsp;:&nbsp;443/TLS</span>
      </div>

      {/* Honeypot — visually hidden, off-screen, not in tab order. Bots that
          auto-fill every field will trip this; humans never see it. */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: '-10000px',
          top: 'auto',
          width: '1px',
          height: '1px',
          overflow: 'hidden',
        }}
      >
        <label htmlFor="company">Company</label>
        <input
          id="company"
          name="company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {done ? (
          <motion.div
            key="granted"
            initial={{ opacity: 0, y: 8, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -8, filter: 'blur(6px)' }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="border-sweep relative overflow-hidden rounded-md terminal-panel shadow-neon-lg"
            style={{ '--angle': '0deg' }}
          >
            <div className="relative flex items-center gap-3 px-4 py-4 sm:gap-4 sm:px-5 sm:py-5">
              {/* status check */}
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-neon-500/60 bg-neon-500/10 shadow-neon">
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5 text-neon-200"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <motion.path
                    d="M4 12.5l5 5 11-11"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 0.1, duration: 0.5, ease: 'easeOut' }}
                  />
                </svg>
                <span className="pointer-events-none absolute inset-0 animate-breathe rounded-full bg-neon-500/20 blur-md" />
              </div>

              {/* text */}
              <div className="min-w-0 flex-1">
                <div
                  className="glitch neon-flicker truncate font-display text-base font-bold uppercase tracking-[0.18em] text-neon-200 sm:text-lg"
                  data-text="ACCESS GRANTED"
                  style={{
                    textShadow:
                      '0 0 10px rgba(0,255,65,0.55), 0 0 30px rgba(0,255,65,0.25)',
                  }}
                >
                  ACCESS GRANTED
                </div>
                <div className="mt-1 truncate font-mono text-[10px] tracking-[0.25em] text-neon-500/75 sm:text-[11px]">
                  STAND BY · WAIT FOR UPCOMING UPDATES
                </div>
              </div>

              {/* live indicator */}
              <div className="hidden shrink-0 items-center gap-2 pl-2 font-mono text-[10px] tracking-[0.3em] text-neon-500/80 sm:flex">
                <span className="pulse-dot" />
                LIVE
              </div>
            </div>

            {/* full progress bar locked at 100% */}
            <div className="relative h-[2px] w-full overflow-hidden bg-neon-500/10">
              <div className="absolute left-0 top-0 h-full w-full bg-neon-500 shadow-[0_0_12px_#00ff41]" />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="input"
            ref={inputRef}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className={`border-sweep relative rounded-md terminal-panel transition-shadow duration-300 ${
              focus ? 'shadow-neon-lg' : 'shadow-neon'
            }`}
            style={{ '--angle': '0deg' }}
          >
            <div className="flex items-stretch gap-0">
              <div className="flex items-center pl-3 pr-2 font-mono text-xs text-neon-500/70 sm:text-sm">
                <span className="opacity-70">root@unkwn</span>
                <span className="opacity-60">:~$</span>
              </div>
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                spellCheck={false}
                placeholder="enter email address"
                value={email}
                disabled={submitting}
                onFocus={() => setFocus(true)}
                onBlur={() => setFocus(false)}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (err) setErr('')
                  sound.tick()
                }}
                className="flex-1 bg-transparent py-3 pr-2 font-mono text-sm text-neon-200 caret-neon-500 outline-none placeholder:text-neon-500/40 sm:text-base"
              />
              <button
                type="submit"
                disabled={submitting}
                onMouseEnter={() => !submitting && sound.hover()}
                className="group relative my-1 mr-1 overflow-hidden rounded-sm border border-neon-500/40 bg-neon-500/10 px-4 font-mono text-[11px] uppercase tracking-[0.25em] text-neon-300 transition-all hover:border-neon-500 hover:bg-neon-500/20 hover:text-neon-100 hover:shadow-neon disabled:opacity-60 sm:text-xs"
              >
                <span className="relative z-10">{submitting ? 'SENDING' : 'TRANSMIT'}</span>
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-neon-500/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              </button>
            </div>

            {/* live progress / status strip */}
            <div className="relative h-[2px] w-full overflow-hidden bg-neon-500/10">
              <motion.div
                animate={{ width: `${submitting ? progress : 0}%` }}
                transition={{ duration: 0.18, ease: 'linear' }}
                className="absolute left-0 top-0 h-full bg-neon-500 shadow-[0_0_12px_#00ff41]"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* under-input status line */}
      <div className="mt-3 flex min-h-[18px] items-center justify-between font-mono text-[10px] tracking-[0.2em] text-neon-500/70 sm:text-[11px]">
        <AnimatePresence mode="wait">
          {err ? (
            <motion.span
              key="err"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="text-[#ff3358]"
            >
              ✕ {err}
            </motion.span>
          ) : done ? (
            <motion.span
              key="done"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-neon-200"
            >
              ✓ CHANNEL ESTABLISHED · MONITORING FOR UPDATES…
            </motion.span>
          ) : submitting ? (
            <motion.span
              key={stage}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="text-neon-300"
            >
              ▸ {STAGES[stage]}…
            </motion.span>
          ) : (
            <motion.span
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="opacity-60"
            >
              ↪ ZERO-KNOWLEDGE · YOUR ADDRESS NEVER LEAVES THIS NODE
            </motion.span>
          )}
        </AnimatePresence>
        <span className="opacity-50">{submitting || done ? `${progress.toFixed(0)}%` : '—'}</span>
      </div>
    </motion.form>

    {/* ============ ACCESS GRANTED MODAL ============ */}
    <AnimatePresence>
      {modalOpen && (
        <motion.div
          key="modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="fixed inset-0 z-[60] flex items-center justify-center px-4"
          aria-modal="true"
          role="dialog"
        >
          {/* backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
            className="absolute inset-0 bg-black/85 backdrop-blur-md"
          />

          {/* moving scanline beam inside backdrop */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div
              className="absolute inset-x-0 h-[120px] animate-scanline"
              style={{
                background:
                  'linear-gradient(to bottom, transparent 0%, rgba(0,255,65,0.08) 50%, transparent 100%)',
                filter: 'blur(3px)',
              }}
            />
          </div>

          {/* panel */}
          <motion.div
            initial={{ scale: 0.94, y: 12, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, y: 6, opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="border-sweep relative z-10 w-full max-w-md rounded-md terminal-panel p-6 shadow-neon-lg sm:p-8"
            style={{ '--angle': '0deg' }}
          >
            {/* corner brackets */}
            {[
              'top-2 left-2 border-l border-t',
              'top-2 right-2 border-r border-t',
              'bottom-2 left-2 border-l border-b',
              'bottom-2 right-2 border-r border-b',
            ].map((cls, i) => (
              <span
                key={i}
                className={`pointer-events-none absolute h-4 w-4 border-neon-500/80 ${cls}`}
              />
            ))}

            {/* status header */}
            <div className="flex items-center justify-between font-mono text-[10px] tracking-[0.3em] text-neon-500/80 sm:text-[11px]">
              <span className="flex items-center gap-2">
                <span className="pulse-dot" /> SECURE LINK
              </span>
              <span className="opacity-60">0x7F :: VERIFIED</span>
            </div>

            {/* check mark */}
            <motion.div
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 220, damping: 14 }}
              className="mx-auto mt-6 flex h-16 w-16 items-center justify-center rounded-full border border-neon-500/60 bg-neon-500/10 shadow-neon"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-8 w-8 text-neon-300"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <motion.path
                  d="M4 12.5l5 5 11-11"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.35, duration: 0.55, ease: 'easeOut' }}
                />
              </svg>
            </motion.div>

            {/* title */}
            <motion.h2
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.5 }}
              className="glitch neon-flicker mt-5 text-center font-display text-3xl font-bold uppercase tracking-[0.15em] text-neon-200 sm:text-4xl"
              data-text="ACCESS GRANTED"
              style={{
                textShadow:
                  '0 0 14px rgba(0,255,65,0.6), 0 0 40px rgba(0,255,65,0.25)',
              }}
            >
              ACCESS GRANTED
            </motion.h2>

            {/* subtext */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="mt-3 text-center font-mono text-[11px] leading-relaxed tracking-[0.18em] text-neon-500/80 sm:text-xs"
            >
              welcome, operator. the channel is yours.
              <br />
              we will reach out when the gate opens.
            </motion.p>

            {/* meta line */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.75, duration: 0.5 }}
              className="mt-5 flex items-center justify-between font-mono text-[10px] tracking-[0.25em] text-neon-500/60"
            >
              <span>SESSION&nbsp;0x7F::A2D9</span>
              <span>SIG&nbsp;VALID</span>
            </motion.div>

            {/* divider */}
            <div className="my-5 h-px w-full bg-gradient-to-r from-transparent via-neon-500/50 to-transparent" />

            {/* done button */}
            <motion.button
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.85, duration: 0.4 }}
              type="button"
              onClick={closeModal}
              onMouseEnter={() => sound.hover()}
              autoFocus
              className="group relative w-full overflow-hidden rounded-sm border border-neon-500/50 bg-neon-500/10 py-3 font-mono text-xs uppercase tracking-[0.35em] text-neon-200 transition-all hover:border-neon-500 hover:bg-neon-500/20 hover:text-neon-100 hover:shadow-neon focus:outline-none focus:ring-1 focus:ring-neon-500"
            >
              <span className="relative z-10">DONE</span>
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-neon-500/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  )
}
