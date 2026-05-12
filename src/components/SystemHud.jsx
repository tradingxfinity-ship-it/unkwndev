import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

function pad(n, w = 2) {
  return String(n).padStart(w, '0')
}

function useClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  return now
}

function useDrift(min, max, period = 1400) {
  const [v, setV] = useState(() => (min + max) / 2)
  useEffect(() => {
    const t = setInterval(() => {
      setV(min + Math.random() * (max - min))
    }, period)
    return () => clearInterval(t)
  }, [min, max, period])
  return v
}

const COORD_GLYPHS = '0123456789ABCDEF'
function fakeCoord(len = 8) {
  let s = ''
  for (let i = 0; i < len; i++) s += COORD_GLYPHS[(Math.random() * 16) | 0]
  return s
}

export default function SystemHud() {
  const now = useClock()
  const cpu = useDrift(34, 88, 1700)
  const net = useDrift(120, 980, 900)
  const lat = useDrift(8, 42, 1100)
  const sig = useDrift(72, 99, 1500)
  const [seed, setSeed] = useState(() => fakeCoord(10))

  useEffect(() => {
    const t = setInterval(() => setSeed(fakeCoord(10)), 1300)
    return () => clearInterval(t)
  }, [])

  const time = `${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}:${pad(
    now.getUTCSeconds(),
  )} UTC`

  return (
    <>
      {/* Top-left */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.8 }}
        className="pointer-events-none absolute left-4 top-4 z-30 select-none font-mono text-[10px] leading-relaxed text-neon-500/70 sm:left-6 sm:top-6 sm:text-[11px]"
      >
        <div className="flex items-center gap-2">
          <span className="pulse-dot" />
          <span className="tracking-[0.25em]">UNKWN // NODE-07</span>
        </div>
        <div className="mt-1.5 opacity-70">SESSION&nbsp;{seed}</div>
        <div className="opacity-50">CHAN&nbsp;0x{seed.slice(0, 4)}::ENCRYPTED</div>
        <div className="opacity-40">KEY&nbsp;ED25519&nbsp;//&nbsp;AES-256-GCM</div>
      </motion.div>

      {/* Top-right */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.8 }}
        className="pointer-events-none absolute right-4 top-4 z-30 select-none text-right font-mono text-[10px] leading-relaxed text-neon-500/70 sm:right-6 sm:top-6 sm:text-[11px]"
      >
        <div className="tracking-[0.25em]">{time}</div>
        <div className="mt-1.5 opacity-70">
          LAT&nbsp;{lat.toFixed(1)}ms · SIG&nbsp;{sig.toFixed(0)}%
        </div>
        <div className="opacity-50">CPU&nbsp;{cpu.toFixed(0)}% · NET&nbsp;{net.toFixed(0)}KB/s</div>
        <div className="opacity-40">
          GEO&nbsp;{(40 + Math.sin(now.getTime() / 6000) * 0.5).toFixed(4)}°N&nbsp;·&nbsp;
          {(-74 + Math.cos(now.getTime() / 6000) * 0.5).toFixed(4)}°W
        </div>
      </motion.div>

      {/* Bottom-left */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0, duration: 0.8 }}
        className="pointer-events-none absolute bottom-4 left-4 z-30 select-none font-mono text-[10px] leading-relaxed text-neon-500/60 sm:bottom-6 sm:left-6 sm:text-[11px]"
      >
        <div className="opacity-70">[ FRAGMENT_LOG ]</div>
        <div className="opacity-50">{'> handshake.complete()'}</div>
        <div className="opacity-50">{'> verifying integrity...'}</div>
        <div className="opacity-50">{'> tunnel.established(' + seed.slice(2, 6) + ')'}</div>
      </motion.div>

      {/* Bottom-right */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1, duration: 0.8 }}
        className="pointer-events-none absolute bottom-4 right-4 z-30 select-none text-right font-mono text-[10px] leading-relaxed text-neon-500/60 sm:bottom-6 sm:right-6 sm:text-[11px]"
      >
        <div className="tracking-[0.3em]">v0.7.3—alpha</div>
        <div className="opacity-50">BUILD&nbsp;{seed.slice(0, 6)}</div>
        <div className="opacity-50">REGION&nbsp;∅ · ROUTE&nbsp;OBFUSCATED</div>
      </motion.div>

      {/* Corner brackets */}
      {[
        'top-3 left-3 border-l border-t',
        'top-3 right-3 border-r border-t',
        'bottom-3 left-3 border-l border-b',
        'bottom-3 right-3 border-r border-b',
      ].map((cls, i) => (
        <span
          key={i}
          className={`pointer-events-none absolute z-30 h-5 w-5 border-neon-500/70 ${cls}`}
        />
      ))}
    </>
  )
}
