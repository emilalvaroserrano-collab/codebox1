import { useStore } from '@/store'
import ModelSelector from '@/components/composer/ModelSelector'

export function WelcomeScreen() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 max-w-[420px] text-center">
      {/* Eburon Codebox logo */}
      <svg className="w-14 h-14 text-codebox-primary mb-1" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M48 44H18c-6.6 0-12-5.4-12-12 0-5.8 4.2-10.7 9.8-11.8C17.4 13.5 23.8 8 31.5 8c8.5 0 15.5 6.3 16.4 14.5C53.5 23.7 58 28.3 58 34c0 5.5-4.5 10-10 10z"/>
        <path d="M25 29l5 5-5 5"/><line x1="33" y1="39" x2="41" y2="39"/>
      </svg>

      {/* Welcome title */}
      <h1 className="text-[22px] font-medium text-codebox-primary tracking-[-0.02em]">
        Let's build
      </h1>
      <p className="text-[13px] text-codebox-muted -mt-2">
        Eburon Codebox v0.1 is ready. Start typing or use the voice orb.
      </p>

      {/* Model selector with relative wrapper for absolute dropdown positioning */}
      <div className="relative w-full flex justify-center pt-4">
        <ModelSelector />
      </div>
    </div>
  )
}
