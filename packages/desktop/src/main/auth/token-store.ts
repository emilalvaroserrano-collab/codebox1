import { app, safeStorage } from 'electron'
import * as fs from 'fs/promises'
import * as path from 'path'

const TOKEN_FILE = 'google-oauth-tokens.json'
let memCache: GoogleTokenSet | null = null

export interface GoogleTokenSet {
  accessToken: string
  refreshToken?: string
  scope: string
  tokenType: string
  expiryDate: number // epoch ms
  idToken?: string
}

function tokenPath(): string {
  return path.join(app.getPath('userData'), TOKEN_FILE)
}

export async function saveTokens(tokens: GoogleTokenSet): Promise<void> {
  memCache = tokens
  const json = JSON.stringify(tokens)

  if (safeStorage.isEncryptionAvailable()) {
    const encrypted = safeStorage.encryptString(json)
    await fs.writeFile(tokenPath(), encrypted)
  } else {
    await fs.writeFile(tokenPath() + '.plain', json, 'utf-8')
  }
}

export async function loadTokens(): Promise<GoogleTokenSet | null> {
  if (memCache) return memCache
  try {
    const tp = tokenPath()
    let raw: string
    if (safeStorage.isEncryptionAvailable()) {
      const encrypted = await fs.readFile(tp)
      raw = safeStorage.decryptString(encrypted)
    } else {
      raw = await fs.readFile(tp + '.plain', 'utf-8')
    }
    const tokens = JSON.parse(raw) as GoogleTokenSet
    memCache = tokens
    return tokens
  } catch {
    return null
  }
}

export async function clearTokens(): Promise<void> {
  memCache = null
  try {
    await fs.unlink(tokenPath())
  } catch {}
  try {
    await fs.unlink(tokenPath() + '.plain')
  } catch {}
}

export function isTokenExpired(tokens: GoogleTokenSet): boolean {
  return Date.now() >= tokens.expiryDate - 60000 // 1 min buffer
}
