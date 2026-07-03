import { ProviderAdapter, LLMContext, LLMResponse, FailReason, SwitchLogEntry, OrchestratorConfig } from './types'
import { getProviderConfig, loadOrchestratorConfig, internalToAlias, aliasToInternal } from './config'
import { SafeLogger } from './logger'
import { compressContext, summarizeContext, estimateTokens } from './compressor'
import { OpencodeZenAdapter } from './adapters/opencode-zen'
import { CodexOllamaAdapter } from './adapters/codex-ollama'
import { ClaudeOllamaAdapter } from './adapters/claude-ollama'
import { FreebuffAdapter } from './adapters/freebuff'
import { OpencodeCliAdapter } from './adapters/opencode-cli'
import { FreebuffCliAdapter } from './adapters/freebuff-cli'
import { OllamaCloudAdapter } from './adapters/ollama-cloud'

export class ProviderOrchestrator {
  private adapters: Map<string, ProviderAdapter> = new Map()
  private config: OrchestratorConfig
  private switchHistory: SwitchLogEntry[] = []

  constructor(processEnv: Record<string, string | undefined> = {}) {
    this.config = loadOrchestratorConfig(processEnv)
    this.initializeAdapters(processEnv)
  }

  private initializeAdapters(env: Record<string, string | undefined>): void {
    const aliases = this.config.priority
    for (const alias of aliases) {
      const cfg = getProviderConfig(alias)
      if (!cfg) {
        SafeLogger.internal('warn', `Unknown provider alias: ${alias}`)
        continue
      }

      let adapter: ProviderAdapter
      switch (cfg.internalName) {
        case 'opencode_zen':
          adapter = new OpencodeZenAdapter(cfg, env)
          break
        case 'codex_ollama':
          adapter = new CodexOllamaAdapter(cfg, env)
          break
        case 'claude_ollama':
          adapter = new ClaudeOllamaAdapter(cfg, env)
          break
        case 'freebuff':
          adapter = new FreebuffAdapter(cfg, env)
          break
        case 'opencode_cli':
          adapter = new OpencodeCliAdapter(cfg, env)
          break
        case 'freebuff_cli':
          adapter = new FreebuffCliAdapter(cfg, env)
          break
        case 'ollama_cloud':
          adapter = new OllamaCloudAdapter(cfg, env)
          break
        default:
          SafeLogger.internal('warn', `No adapter for internal name: ${cfg.internalName}`)
          continue
      }

      this.adapters.set(alias, adapter)
      SafeLogger.internal('info', `Registered adapter: ${alias} -> ${cfg.internalName}`)
    }
  }

  resolveActiveProvider(requestedProvider?: string): string {
    if (requestedProvider && requestedProvider !== 'auto') {
      if (this.adapters.has(requestedProvider)) {
        return requestedProvider
      }
      SafeLogger.internal('warn', `Requested provider ${requestedProvider} not registered, falling back to auto`)
    }
    return this.config.priority[0]
  }

  getAvailableProviders(): string[] {
    return [...this.adapters.keys()]
  }

  getProviderCount(): number {
    return this.adapters.size
  }

  getSwitchHistory(): SwitchLogEntry[] {
    return [...this.switchHistory]
  }

  async execute(
    prompt: string,
    context?: LLMContext,
    requestedProvider?: string,
    streamCallback?: (chunk: string, provider: string) => void,
  ): Promise<LLMResponse> {
    const startAlias = this.resolveActiveProvider(requestedProvider)
    const priority = this.buildPriorityOrder(startAlias)
    const tried: string[] = []
    const errors: Error[] = []

    for (let i = 0; i < priority.length; i++) {
      const alias = priority[i]
      const adapter = this.adapters.get(alias)

      if (!adapter) {
        SafeLogger.internal('warn', `Adapter not found for alias: ${alias}`)
        continue
      }

      tried.push(alias)

      const isAvailable = await adapter.isAvailable()
      if (!isAvailable) {
        const reason: FailReason = 'provider_unavailable'
        const nextAlias = priority[i + 1] || 'none'
        const nextInternal = nextAlias !== 'none' ? (aliasToInternal(nextAlias) || 'none') : 'none'

        this.logSwitch(adapter.internalName, reason, nextInternal, false, 'Provider unavailable')
        SafeLogger.frontend(alias, `${alias} is not available.`)
        continue
      }

      try {
        let effectiveContext = context

        if (effectiveContext && i > 0 && this.config.compressOnSwitch) {
          const contextTokens = estimateContext(
            effectiveContext.messages.map((m) => m.content).join('\n'),
          )
          if (contextTokens > adapter.contextLimit) {
            effectiveContext = compressContext(effectiveContext, adapter.contextLimit)
            SafeLogger.internal('info', `Compressed context from ~${contextTokens} to ~${adapter.contextLimit} tokens for ${alias}`)
          }
        }

        if (streamCallback) {
          let fullContent = ''

          for await (const chunk of adapter.stream(prompt, effectiveContext)) {
            fullContent += chunk
            streamCallback(chunk, alias)
          }

          return {
            content: fullContent,
            tokensUsed: estimateTokens(prompt + fullContent),
            finishReason: 'stop',
            modelUsed: alias,
          }
        }

        const response = await adapter.execute(prompt, effectiveContext)

        if (i > 0) {
          const prevAlias = priority[i - 1]
          const prevAdapter = this.adapters.get(prevAlias)
          if (prevAdapter) {
            this.logSwitch(prevAdapter.internalName, 'provider_unavailable', adapter.internalName, true)
          }
        }

        return response
      } catch (err: any) {
        errors.push(err)
        const reason = this.classifyError(err.message)
        const nextAlias = priority[i + 1]
        const nextInternal = nextAlias ? (aliasToInternal(nextAlias) || 'none') : 'none'

        this.logSwitch(adapter.internalName, reason, nextInternal, false, err.message)
        SafeLogger.frontend(alias, `${alias} reached its limit. Switching to ${nextAlias || 'none'}.`)

        if (!nextAlias) break
      }
    }

    this.logAllFailed()
    const message = SafeLogger.getAllFailedSafeMessage(tried)
    throw new Error(message)
  }

