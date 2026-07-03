import { useState } from 'react'
import { Globe, X, ExternalLink, RefreshCw } from 'lucide-react'

export default function BrowserPane() {
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState('http://localhost:3000')
  const [loading, setLoading] = useState(false)
  const [key, setKey] = useState(0)

  const handleGo = () => {
    setLoading(true)
    setKey((k) => k + 1)
  }

  if (!open) {
    return (
      <button
        className="fixed right-4 bottom-4 bg-codebox-card border border-codebox-border text-codebox-secondary px-3 py-1.5 rounded-md text-xs cursor-pointer hover:text-codebox-primary hover:bg-white/5 z-30 flex items-center gap-2"
        onClick={() => setOpen(true)}
      >
        <Globe size={14} /> Preview
      </button>
    )
  }

  return (
    <div className="fixed right-0 top-12 bottom-[120px] w-[480px] bg-codebox-sidebar border-l border-codebox-border flex flex-col z-20">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-codebox-border">
        <Globe size={14} className="text-codebox-secondary" />
        <input
          className="flex-1 bg-codebox-input border border-codebox-border text-codebox-primary px-2 py-1 rounded-md outline-none text-xs font-mono"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleGo()}
        />
        <button
          className="bg-transparent border-none text-codebox-secondary cursor-pointer p-1 rounded hover:bg-white/5 hover:text-codebox-primary"
          onClick={handleGo}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
        <button
          className="bg-transparent border-none text-codebox-secondary cursor-pointer p-1 rounded hover:bg-white/5 hover:text-codebox-primary"
          onClick={() => window.open(url, '_blank')}
        >
          <ExternalLink size={14} />
        </button>
        <button
          className="bg-transparent border-none text-codebox-secondary cursor-pointer p-1 rounded hover:bg-white/5 hover:text-codebox-red"
          onClick={() => setOpen(false)}
        >
          <X size={14} />
        </button>
      </div>

      <div className="flex-1 relative bg-white">
        <iframe
          key={key}
          src={url}
          className="w-full h-full border-none"
          sandbox="allow-scripts allow-same-origin allow-forms"
          onLoad={() => setLoading(false)}
          onError={() => setLoading(false)}
        />
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-codebox-bg/80">
            <RefreshCw size={24} className="animate-spin text-codebox-purple" />
          </div>
        )}
      </div>

      <div className="px-3 py-1.5 border-t border-codebox-border text-[10px] text-codebox-muted flex items-center justify-between">
        <span>Sandboxed preview — no cookies, no extensions</span>
        <span className="flex items-center gap-1">
          <span className={`w-1.5 h-1.5 rounded-full ${loading ? 'bg-yellow-400' : 'bg-codebox-green'}`} />
          {loading ? 'Loading' : 'Connected'}
        </span>
      </div>
    </div>
  )
}
