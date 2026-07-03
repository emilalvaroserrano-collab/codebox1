import { SwitchLogEntry, FailReason } from './types'
import { internalToAlias } from './config'

export type LogLevel = 'info' | 'warn' | 'error' | 'switch'

interface InternalLogEntry {
  timestamp: number
  level: LogLevel
  internalMessage: string
  safeMessage: string
  alias?: string
}

const internalLogs: InternalLogEntry[] = []
const switchLogs: SwitchLogEntry[] = []

export class SafeLogger {
  static internal(level: LogLevel, internalMessage: string, safeMessage?: string, alias?: string): void {
    const entry: InternalLogEntry = {
      timestamp: Date.now(),
      level,
      internalMessage,
      safeMessage: safeMessage || internalMessage,
      alias,
    }
    internalLogs.push(entry)
    console.log(`[provider:internal] [${level}] ${internalMessage}`)
  }

  static frontend(alias: string, message: string): void {
    const safeAlias = internalToAlias(alias) || alias
    console.log(`[provider:${safeAlias}] ${message}`)
  }

  static switch(
    failedInternalProvider: string,
    reason: FailReason,
    nextInternalProvider: string,
    success: boolean,
    errorDetail?: string,
  ): void {
    const failedAlias = internalToAlias(failedInternalProvider) || failedInternalProvider
    const nextAlias = internalToAlias(nextInternalProvider) || nextInternalProvider

    const entry: SwitchLogEntry = {
      timestamp: Date.now(),
      failedInternalProvider,
      failedAlias,
      reason,
      nextInternalProvider,
      nextAlias,
      success,
      errorDetail,
    }
    switchLogs.push(entry)

    console.log(
      `[provider:switch] ${failedInternalProvider} -> ${nextInternalProvider} | reason=${reason} | success=${success}`,
    )

    if (!success) {
      console.log(`[provider:frontend] ${failedAlias} reached its limit. Switching to ${nextAlias}.`)
    }
  }

  static getSwitchLogs(): SwitchLogEntry[] {
    return [...switchLogs]
  }

  static getInternalLogs(): InternalLogEntry[] {
    return [...internalLogs]
  }

  static getSafeSwitchMessage(failedAlias: string, nextAlias: string): string {
    return `${failedAlias} reached its limit. Switching to ${nextAlias}.`
  }

  static getAllFailedSafeMessage(aliases: string[]): string {
    return 'All available Eburon engines failed to complete the task. Please try again.'
  }

  static clear(): void {
    internalLogs.length = 0
    switchLogs.length = 0
  }
}
