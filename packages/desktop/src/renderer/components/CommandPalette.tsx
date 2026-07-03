import { useState } from 'react'
import { useStore } from '@/store'
import { Search, FileText, Clock, Layers, Settings, Brain, Edit3, Terminal } from 'lucide-react'

interface Command {
  id: string
  label: string
  description: string
  icon: typeof Search
  action: () => void
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const store = useStore()

  const commands: Command[] = [
    { id: 'new-thread', label: 'New Thread', description: 'Start a new conversation', icon: Edit3, action: () => { store.setActiveView('new-thread'); store.setActiveThread(null) } },
    { id: 'skills', label: 'Skills & Capabilities', description: 'Manage agent skills and tools', icon: Layers, action: () => store.setActiveView('skills') },
    { id: 'automations', label: 'Automations', description: 'View scheduled background tasks', icon: Clock, action: () => store.setActiveView('automations') },
    { id: 'memory', label: 'Memory & Profile', description: 'Cross-session learnings', icon: Brain, action: () => store.setActiveView('memory') },
    { id: 'settings', label: 'Settings', description: 'Preferences and configuration', icon: Settings, action: () => store.setActiveView('settings') },
    { id: 'terminal', label: 'Toggle Terminal', description: 'Show/hide integrated terminal', icon: Terminal, action: () => store.toggleTerminal() },
    { id: 'toggle-sidebar', label: 'Toggle Sidebar', description: 'Collapse or expand sidebar', icon: FileText, action: () => store.toggleSidebar() },
    { id: 'toggle-theme', label: 'Toggle Theme', description: 'Switch dark/light mode', icon: Search, action: () => store.toggleTheme() },
  ]

  const filtered = query
    ? commands.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()) || c.description.toLowerCase().includes(query.toLowerCase()))
    : commands

  return (
    <>
      <button
        className="bg-codebox-input border border-codebox-border text-codebox-muted px-3 py-1 rounded-md text-[11px] cursor-pointer hover:text-codebox-primary hover:border-codebox-secondary flex items-center gap-2"
        onClick={() => setOpen(true)}
      >
        <Search size={12} />
        <span>Cmd+K</span>
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-start justify-center pt-[15vh]" onClick={() => setOpen(false)}>
          <div
            className="w-[520px] bg-codebox-sidebar border border-codebox-border rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.7)] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-4 py-3 border-b border-codebox-border">
              <Search size={16} className="text-codebox-muted" />
              <input
                className="flex-1 bg-transparent border-none outline-none text-codebox-primary text-sm"
                placeholder="Search commands..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
              />
              <span className="text-[10px] text-codebox-muted bg-codebox-input px-1.5 py-0.5 rounded">esc</span>
            </div>
            <div className="max-h-[320px] overflow-y-auto py-2">
              {filtered.map((cmd) => {
                const Icon = cmd.icon
                return (
                  <button
                    key={cmd.id}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left bg-transparent border-none text-codebox-secondary text-sm cursor-pointer hover:bg-white/5 hover:text-codebox-primary"
                    onClick={() => { cmd.action(); setOpen(false) }}
                  >
                    <div className="w-8 h-8 rounded-lg bg-codebox-input flex items-center justify-center flex-shrink-0">
                      <Icon size={16} className="text-codebox-purple" />
                    </div>
                    <div>
                      <div className="font-medium text-codebox-primary">{cmd.label}</div>
                      <div className="text-[11px] text-codebox-muted">{cmd.description}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
