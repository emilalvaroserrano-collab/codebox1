import { useEffect, useRef, useState, useCallback } from 'react'
import { Check } from 'lucide-react'

let showToastFn: ((msg: string) => void) | null = null

export function showToast(msg: string) {
  showToastFn?.(msg)
}

export default function Toast() {
  const [visible, setVisible] = useState(false)
  const [message, setMessage] = useState('')
  const timer = useRef<ReturnType<typeof setTimeout>>()

  const show = useCallback((msg: string) => {
    setMessage(msg)
    setVisible(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setVisible(false), 2500)
  }, [])

  useEffect(() => {
    showToastFn = show
    return () => { showToastFn = null }
  }, [show])

  return (
    <div
      className={`fixed top-5 right-5 bg-codebox-input border border-codebox-border px-4 py-2.5 rounded-lg text-codebox-primary text-xs shadow-[0_10px_25px_rgba(0,0,0,0.4)] flex items-center gap-2 z-[10000] pointer-events-none transition-all duration-200 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2.5'
      }`}
    >
      <Check size={16} className="text-codebox-green" />
      <span>{message}</span>
    </div>
  )
}
