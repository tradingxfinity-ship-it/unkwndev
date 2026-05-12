import { useState } from 'react'
import Hero from './components/Hero.jsx'
import Preloader from './components/Preloader.jsx'

export default function App() {
  const [booted, setBooted] = useState(false)

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black text-neon-500">
      {/* Hero mounts immediately under the preloader so its entrance
          animations are already mid-flight when the preloader wipes off. */}
      <Hero />
      {!booted && <Preloader onDone={() => setBooted(true)} />}
    </div>
  )
}
