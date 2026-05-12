import { useEffect, useRef, useState } from 'react'

const CHARS = '!<>-_\\/[]{}—=+*^?#________ABCDEFGHIJKLMNOPQRSTUVWXYZ01'

/**
 * Cinematic scrambled-text decoder.
 * Each character flickers through random glyphs until it locks onto the target.
 */
export default function ScrambleText({
  text,
  className = '',
  delay = 0,
  speed = 38,
  revealEvery = 2,
  onDone,
}) {
  const [out, setOut] = useState('')
  const frameRef = useRef(0)
  const lockRef = useRef([])

  useEffect(() => {
    let cancelled = false
    const targets = (text ?? '').split('')
    if (targets.length === 0) {
      setOut('')
      return
    }
    lockRef.current = new Array(targets.length).fill(false)
    let revealed = 0
    let tick = 0

    const start = () => {
      const loop = () => {
        if (cancelled) return
        tick++
        if (tick % revealEvery === 0 && revealed < targets.length) {
          // reveal in a slightly randomized but mostly left-to-right order
          const candidates = []
          for (let i = 0; i < targets.length; i++) {
            if (!lockRef.current[i]) candidates.push(i)
          }
          // bias toward earliest unrevealed
          candidates.sort((a, b) => a - b + (Math.random() - 0.5) * 3)
          if (candidates.length) {
            lockRef.current[candidates[0]] = true
            revealed++
          }
        }
        const next = targets
          .map((ch, i) => {
            if (ch === ' ') return ' '
            if (lockRef.current[i]) return ch
            return CHARS[(Math.random() * CHARS.length) | 0]
          })
          .join('')
        setOut(next)
        if (revealed < targets.length) {
          frameRef.current = window.setTimeout(loop, speed)
        } else {
          onDone && onDone()
        }
      }
      loop()
    }

    const t = window.setTimeout(start, delay)
    return () => {
      cancelled = true
      clearTimeout(t)
      clearTimeout(frameRef.current)
    }
  }, [text, delay, speed, revealEvery, onDone])

  return (
    <span className={className} aria-label={text}>
      {out || '\u00A0'}
    </span>
  )
}
