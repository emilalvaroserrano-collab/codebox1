import { useState, useRef, useEffect } from 'react'
import { useStore } from '@/store'
import { ChevronDown, Star, Zap, Sparkles } from 'lucide-react'
import { EBURON_DISPLAY_NAMES } from '@/lib/providers/types'

const PROVIDER_ICONS: Record<string, typeof Star> = {
  'eburon-sirius': Sparkles,
  'eburon-vega': Zap,
  'eburon-orion': Star,
  'eburon-polaris': Star,
}

const PROVIDER_COLORS: Record<string, string> = {
  'eburon-sirius': 'text-codebox-purple',
  'eburon-vega': 'text-codebox-green',
  'eburon-orion': 'text-codebox-blue',
  'eburon-polaris': 'text-codebox-blue',
  'auto': 'text-codebox-primary',
}

export default function ModelSelector() {
  const { models, activeModel, setActiveModel } = useStore()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const active = models.find((m) => m.id === activeModel) || models[0]

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [])

  const displayName = EBURON_DISPLAY_NAMES[activeModel] || active?.name || 'Eburon'

  return (
    <div className="relative" ref={ref}>
      <button
        className="flex items-center gap-2 bg-codebox-input border border-codebox-border px-3.5 py-1.5 rounded-full text-codebox-primary text-[13px] font-medium cursor-pointer hover:bg-white/5 hover:border-codebox-secondary"
        onClick={() => setOpen(!open)}
      >
        <Star size={14} className="text-codebox-purple" strokeWidth={1.8} />
        <span>{displayName}</span>
        <ChevronDown size={12} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[240px] bg-codebox-sidebar border border-codebox-border rounded-xl p-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.5)] z-50 flex flex-col gap-0.5">
          <div className="px-3 py-2 text-[10px] text-codebox-muted uppercase tracking-[0.04em] font-medium">
            Eburon Engines
          </div>
          {models.map((model) => {
            const Icon = PROVIDER_ICONS[model.id] || Star
            const iconColor = PROVIDER_COLORS[model.id] || 'text-codebox-secondary'
            const isActive = model.id === activeModel

            return (
              <button
                key={model.id}
                className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-[12.5px] w-full text-left bg-transparent border-none hover:bg-white/5 ${
                  isActive ? 'text-codebox-primary bg-white/10' : 'text-codebox-secondary hover:text-codebox-primary'
                }`}
                onClick={() => { setActiveModel(model.id); setOpen(false) }}
              >
                <div className="flex items-center gap-2">
                  <Icon size={14} className={isActive ? iconColor : 'text-codebox-muted'} />
                  <span>{model.name}</span>
                </div>
                {model.isDefault && (
                  <span className="text-[10px] text-codebox-blue">default</span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
