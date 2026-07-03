import { useEffect } from 'react'
import { useStore } from '@/store'

export function useKeyboardShortcuts() {
  const store = useStore()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey

      if (meta && e.key === 'b') { e.preventDefault(); store.toggleSidebar() }
      if (meta && e.key === 'j') { e.preventDefault(); store.toggleTerminal() }
      if (meta && e.key === 'k') { e.preventDefault(); store.setActiveView('new-thread') }
      if (meta && e.key === ',') { e.preventDefault(); store.setActiveView('settings') }

      if (e.ctrlKey && e.key === 'm') {
        e.preventDefault()
        store.toggleOrb()
        if (!store.isOrbVisible) store.toggleOrbConnection()
      }

      if (e.key === 'Escape') {
        if (store.isOrbConnected) store.toggleOrbConnection()
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [store])
}
