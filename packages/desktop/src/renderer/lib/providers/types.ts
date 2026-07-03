export type EburonAlias = 'eburon-sirius' | 'eburon-vega' | 'eburon-orion' | 'eburon-polaris' | 'eburon-zen' | 'eburon-breeze' | 'eburon-vortex' | 'auto'

export interface ProviderInfo {
  alias: string
  displayName: string
  contextLimit: number
  available: boolean
}

export interface SwitchEvent {
  timestamp: number
  failedAlias: string
  reason: string
  nextAlias: string
  success: boolean
}

export interface ResponseResult {
  content: string
  tokensUsed?: number
  finishReason?: string
  modelUsed?: string
}

export const EBURON_ALIASES: EburonAlias[] = [
  'eburon-sirius',
  'eburon-vega',
  'eburon-orion',
  'eburon-polaris',
  'eburon-zen',
  'eburon-breeze',
  'eburon-vortex',
  'auto',
]

export const EBURON_DISPLAY_NAMES: Record<string, string> = {
  'eburon-sirius': 'Eburon Sirius',
  'eburon-vega': 'Eburon Vega',
  'eburon-orion': 'Eburon Orion',
  'eburon-polaris': 'Eburon Polaris',
  'eburon-zen': 'Eburon Zen',
  'eburon-breeze': 'Eburon Breeze',
  'eburon-vortex': 'Eburon Vortex',
  'auto': 'Auto (Best Available)',
}

export const EBURON_DEFAULT_PRIORITY: EburonAlias[] = [
  'eburon-sirius',
  'eburon-vega',
  'eburon-zen',
  'eburon-breeze',
  'eburon-vortex',
  'eburon-orion',
  'eburon-polaris',
]