  async *stream(
    prompt: string,
    context?: LLMContext,
    requestedProvider?: string,
  ): AsyncGenerator<{ chunk: string; provider: string }, void, undefined> {
    const startAlias = this.resolveActiveProvider(requestedProvider)
    const priority = this.buildPriorityOrder(startAlias)
    const tried: string[] = []

    for (let i = 0; i < priority.length; i++) {
      const alias = priority[i]
      const adapter = this.adapters.get(alias)

      if (!adapter) continue

      tried.push(alias)

      const isAvailable = await adapter.isAvailable()
      if (!isAvailable) {
        const reason: FailReason = 'provider_unavailable'
        const nextAlias = priority[i + 1] || 'none'
        const nextInternal = nextAlias !== 'none' ? (aliasToInternal(nextAlias) || 'none') : 'none'
        this.logSwitch(adapter.internalName, reason, nextInternal, false, 'Provider unavailable')
        continue
      }

      try {
        let effectiveContext = context
        if (effectiveContext && i > 0 && this.config.compressOnSwitch) {
          const contextTokens = estimateContext(
            effectiveContext.messages.map((m) => m.content).join('\n'),
          )
          if (contextTokens > adapter.contextLimit) {
            effectiveContext = compressContext(effectiveContext, adapter.contextLimit)
          }
        }

        for await (const chunk of adapter.stream(prompt, effectiveContext)) {
          yield { chunk, provider: alias }
        }

        if (i > 0) {
          const prevAlias = priority[i - 1]
          const prevAdapter = this.adapters.get(prevAlias)
          if (prevAdapter) {
            this.logSwitch(prevAdapter.internalName, 'provider_unavailable', adapter.internalName, true)
          }
        }

        return
      } catch (err: any) {
        const reason = this.classifyError(err.message)
        const nextAlias = priority[i + 1]
        const nextInternal = nextAlias ? (aliasToInternal(nextAlias) || 'none') : 'none'
        this.logSwitch(adapter.internalName, reason, nextInternal, false, err.message)
        SafeLogger.frontend(alias, `${alias} reached its limit. Switching to ${nextAlias || 'none'}.`)

        if (!nextAlias) break
      }
    }

    this.logAllFailed()
    throw new Error('All available Eburon engines failed to complete the task. Please try again.')
  }

  async checkAvailability(): Promise<Record<string, boolean>> {
    const result: Record<string, boolean> = {}
    for (const [alias, adapter] of this.adapters) {
      result[alias] = await adapter.isAvailable()
    }
    return result
  }

  private buildPriorityOrder(startAlias: string): string[] {
    const idx = this.config.priority.indexOf(startAlias)
    if (idx === -1) return this.config.priority
    return [...this.config.priority.slice(idx), ...this.config.priority.slice(0, idx)]
  }

  private classifyError(message: string): FailReason {
    const upper = message.toUpperCase()
    if (upper.includes('TOKEN_LIMIT') || upper.includes('MAX_TOKENS')) return 'token_limit'
    if (upper.includes('CONTEXT_WINDOW') || upper.includes('CONTEXT_LENGTH') || upper.includes('TOO_LONG')) return 'context_window_exceeded'
    if (upper.includes('USAGE_QUOTA') || upper.includes('QUOTA') || upper.includes('EXCEEDED')) return 'usage_quota'
    if (upper.includes('RATE_LIMIT') || upper.includes('RATE LIMITED') || upper.includes('429')) return 'rate_limited'
    if (upper.includes('TIMEOUT') || upper.includes('ABORT')) return 'timeout'
    if (upper.includes('EMPTY_RESPONSE')) return 'empty_response'
    if (upper.includes('INVALID_RESPONSE')) return 'invalid_response'
    if (upper.includes('PROVIDER_UNAVAILABLE') || upper.includes('UNAVAILABLE') || upper.includes('ECONNREFUSED')) return 'provider_unavailable'
    if (upper.includes('CLI_COMMAND_FAILURE') || upper.includes('COMMAND_FAILED') || upper.includes('ENOENT')) return 'cli_command_failure'
    return 'task_incomplete'
  }

  private logSwitch(
    failedInternal: string,
    reason: FailReason,
    nextInternal: string,
    success: boolean,
    errorDetail?: string,
  ): void {
    SafeLogger.switch(failedInternal, reason, nextInternal, success, errorDetail)
  }

  private logAllFailed(): void {
    SafeLogger.internal('error', 'All providers exhausted', 'All Eburon engines failed')
  }
}

let orchestratorInstance: ProviderOrchestrator | null = null

export function getOrchestrator(): ProviderOrchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new ProviderOrchestrator(process.env as Record<string, string | undefined>)
  }
  return orchestratorInstance
}

export function createOrchestrator(env: Record<string, string | undefined>): ProviderOrchestrator {
  orchestratorInstance = new ProviderOrchestrator(env)
  return orchestratorInstance
}

function estimateContext(text: string): number {
  return Math.ceil(text.length / 3.5)
}
