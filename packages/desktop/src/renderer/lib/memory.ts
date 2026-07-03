export interface Memory {
  id: string
  type: string
  project: string
  content: string
  confidence: number
  sourceSession: string | null
  accessCount: number
  createdAt: string
  updatedAt: string
}

function getDb() {
  const api = (window as any).electronAPI?.db
  if (!api) throw new Error('Database not available. Run the app in Electron.')
  return api
}

export class MemoryStore {
  async add(data: { type: string; content: string; project?: string; sourceSession?: string; confidence?: number }): Promise<string> {
    const mem = await getDb().memory.create(data)
    return mem.id
  }

  async search(query: string, project?: string): Promise<Memory[]> {
    return getDb().memory.search(query, project)
  }

  async getByProject(project: string): Promise<Memory[]> {
    return getDb().memory.list(project)
  }

  async getAll(): Promise<Memory[]> {
    return getDb().memory.list()
  }
}

let memoryStore: MemoryStore | null = null
export function getMemoryStore(): MemoryStore {
  if (!memoryStore) memoryStore = new MemoryStore()
  return memoryStore
}
