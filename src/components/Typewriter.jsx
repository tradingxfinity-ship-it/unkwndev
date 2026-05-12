import { useEffect, useState } from 'react'

export default function Typewriter({
  lines = [],
  className = '',
  speed = 28,
  startDelay = 0,
  loop = false,
  caret = true,
}) {
  const [i, setI] = useState(0) // line index
  const [j, setJ] = useState(0) // char index
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setStarted(true), startDelay)
    return () => clearTimeout(t)
  }, [startDelay])

  useEffect(() => {
    if (!started) return
    if (i >= lines.length) {
      if (loop) {
        const t = setTimeout(() => {
          setI(0)
          setJ(0)
        }, 1800)
        return () => clearTimeout(t)
      }
      return
    }
    if (j < lines[i].length) {
      const t = setTimeout(() => setJ(j + 1), speed + Math.random() * 25)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => {
      setI(i + 1)
      setJ(0)
    }, 650)
    return () => clearTimeout(t)
  }, [i, j, lines, speed, started, loop])

  const current = lines[i] ? lines[i].slice(0, j) : ''
  const past = lines.slice(0, i)

  return (
    <div className={className}>
      {past.map((l, k) => (
        <div key={k} className="opacity-60">
          <span className="text-neon-500/60">{'>'}</span> {l}
        </div>
      ))}
      <div>
        <span className="text-neon-500/80">{'>'}</span> {current}
        {caret && started && i < lines.length && (
          <span className="ml-0.5 inline-block h-[1em] w-[0.55em] translate-y-[0.15em] animate-pulse bg-neon-500/90 align-middle" />
        )}
      </div>
    </div>
  )
}
