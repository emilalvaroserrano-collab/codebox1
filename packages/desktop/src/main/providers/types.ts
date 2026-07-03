import { ChildProcess } from 'child_process'

export type ProviderStatus = 'available' | 'unavailable' | 'rate_limited' | 'quota_exceeded' | 'timeout'

export type FailReason =
  | 'token_limit'
  | 'context_window_exceeded'
  | 'usage_quota'
  | 'rate_limited'
  | 'timeout'
  | 'empty_response'
  | 'invalid_response'
  | 'provider_unavailable'
  | 'cli_command_failure'
  | 'task_incomplete'

export interface LLMContext {
  messages: { role: string; content: string }[]
  systemPrompt?: string
  maxTokens?: number
}

export interface LLMResponse {
  content: string
  tokensUsed?: number
  finishReason?: string
  modelUsed?: string
}

export interface ProviderInfo {
  status: ProviderStatus
  contextLimit: number
  lastError?: string
  lastUsed?: number
}

export interface SwitchLogEntry {
  timestamp: number
  failedInternalProvider: string
  failedAlias: string
  reason: FailReason
  nextInternalProvider: string
  nextAlias: string
  success: boolean
  errorDetail?: string
}

export interface ProviderAdapter {
  readonly internalName: string
  readonly alias: string
  readonly displayName: string
  readonly contextLimit: number
  isAvailable(): Promise<boolean>
  execute(prompt: string, context?: LLMContext): Promise<LLMResponse>
  stream(prompt: string, context?: LLMContext): AsyncGenerator<string, void, undefined>
}

export interface ProviderConfig {
  alias: string
  internalName: string
  displayName: string
  contextLimit: number
  timeout: number
  env: Record<string, string>
  cliCommand?: string
  cliArgs?: string[]
}

export interface OrchestratorConfig {
  defaultMode: 'auto' | string
  priority: string[]
  maxRetries: number
  maxContextForFallback: number
  compressOnSwitch: boolean
}
