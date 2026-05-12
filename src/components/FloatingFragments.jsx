import { useMemo } from 'react'
import { motion } from 'framer-motion'

const FRAGMENTS = [
  '0x7F::HANDSHAKE',
  'SHA-256/8a3f…d2',
  'WHOIS::REDACTED',
  'PKT_LOSS 0.00%',
  '[OK] tunnel',
  '∮ signal',
  'AES-256-GCM',
  'BLOCK#71F4',
  'NULL_ROUTE',
  'echo $ROOT',
  'PEER 0xC4',
  'ZK::PROOF',
  '/dev/null',
  'SIG=VALID',
  '> trace=off',
  'SEED=Ω',
  'ENT 7.99/8',
  'PORT 8443',
]

// Pseudo-random but stable layout across rerenders.
function rand(seed) {
  let x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

export default function FloatingFragments({ count = 14 }) {
  const items = useMemo(() => {
    return new Array(count).fill(0).map((_, i) => {
      const r1 = rand(i + 1)
      const r2 = rand(i + 7.3)
      const r3 = rand(i + 13.1)
      const r4 = rand(i + 21.7)
      return {
        text: FRAGMENTS[i % FRAGMENTS.length],
        left: 4 + r1 * 92, // %
        top: 8 + r2 * 84, // %
        delay: r3 * 6,
        duration: 8 + r4 * 10,
        size: 9 + Math.floor(r2 * 4), // 9..12 px
        opacity: 0.25 + r4 * 0.4,
      }
    })
  }, [count])

  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
      {items.map((it, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 12 }}
          animate={{
            opacity: [0, it.opacity, it.opacity, 0],
            y: [-6, -22, -8, -28],
            x: [0, 6, -4, 0],
          }}
          transition={{
            duration: it.duration,
            delay: it.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute font-mono tracking-[0.18em] text-neon-500/70"
          style={{
            left: `${it.left}%`,
            top: `${it.top}%`,
            fontSize: `${it.size}px`,
            textShadow: '0 0 8px rgba(0,255,65,0.4)',
            whiteSpace: 'nowrap',
          }}
        >
          {it.text}
        </motion.div>
      ))}
    </div>
  )
}
