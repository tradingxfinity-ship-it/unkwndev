import { useEffect, useRef } from 'react'

/**
 * GPU-friendly matrix rain on canvas.
 * - DPR-aware
 * - Throttled to ~30fps for smoothness on low-end devices
 * - Density adapts to viewport width
 */
export default function MatrixRain({ opacity = 0.55, color = '#00ff41' }) {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })
    let raf = 0
    let drops = []
    let cols = 0
    let cellSize = 16
    let dpr = Math.min(window.devicePixelRatio || 1, 2)

    const CHARS =
      'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789ABCDEF<>/\\|*+-=$#@!?'

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      cellSize = w < 640 ? 14 : 18
      cols = Math.ceil(w / cellSize)
      drops = new Array(cols).fill(0).map(() => ({
        y: Math.random() * h,
        speed: 0.6 + Math.random() * 1.6,
        len: 6 + Math.floor(Math.random() * 22),
        bright: Math.random() * 0.6 + 0.4,
      }))
    }

    let last = 0
    const FRAME_MS = 1000 / 30
    function frame(t) {
      raf = requestAnimationFrame(frame)
      if (t - last < FRAME_MS) return
      last = t
      const w = canvas.clientWidth
      const h = canvas.clientHeight

      // soft trail fade
      ctx.fillStyle = 'rgba(0,0,0,0.15)'
      ctx.fillRect(0, 0, w, h)

      ctx.font = `${cellSize - 2}px "JetBrains Mono", monospace`
      ctx.textBaseline = 'top'

      for (let i = 0; i < cols; i++) {
        const d = drops[i]
        const x = i * cellSize

        // head (bright)
        const head = CHARS[(Math.random() * CHARS.length) | 0]
        ctx.fillStyle = `rgba(220,255,225,${0.95 * d.bright})`
        ctx.shadowColor = color
        ctx.shadowBlur = 8
        ctx.fillText(head, x, d.y)

        // tail
        ctx.shadowBlur = 0
        for (let k = 1; k < d.len; k++) {
          const alpha = (1 - k / d.len) * 0.55 * d.bright
          ctx.fillStyle = `rgba(0,255,65,${alpha})`
          const ch = CHARS[(Math.random() * CHARS.length) | 0]
          ctx.fillText(ch, x, d.y - k * cellSize)
        }

        d.y += d.speed * cellSize * 0.35
        if (d.y > h + d.len * cellSize) {
          d.y = -Math.random() * 200
          d.speed = 0.6 + Math.random() * 1.6
          d.len = 6 + Math.floor(Math.random() * 22)
          d.bright = Math.random() * 0.6 + 0.4
        }
      }
    }

    resize()
    raf = requestAnimationFrame(frame)
    window.addEventListener('resize', resize)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [color])

  return (
    <canvas
      ref={ref}
      className="absolute inset-0 h-full w-full"
      style={{ opacity, mixBlendMode: 'screen' }}
      aria-hidden
    />
  )
}
