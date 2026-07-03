type ElectronAPI = {
  google: {
    auth: {
      init: (credentialsPath?: string) => Promise<boolean>
      authenticate: () => Promise<boolean>
      signOut: () => Promise<void>
      isAuthenticated: () => Promise<boolean>
    }
    gmail: {
      listLabels: () => Promise<any[]>
      listMessages: (opts?: { maxResults?: number; labelIds?: string[]; query?: string }) => Promise<any[]>
      getMessage: (messageId: string) => Promise<any>
      sendMessage: (to: string, subject: string, body: string) => Promise<string>
    }
    calendar: {
      listCalendars: () => Promise<any[]>
      listEvents: (opts?: { calendarId?: string; maxResults?: number; timeMin?: string; timeMax?: string }) => Promise<any[]>
      createEvent: (opts: { summary: string; description?: string; start: string; end: string; location?: string; attendees?: string[] }) => Promise<any>
    }
    drive: {
      listFiles: (opts?: { pageSize?: number; query?: string; orderBy?: string }) => Promise<any[]>
      uploadFile: (opts: { filePath: string; name?: string; mimeType?: string; parentFolderId?: string }) => Promise<any>
      downloadFile: (fileId: string, destPath: string) => Promise<string>
      createFolder: (name: string, parentFolderId?: string) => Promise<any>
    }
  }
}

function getGoogle(): ElectronAPI['google'] | null {
  return (window as any).electronAPI?.google || null
}

export const googleService = {
  auth: {
    init: (credentialsPath?: string) => getGoogle()?.auth.init(credentialsPath) ?? Promise.resolve(false),
    authenticate: () => getGoogle()?.auth.authenticate() ?? Promise.resolve(false),
    signOut: () => getGoogle()?.auth.signOut() ?? Promise.resolve(),
    isAuthenticated: () => getGoogle()?.auth.isAuthenticated() ?? Promise.resolve(false),
  },
  gmail: {
    listLabels: () => getGoogle()?.gmail.listLabels() ?? Promise.resolve([]),
    listMessages: (opts?: { maxResults?: number; labelIds?: string[]; query?: string }) =>
      getGoogle()?.gmail.listMessages(opts) ?? Promise.resolve([]),
    getMessage: (messageId: string) => getGoogle()?.gmail.getMessage(messageId) ?? Promise.resolve(null),
    sendMessage: (to: string, subject: string, body: string) =>
      getGoogle()?.gmail.sendMessage(to, subject, body) ?? Promise.reject(new Error('Google API not available')),
  },
  calendar: {
    listCalendars: () => getGoogle()?.calendar.listCalendars() ?? Promise.resolve([]),
    listEvents: (opts?: { calendarId?: string; maxResults?: number; timeMin?: string; timeMax?: string }) =>
      getGoogle()?.calendar.listEvents(opts) ?? Promise.resolve([]),
    createEvent: (opts: { summary: string; description?: string; start: string; end: string; location?: string; attendees?: string[] }) =>
      getGoogle()?.calendar.createEvent(opts) ?? Promise.reject(new Error('Google API not available')),
  },
  drive: {
    listFiles: (opts?: { pageSize?: number; query?: string; orderBy?: string }) =>
      getGoogle()?.drive.listFiles(opts) ?? Promise.resolve([]),
    uploadFile: (opts: { filePath: string; name?: string; mimeType?: string; parentFolderId?: string }) =>
      getGoogle()?.drive.uploadFile(opts) ?? Promise.reject(new Error('Google API not available')),
    downloadFile: (fileId: string, destPath: string) =>
      getGoogle()?.drive.downloadFile(fileId, destPath) ?? Promise.reject(new Error('Google API not available')),
    createFolder: (name: string, parentFolderId?: string) =>
      getGoogle()?.drive.createFolder(name, parentFolderId) ?? Promise.reject(new Error('Google API not available')),
  },
}
