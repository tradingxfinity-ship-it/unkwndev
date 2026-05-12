import { useEffect, useState } from 'react'
import { sound } from '../lib/sound.js'

export default function MuteToggle() {
  const [muted, setMuted] = useState(() => sound.isMuted())

  useEffect(() => {
    return sound.subscribe(setMuted)
  }, [])

  function onClick() {
    const next = sound.toggleMute()
    if (!next) sound.click()
  }

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => sound.hover()}
      aria-label={muted ? 'Unmute audio' : 'Mute audio'}
      title={muted ? 'AUDIO OFF — click to enable' : 'AUDIO ON — click to mute'}
      className="group pointer-events-auto absolute bottom-4 right-1/2 z-30 flex translate-x-1/2 items-center gap-2 rounded border border-neon-500/30 bg-black/55 px-2.5 py-1 font-mono text-[10px] tracking-[0.25em] text-neon-500/70 backdrop-blur transition-all hover:border-neon-500/80 hover:text-neon-200 hover:shadow-neon sm:bottom-6 sm:text-[11px]"
    >
      <span className="relative inline-flex h-2 w-2 items-center justify-center">
        <span
          className={`absolute inset-0 rounded-full transition-all ${
            muted ? 'bg-neon-500/30' : 'bg-neon-500 shadow-[0_0_8px_#00ff41]'
          }`}
        />
        {!muted && (
          <span className="absolute inset-[-3px] animate-ping rounded-full border border-neon-500/60" />
        )}
      </span>
      AUDIO&nbsp;{muted ? 'OFF' : 'ON'}
    </button>
  )
}
