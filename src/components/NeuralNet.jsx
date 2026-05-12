import { useEffect, useRef } from 'react'

/**
 * Mouse-reactive neural network. Nodes drift slowly; lines connect within radius.
 * Mouse acts as a gravitational attractor and brightens nearby connections.
 */
export default function NeuralNet({ mouseRef }) {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let raf = 0
    let nodes = []
    let dpr = Math.min(window.devicePixelRatio || 1, 2)
    let w = 0, h = 0

    function init() {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const target = Math.min(110, Math.floor((w * h) / 14000))
      nodes = new Array(target).fill(0).map(() => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.5 + 0.5,
      }))
    }

    function frame() {
      raf = requestAnimationFrame(frame)
      ctx.clearRect(0, 0, w, h)

      const m = mouseRef?.current || { x: -9999, y: -9999, active: false }

      // update nodes
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i]
        // mouse attraction
        if (m.active) {
          const dx = m.x - n.x
          const dy = m.y - n.y
          const d2 = dx * dx + dy * dy
          if (d2 < 260 * 260) {
            const f = 0.0008
            n.vx += dx * f
            n.vy += dy * f
          }
        }
        // damping + drift
        n.vx *= 0.985
        n.vy *= 0.985
        n.x += n.vx
        n.y += n.vy
        // wrap
        if (n.x < -20) n.x = w + 20
        if (n.x > w + 20) n.x = -20
        if (n.y < -20) n.y = h + 20
        if (n.y > h + 20) n.y = -20
      }

      // edges
      const R = 140
      const R2 = R * R
      ctx.lineWidth = 1
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i]
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const d2 = dx * dx + dy * dy
          if (d2 < R2) {
            const t = 1 - d2 / R2
            // proximity to mouse boosts brightness
            const mx = (a.x + b.x) / 2 - m.x
            const my = (a.y + b.y) / 2 - m.y
            const md2 = mx * mx + my * my
            const boost = m.active ? Math.max(0, 1 - md2 / (300 * 300)) : 0
            const alpha = Math.min(0.35, t * 0.25 + boost * 0.45)
            ctx.strokeStyle = `rgba(0,255,65,${alpha})`
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.stroke()
          }
        }
      }

      // nodes
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i]
        ctx.beginPath()
        ctx.fillStyle = 'rgba(0,255,65,0.85)'
        ctx.shadowColor = '#00ff41'
        ctx.shadowBlur = 6
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.shadowBlur = 0
    }

    init()
    raf = requestAnimationFrame(frame)
    window.addEventListener('resize', init)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', init)
    }
  }, [mouseRef])

  return (
    <canvas
      ref={ref}
      className="absolute inset-0 h-full w-full"
      style={{ opacity: 0.7 }}
      aria-hidden
    />
  )
}
