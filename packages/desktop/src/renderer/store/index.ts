import { create } from 'zustand'
import { getSkillManager } from '@/lib/skills'
import { getMemoryStore } from '@/lib/memory'
import { executePrompt, streamPrompt, getAvailableProviders, getOnlineProviders } from '@/lib/providers/client'
import { ProviderInfo, EBURON_ALIASES, EBURON_DISPLAY_NAMES } from '@/lib/providers/types'

export interface Thread {
  id: string
  title: string
  mode: 'local' | 'worktree' | 'cloud'
  branch?: string
  projectId: string
  sessionId?: string
  createdAt: number
}

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  code?: string
  reasoning?: string
  toolCalls?: { name: string; args: string; result?: string }[]
  timestamp: number
}

export interface SkillDef {
  id: string
  name: string
  description: string
  type: 'system' | 'custom'
  enabled: boolean
  icon: string
}

export interface ModelDef {
  id: string
  name: string
  provider: string
  isDefault?: boolean
}

interface AppState {
  activeView: 'new-thread' | 'chat' | 'automations' | 'skills' | 'settings' | 'memory'
  activeThreadId: string | null
  threads: Thread[]
  messages: Record<string, Message[]>
  skills: SkillDef[]
  models: ModelDef[]
  activeModel: string
  activeMode: 'local' | 'worktree' | 'cloud'
  isSidebarOpen: boolean
  isOrbVisible: boolean
  isOrbConnected: boolean
  theme: 'dark' | 'light'
  isStreaming: boolean
  isTerminalOpen: boolean
  isDiffOpen: boolean
  diffContent: string | null
  engineConnected: boolean
  ollamaConnected: boolean
  availableProviders: ProviderInfo[]
  providerLoading: boolean

  setActiveView: (view: AppState['activeView']) => void
  setActiveThread: (id: string | null) => void
  addThread: (thread: Thread) => void
  removeThread: (id: string) => void
  addMessage: (threadId: string, message: Message) => void
  updateMessage: (threadId: string, msgId: string, updates: Partial<Message>) => void
  toggleSkill: (id: string) => void
  setActiveModel: (id: string) => void
  setActiveMode: (mode: AppState['activeMode']) => void
  toggleSidebar: () => void
  toggleOrb: () => void
  toggleOrbConnection: () => void
  toggleTheme: () => void
  setStreaming: (v: boolean) => void
  toggleTerminal: () => void
  toggleDiff: () => void
  setDiffContent: (content: string | null) => void
  setEngineConnected: (v: boolean) => void
  setOllamaConnected: (v: boolean) => void
  refreshProviders: () => Promise<void>
  sendPrompt: (threadId: string, text: string) => Promise<void>
}

