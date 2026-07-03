import { ProviderConfig, OrchestratorConfig } from './types'

const ALIAS_CONFIG: Record<string, ProviderConfig> = {
  'eburon-sirius': {
    alias: 'eburon-sirius',
    internalName: 'opencode_zen',
    displayName: 'Eburon Sirius',
    contextLimit: 128000,
    timeout: 180000,
    env: {
      OLLAMA_MODEL: 'qwen3.6:latest',
    },
  },
  'eburon-vega': {
    alias: 'eburon-vega',
    internalName: 'codex_ollama',
    displayName: 'Eburon Vega',
    contextLimit: 64000,
    timeout: 120000,
    env: {
      OLLAMA_MODEL: 'gemma4:e4b',
    },
  },
  'eburon-orion': {
    alias: 'eburon-orion',
    internalName: 'claude_ollama',
    displayName: 'Eburon Orion',
    contextLimit: 32000,
    timeout: 90000,
    env: {
      OLLAMA_MODEL: 'ornith:9b',
    },
  },
  'eburon-polaris': {
    alias: 'eburon-polaris',
    internalName: 'freebuff',
    displayName: 'Eburon Polaris',
    contextLimit: 8000,
    timeout: 60000,
    env: {
      OLLAMA_MODEL: 'orbit-ai:latest',
    },
  },
  'eburon-zen': {
    alias: 'eburon-zen',
    internalName: 'opencode_cli',
    displayName: 'Eburon Zen',
    contextLimit: 128000,
    timeout: 120000,
    env: {
      OPENCODE_MODEL: 'opencode/deepseek-v4-flash-free',
    },
  },
  'eburon-breeze': {
    alias: 'eburon-breeze',
    internalName: 'freebuff_cli',
    displayName: 'Eburon Breeze',
    contextLimit: 64000,
    timeout: 90000,
    env: {
      FREEBUFF_MODEL: 'deepseek/deepseek-v4-flash',
      FREEBUFF_HOST: 'http://localhost:8000',
    },
  },
  'eburon-vortex': {
    alias: 'eburon-vortex',
    internalName: 'ollama_cloud',
    displayName: 'Eburon Vortex',
    contextLimit: 128000,
    timeout: 180000,
    env: {
      OLLAMA_CLOUD_MODEL: 'qwen3.6:latest',
      OLLAMA_CLOUD_HOST: 'http://localhost:11434',
    },
  },
}

export function getProviderConfig(alias: string): ProviderConfig | undefined {
  return ALIAS_CONFIG[alias]
}

export function getAllAliases(): string[] {
  return Object.keys(ALIAS_CONFIG)
}

export function getAllConfigs(): ProviderConfig[] {
  return Object.values(ALIAS_CONFIG)
}

export function aliasToInternal(alias: string): string | undefined {
  return ALIAS_CONFIG[alias]?.internalName
}

export function internalToAlias(internalName: string): string | undefined {
  for (const cfg of Object.values(ALIAS_CONFIG)) {
    if (cfg.internalName === internalName) return cfg.alias
  }
  return undefined
}

export function loadOrchestratorConfig(env: Record<string, string | undefined>): OrchestratorConfig {
  const defaultPriority = ['eburon-sirius', 'eburon-vega', 'eburon-zen', 'eburon-breeze', 'eburon-vortex', 'eburon-orion', 'eburon-polaris']
  const envPriority = env['PROVIDER_PRIORITY']
  const priority = envPriority
    ? envPriority.split(',').map((s) => s.trim()).filter((a) => ALIAS_CONFIG[a])
    : defaultPriority

  return {
    defaultMode: env['LLM_PROVIDER'] || 'auto',
    priority: priority.length > 0 ? priority : defaultPriority,
    maxRetries: priority.length,
    maxContextForFallback: 32000,
    compressOnSwitch: true,
  }
}

export function mergeProviderEnv(
  config: ProviderConfig,
  processEnv: Record<string, string | undefined>,
): Record<string, string> {
  const merged: Record<string, string> = { ...config.env }
  for (const key of Object.keys(processEnv)) {
    const val = processEnv[key]
    if (val !== undefined) merged[key] = val
  }
  return merged
}
