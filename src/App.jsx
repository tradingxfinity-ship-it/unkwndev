import { useState } from 'react'
import EntryGate from './components/EntryGate.jsx'
import Hero from './components/Hero.jsx'

export default function App() {
  // The entry gate is the only thing between page load and the hero.
  // Its long "ENTER TO JOIN" button doubles as the loading animation.
  const [entered, setEntered] = useState(false)

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black text-neon-500">
      {/* Hero mounts immediately under the gate so its entrance animations
          are already mid-flight when the gate fades off. */}
      <Hero entered={entered} />
      {!entered && <EntryGate onEnter={() => setEntered(true)} />}
    </div>
  )
}