export const useStore = create<AppState>((set, get) => ({
  activeView: 'new-thread',
  activeThreadId: null,
  threads: [],
  messages: {},
  skills: [
    { id: 'ast-indexer', name: 'AST Codebase Indexer', description: 'Automatically builds vector embeddings and semantic syntax trees across your local repository for ultra-fast code retrieval.', type: 'system', enabled: true, icon: 'Code2' },
    { id: 'cve-scanner', name: 'CVE Security Scanner', description: 'Scans code modifications in real-time for SQL injections, XSS vulnerabilities, and outdated package dependencies.', type: 'system', enabled: true, icon: 'Shield' },
    { id: 'react19-migrator', name: 'React 19 Action Migrator', description: 'Specialized refactoring rules converting legacy useEffect hooks and class components directly into React 19 Server Actions.', type: 'custom', enabled: true, icon: 'Layers' },
    { id: 'figma-to-tailwind', name: 'Figma to Tailwind UI', description: 'Translates Figma JSON design tokens and layout hierarchies into accessible, responsive Tailwind CSS JSX structures.', type: 'custom', enabled: false, icon: 'PenTool' },
  ],
  models: EBURON_ALIASES.map((alias) => ({
    id: alias,
    name: EBURON_DISPLAY_NAMES[alias] || alias,
    provider: 'eburon',
    isDefault: alias === 'auto',
  })),
  activeModel: 'auto',
  activeMode: 'local',
  isSidebarOpen: true,
  isOrbVisible: false,
  isOrbConnected: false,
  theme: 'dark',
  isStreaming: false,
  isTerminalOpen: false,
  isDiffOpen: true,
  diffContent: null,
  engineConnected: false,
  ollamaConnected: false,
  availableProviders: [],
  providerLoading: false,

  setActiveView: (view) => set({ activeView: view }),
  setActiveThread: (id) => set({ activeThreadId: id }),
  addThread: (thread) => set((s) => ({ threads: [thread, ...s.threads] })),
  removeThread: (id) => set((s) => ({ threads: s.threads.filter((t) => t.id !== id) })),
  addMessage: (threadId, message) =>
    set((s) => ({
      messages: { ...s.messages, [threadId]: [...(s.messages[threadId] || []), message] },
    })),
  updateMessage: (threadId, msgId, updates) =>
    set((s) => ({
      messages: {
        ...s.messages,
        [threadId]: (s.messages[threadId] || []).map((m) =>
          m.id === msgId ? { ...m, ...updates } : m,
        ),
      },
    })),
  toggleSkill: (id) =>
    set((s) => ({
      skills: s.skills.map((sk) => (sk.id === id ? { ...sk, enabled: !sk.enabled } : sk)),
    })),
  setActiveModel: (id) => set({ activeModel: id }),
  setActiveMode: (mode) => set({ activeMode: mode }),
  toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
  toggleOrb: () => set((s) => ({ isOrbVisible: !s.isOrbVisible })),
  toggleOrbConnection: () => set((s) => ({ isOrbConnected: !s.isOrbConnected })),
  toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
  setStreaming: (v) => set({ isStreaming: v }),
  toggleTerminal: () => set((s) => ({ isTerminalOpen: !s.isTerminalOpen })),
  toggleDiff: () => set((s) => ({ isDiffOpen: !s.isDiffOpen })),
  setDiffContent: (content) => set({ diffContent: content }),
  setEngineConnected: (v) => set({ engineConnected: v }),
  setOllamaConnected: (v) => set({ ollamaConnected: v }),

  refreshProviders: async () => {
    set({ providerLoading: true })
    try {
      const providers = await getAvailableProviders()
      const online = await getOnlineProviders()
      set({
        availableProviders: providers.map((p) => ({
          ...p,
          available: online.includes(p.alias),
        })),
        providerLoading: false,
      })
    } catch {
      set({ providerLoading: false })
    }
  },

  sendPrompt: async (threadId, text) => {
    const state = get()
    const skillMgr = getSkillManager()
    const memStore = getMemoryStore()

    set({ isStreaming: true })

    const assistantMsgId = `msg-${Date.now()}-ai`

    set((s) => ({
      messages: {
        ...s.messages,
        [threadId]: [
          ...(s.messages[threadId] || []),
          { id: assistantMsgId, role: 'assistant', content: '', timestamp: Date.now() },
        ],
      },
    }))

    try {
      const [systemPrompt, projectMemories] = await Promise.all([
        skillMgr.getSystemPrompt(),
        memStore.getByProject('default'),
      ])
      const memoryContext = projectMemories
        .slice(0, 5)
        .map((m: any) => `- [${m.type}] ${m.content}`)
        .join('\n')

      let fullPrompt = text
      if (memoryContext) {
        fullPrompt = `Relevant context from past sessions:\n${memoryContext}\n\nUser: ${text}`
      }

      if (systemPrompt) {
        fullPrompt = `${systemPrompt}\n\n${fullPrompt}`
      }

      const activeModel = state.activeModel
      const provider = activeModel !== 'auto' ? activeModel : undefined

      let aiText = ''

      try {
        const result = await streamPrompt(fullPrompt, provider, (chunk, _prov) => {
          aiText += chunk
          set((s) => ({
            messages: {
              ...s.messages,
              [threadId]: s.messages[threadId].map((m) =>
                m.id === assistantMsgId
                  ? { ...m, content: m.content + chunk }
                  : m,
              ),
            },
          }))
        })

        aiText = result.content || aiText
        set({ engineConnected: true })
      } catch (streamErr: any) {
        if (streamErr.message?.includes('All available Eburon engines failed')) {
          throw streamErr
        }
        try {
          const result = await executePrompt(fullPrompt, provider)
          aiText = result.content
          set({ engineConnected: true })
        } catch (execErr: any) {
          throw execErr
        }
      }

      if (aiText) {
        set((s) => ({
          messages: {
            ...s.messages,
            [threadId]: s.messages[threadId].map((m) =>
              m.id === assistantMsgId
                ? { ...m, content: aiText, code: aiText.includes('```') ? aiText : undefined }
                : m,
            ),
          },
        }))
      }
    } catch (err: any) {
      const errorMsg = err.message?.includes('All available Eburon engines')
        ? 'All available Eburon engines failed to complete the task. Please try again.'
        : `Error: ${err.message || 'Unknown error'}`

      set((s) => ({
        messages: {
          ...s.messages,
          [threadId]: s.messages[threadId].map((m) =>
            m.id === assistantMsgId
              ? { ...m, content: errorMsg }
              : m,
          ),
        },
      }))
    } finally {
      set({ isStreaming: false })
    }
  },
}))
