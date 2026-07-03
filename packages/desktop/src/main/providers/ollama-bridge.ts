const OLLAMA_BASE = 'http://localhost:11434'

export async function checkOllamaHealth(): Promise<boolean> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3000)
    const res = await fetch(OLLAMA_BASE, { signal: controller.signal })
    clearTimeout(timeout)
    return res.ok
  } catch {
    return false
  }
}

export async function listOllamaModels(): Promise<string[]> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)
    const res = await fetch(`${OLLAMA_BASE}/api/tags`, { signal: controller.signal })
    clearTimeout(timeout)
    if (!res.ok) return []
    const data = await res.json()
    return (data.models || []).map((m: any) => m.name)
  } catch {
    return []
  }
}
