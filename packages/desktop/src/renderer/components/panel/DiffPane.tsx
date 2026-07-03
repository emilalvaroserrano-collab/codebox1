import { useStore } from '@/store'
import { X, GitCommit } from 'lucide-react'

export default function DiffPane() {
  const { isDiffOpen, toggleDiff, diffContent } = useStore()

  if (!isDiffOpen) {
    return (
      <button
        className="fixed right-4 top-14 bg-codebox-card border border-codebox-border text-codebox-secondary px-3 py-1.5 rounded-md text-xs cursor-pointer hover:text-codebox-primary hover:bg-white/5 z-20"
        onClick={toggleDiff}
      >
        Show Diff
      </button>
    )
  }

  return (
    <div className="fixed right-0 top-12 bottom-[120px] w-[420px] bg-codebox-sidebar border-l border-codebox-border flex flex-col z-20">
      <div className="flex items-center justify-between px-4 py-3 border-b border-codebox-border">
        <div className="flex items-center gap-2 text-codebox-primary text-[13px] font-medium">
          <GitCommit size={14} />
          <span>Changes</span>
        </div>
        <button
          className="bg-transparent border-none text-codebox-secondary cursor-pointer p-1 rounded hover:bg-white/5 hover:text-codebox-primary"
          onClick={toggleDiff}
        >
          <X size={16} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 font-mono text-xs leading-relaxed">
        {diffContent ? (
          <pre className="text-codebox-primary whitespace-pre-wrap">{diffContent}</pre>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="text-codebox-muted text-center py-8">
              No changes yet. Send a prompt to see the diff.
            </div>
            <SampleDiff />
          </div>
        )}
      </div>
    </div>
  )
}

function SampleDiff() {
  return (
    <div className="flex flex-col gap-1 text-xs">
      <div className="flex items-center gap-2 text-codebox-muted mb-2">
        <span className="font-medium">src/lib/engine.ts</span>
        <span className="text-[10px]">+12 −3</span>
      </div>
      <div className="text-codebox-muted">@@ -1,7 +1,16 @@</div>
      <div className="text-codebox-muted">{' import type { Session } from \'./types\''}</div>
      <div className="text-codebox-muted"> </div>
      <div className="text-codebox-green">{'+import { getSkillManager } from \'./skills\''}</div>
      <div className="text-codebox-green">{'+import { getMemoryStore } from \'./memory\''}</div>
      <div className="text-codebox-green">+</div>
      <div className="text-codebox-muted">{' export class CodeboxAgent {'}</div>
      <div className="text-codebox-muted">{'   private session: Session | null = null'}</div>
      <div className="text-codebox-green">{'+  private skills = getSkillManager()'}</div>
      <div className="text-codebox-green">{'+  private memory = getMemoryStore()'}</div>
      <div className="text-codebox-green">+</div>
      <div className="text-codebox-green">+  async process(prompt: string) {'{'}</div>
      <div className="text-codebox-green">+    const ctx = this.memory.search(prompt).slice(0, 3)</div>
      <div className="text-codebox-green">+    const sysPrompt = this.skills.getSystemPrompt()</div>
      <div className="text-codebox-green">+    const fullPrompt = [sysPrompt, ...ctx.map(m {'=>'} m.content), prompt].filter(Boolean).join('\n\n')</div>
      <div className="text-codebox-green">+    return this.engine.prompt(fullPrompt)</div>
      <div className="text-codebox-green">+  {'}'}</div>
      <div className="text-codebox-muted"> </div>
      <div className="text-codebox-muted">   async createSession(title?: string) {'{'}</div>
    </div>
  )
}
