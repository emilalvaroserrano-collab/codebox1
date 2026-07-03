import { initGoogleOAuth, authenticate, signOut, isAuthenticated } from '../auth/google-oauth'
import * as gmail from './gmail'
import * as calendar from './calendar'
import * as drive from './drive'

export const GoogleService = {
  auth: {
    init: (credentialsPath?: string) => initGoogleOAuth(credentialsPath),
    authenticate: () => authenticate(),
    signOut: () => signOut(),
    isAuthenticated: () => isAuthenticated(),
  },
  gmail: {
    listLabels: () => gmail.listLabels(),
    listMessages: (opts?: { maxResults?: number; labelIds?: string[]; query?: string }) =>
      gmail.listMessages(opts),
    getMessage: (messageId: string) => gmail.getMessage(messageId),
    sendMessage: (to: string, subject: string, body: string) => gmail.sendMessage(to, subject, body),
  },
  calendar: {
    listCalendars: () => calendar.listCalendars(),
    listEvents: (opts?: { calendarId?: string; maxResults?: number; timeMin?: string; timeMax?: string }) =>
      calendar.listEvents(opts),
    createEvent: (opts: {
      summary: string
      description?: string
      start: string
      end: string
      location?: string
      attendees?: string[]
    }) => calendar.createEvent(opts),
  },
  drive: {
    listFiles: (opts?: { pageSize?: number; query?: string; orderBy?: string }) =>
      drive.listFiles(opts),
    uploadFile: (opts: { filePath: string; name?: string; mimeType?: string; parentFolderId?: string }) =>
      drive.uploadFile(opts),
    downloadFile: (fileId: string, destPath: string) => drive.downloadFile(fileId, destPath),
    createFolder: (name: string, parentFolderId?: string) => drive.createFolder(name, parentFolderId),
  },
}

export type GoogleServiceApi = typeof GoogleService
