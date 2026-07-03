import * as fs from 'fs/promises'
import * as path from 'path'

export interface GoogleClientCredentials {
  clientId: string
  clientSecret: string
  redirectUris: string[]
  projectId: string
}

const DEFAULT_CREDENTIALS_PATH = path.join(
  process.env.HOME || process.env.USERPROFILE || '/tmp',
  'Downloads',
  'client_secret_2_464615485897-el0lhfum3rgh7sqj2kq5vrcqiqm1it9h.apps.googleusercontent.com.json',
)

export function getDefaultCredentialsPath(): string {
  return process.env.GOOGLE_OAUTH_CREDENTIALS || DEFAULT_CREDENTIALS_PATH
}

export async function loadClientCredentials(credentialsPath?: string): Promise<GoogleClientCredentials> {
  const p = credentialsPath || getDefaultCredentialsPath()
  const raw = await fs.readFile(p, 'utf-8')
  const parsed = JSON.parse(raw)

  const web = parsed.web || parsed.installed || parsed
  return {
    clientId: web.client_id,
    clientSecret: web.client_secret,
    redirectUris: web.redirect_uris || [],
    projectId: web.project_id || '',
  }
}
