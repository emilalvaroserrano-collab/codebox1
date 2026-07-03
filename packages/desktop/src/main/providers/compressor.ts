import { LLMContext } from './types'

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 3.5)
}

export function compressContext(context: LLMContext, targetTokens: number): LLMContext {
  const totalTokens = estimateContextTokens(context)
  if (totalTokens <= targetTokens) return context

  const systemPrompt = context.systemPrompt || ''
  const systemTokens = estimateTokens(systemPrompt)
  const availableForMessages = targetTokens - systemTokens

  if (availableForMessages <= 0) {
    const truncatedSystem = truncateText(systemPrompt, targetTokens)
    return { messages: [], systemPrompt: truncatedSystem }
  }

  const messages = [...context.messages]
  const resultMessages: typeof messages = []
  let usedTokens = 0

  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i]
    const msgTokens = estimateTokens(msg.content)
    if (usedTokens + msgTokens <= availableForMessages) {
      resultMessages.unshift(msg)
      usedTokens += msgTokens
    } else if (usedTokens < availableForMessages) {
      const remaining = availableForMessages - usedTokens
      const truncated = truncateText(msg.content, remaining)
      resultMessages.unshift({ ...msg, content: truncated })
      break
    } else {
      break
    }
  }

  return {
    ...context,
    messages: resultMessages,
    systemPrompt,
  }
}

export function summarizeContext(context: LLMContext): string {
  const parts: string[] = []

  if (context.systemPrompt) {
    parts.push(`[System instructions: ${truncateText(context.systemPrompt, 200)}]`)
  }

  const recentMessages = context.messages.slice(-5)
  for (const msg of recentMessages) {
    const role = msg.role === 'assistant' ? 'Assistant' : 'User'
    const content = truncateText(msg.content, 300)
    parts.push(`[${role}: ${content}]`)
  }

  const olderCount = context.messages.length - recentMessages.length
  if (olderCount > 0) {
    parts.push(`[${olderCount} earlier messages omitted for context compression]`)
  }

  return parts.join('\n')
}

function estimateContextTokens(context: LLMContext): number {
  let tokens = 0
  if (context.systemPrompt) tokens += estimateTokens(context.systemPrompt)
  for (const msg of context.messages) {
    tokens += estimateTokens(msg.content)
  }
  return tokens
}

function truncateText(text: string, maxTokens: number): string {
  const maxChars = maxTokens * 3.5
  if (text.length <= maxChars) return text
  const half = Math.floor(maxChars / 2)
  return text.slice(0, half) + '\n\n[...content truncated...]\n\n' + text.slice(-half)
}
