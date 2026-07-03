export interface SkillDefinition {
  id: string
  name: string
  description: string
  type: string
  enabled: boolean
  icon: string | null
  content: string | null
  successCount: number
  failureCount: number
  lastUsed: string | null
  createdAt: string
}

export interface SkillProposal {
  task: string
  summary: string
  steps: string[]
  tools: string[]
  confidence: number
}

function getDb() {
  const api = (window as any).electronAPI?.db
  if (!api) throw new Error('Database not available. Run the app in Electron.')
  return api
}

export class SkillManager {
  async getAll(): Promise<SkillDefinition[]> {
    return getDb().skill.list()
  }

  async get(id: string): Promise<SkillDefinition | undefined> {
    const skills = await getDb().skill.list()
    return skills.find((s: SkillDefinition) => s.id === id)
  }

  async add(data: { name: string; description?: string; type?: string; content?: string; icon?: string }): Promise<string> {
    const skill = await getDb().skill.create(data)
    return skill.id
  }

  async update(id: string, data: Partial<SkillDefinition>): Promise<void> {
    await getDb().skill.update(id, data)
  }

  async remove(id: string): Promise<void> {
    await getDb().skill.delete(id)
  }

  proposeFromTask(task: string, summary: string, steps: string[], tools: string[]): SkillProposal {
    return { task, summary, steps, tools, confidence: 0.7 }
  }

  async getSystemPrompt(): Promise<string> {
    const skills = await getDb().skill.list()
    const active = skills.filter((s: SkillDefinition) => s.enabled && s.type !== 'learned')
    if (active.length === 0) return ''
    return active.map((s: SkillDefinition) => `## ${s.name}\n${s.content || s.description}`).join('\n\n')
  }
}

let skillManager: SkillManager | null = null
export function getSkillManager(): SkillManager {
  if (!skillManager) skillManager = new SkillManager()
  return skillManager
}
