import { google } from 'googleapis'
import { getUserClient, refreshIfNeeded } from '../auth/google-oauth'

export interface GmailLabel {
  id: string
  name: string
  type: string
  messageTotalEstimate?: number
}

export interface GmailMessage {
  id: string
  threadId: string
  from: string
  to: string
  subject: string
  snippet: string
  date: string
  labels: string[]
  body?: string
}

export async function listLabels(): Promise<GmailLabel[]> {
  await refreshIfNeeded()
  const gmail = google.gmail({ version: 'v1', auth: getUserClient() })
  const res = await gmail.users.labels.list({ userId: 'me' })
  return (res.data.labels || []).map((l) => ({
    id: l.id!,
    name: l.name!,
    type: l.type!,
    messageTotalEstimate: l.messagesTotal ?? undefined,
  }))
}

export async function listMessages(opts?: { maxResults?: number; labelIds?: string[]; query?: string }): Promise<GmailMessage[]> {
  await refreshIfNeeded()
  const gmail = google.gmail({ version: 'v1', auth: getUserClient() })
  const listRes = await gmail.users.messages.list({
    userId: 'me',
    maxResults: opts?.maxResults || 20,
    labelIds: opts?.labelIds,
    q: opts?.query,
  })

  const ids = (listRes.data.messages || []).map((m) => m.id!).filter(Boolean)
  if (ids.length === 0) return []

  const messages = await Promise.all(
    ids.map(async (id) => {
      const detail = await gmail.users.messages.get({ userId: 'me', id, format: 'metadata' })
      const headers = detail.data.payload?.headers || []
      const from = headers.find((h) => h.name === 'From')?.value || ''
      const to = headers.find((h) => h.name === 'To')?.value || ''
      const subject = headers.find((h) => h.name === 'Subject')?.value || ''
      const date = headers.find((h) => h.name === 'Date')?.value || ''

      return {
        id: detail.data.id!,
        threadId: detail.data.threadId!,
        from,
        to,
        subject,
        snippet: detail.data.snippet || '',
        date,
        labels: detail.data.labelIds || [],
      } as GmailMessage
    }),
  )

  return messages
}

export async function getMessage(messageId: string): Promise<GmailMessage> {
  await refreshIfNeeded()
  const gmail = google.gmail({ version: 'v1', auth: getUserClient() })
  const detail = await gmail.users.messages.get({ userId: 'me', id: messageId, format: 'full' })
  const headers = detail.data.payload?.headers || []
  const from = headers.find((h) => h.name === 'From')?.value || ''
  const to = headers.find((h) => h.name === 'To')?.value || ''
  const subject = headers.find((h) => h.name === 'Subject')?.value || ''
  const date = headers.find((h) => h.name === 'Date')?.value || ''

  let body = ''
  if (detail.data.payload?.parts) {
    const part = detail.data.payload.parts.find((p) => p.mimeType === 'text/plain')
    if (part?.body?.data) {
      body = Buffer.from(part.body.data, 'base64url').toString('utf-8')
    }
  } else if (detail.data.payload?.body?.data) {
    body = Buffer.from(detail.data.payload.body.data, 'base64url').toString('utf-8')
  }

  return {
    id: detail.data.id!,
    threadId: detail.data.threadId!,
    from,
    to,
    subject,
    snippet: detail.data.snippet || '',
    date,
    labels: detail.data.labelIds || [],
    body,
  }
}

export async function sendMessage(to: string, subject: string, body: string): Promise<string> {
  await refreshIfNeeded()
  const gmail = google.gmail({ version: 'v1', auth: getUserClient() })

  const utf8Subject = `=?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`
  const messageParts = [
    `To: ${to}`,
    `Subject: ${utf8Subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=utf-8',
    'Content-Transfer-Encoding: base64',
    '',
    Buffer.from(body).toString('base64'),
  ]
  const encoded = Buffer.from(messageParts.join('\n'))
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

  const res = await gmail.users.messages.send({ userId: 'me', requestBody: { raw: encoded } })
  return res.data.id!
}
