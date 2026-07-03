import { useEffect } from 'react'
import { useStore } from '@/store'
import { getAvailableProviders, getOnlineProviders } from '@/lib/providers/client'

export default function ConnectionStatus() {
  const { availableProviders, providerLoading, setEngineConnected, setOllamaConnected } = useStore()

  useEffect(() => {
    const check = async () => {
      try {
        const providers = await getAvailableProviders()
        const online = await getOnlineProviders()
        setEngineConnected(online.length > 0)
        setOllamaConnected(providers.some((p) => p.available))
      } catch {
        setEngineConnected(false)
        setOllamaConnected(false)
      }
    }
    check()
    const i = setInterval(check, 15000)
    return () => clearInterval(i)
  }, [])

  return null
}
