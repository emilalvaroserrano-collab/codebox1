import { google } from 'googleapis'
import * as fs from 'fs/promises'
import { getUserClient, refreshIfNeeded } from '../auth/google-oauth'

export interface DriveFile {
  id: string
  name: string
  mimeType: string
  size?: string
  createdTime?: string
  modifiedTime?: string
  webViewLink?: string
  parents?: string[]
}

export async function listFiles(opts?: {
  pageSize?: number
  query?: string
  orderBy?: string
}): Promise<DriveFile[]> {
  await refreshIfNeeded()
  const drive = google.drive({ version: 'v3', auth: getUserClient() })
  const res = await drive.files.list({
    pageSize: opts?.pageSize || 20,
    q: opts?.query,
    orderBy: opts?.orderBy || 'modifiedTime desc',
    fields: 'files(id,name,mimeType,size,createdTime,modifiedTime,webViewLink,parents)',
  })

  return (res.data.files || []).map((f) => ({
    id: f.id!,
    name: f.name!,
    mimeType: f.mimeType!,
    size: f.size || undefined,
    createdTime: f.createdTime || undefined,
    modifiedTime: f.modifiedTime || undefined,
    webViewLink: f.webViewLink || undefined,
    parents: f.parents || undefined,
  }))
}

export async function uploadFile(opts: {
  filePath: string
  name?: string
  mimeType?: string
  parentFolderId?: string
}): Promise<DriveFile> {
  await refreshIfNeeded()
  const drive = google.drive({ version: 'v3', auth: getUserClient() })
  const content = await fs.readFile(opts.filePath)

  const res = await drive.files.create({
    requestBody: {
      name: opts.name || opts.filePath.split('/').pop() || 'untitled',
      mimeType: opts.mimeType,
      parents: opts.parentFolderId ? [opts.parentFolderId] : undefined,
    },
    media: {
      mimeType: opts.mimeType || 'application/octet-stream',
      body: content,
    },
    fields: 'id,name,mimeType,size,createdTime,modifiedTime,webViewLink,parents',
  })

  return {
    id: res.data.id!,
    name: res.data.name!,
    mimeType: res.data.mimeType!,
    size: res.data.size || undefined,
    createdTime: res.data.createdTime || undefined,
    modifiedTime: res.data.modifiedTime || undefined,
    webViewLink: res.data.webViewLink || undefined,
    parents: res.data.parents || undefined,
  }
}

export async function downloadFile(fileId: string, destPath: string): Promise<string> {
  await refreshIfNeeded()
  const drive = google.drive({ version: 'v3', auth: getUserClient() })
  const res = await drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'stream' },
  )

  return new Promise((resolve, reject) => {
    const dest = require('fs').createWriteStream(destPath)
    res.data
      .on('end', () => {
        dest.end()
        resolve(destPath)
      })
      .on('error', reject)
      .pipe(dest)
  })
}

export async function createFolder(name: string, parentFolderId?: string): Promise<DriveFile> {
  await refreshIfNeeded()
  const drive = google.drive({ version: 'v3', auth: getUserClient() })
  const res = await drive.files.create({
    requestBody: {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentFolderId ? [parentFolderId] : undefined,
    },
    fields: 'id,name,mimeType,createdTime,webViewLink,parents',
  })

  return {
    id: res.data.id!,
    name: res.data.name!,
    mimeType: res.data.mimeType!,
    createdTime: res.data.createdTime || undefined,
    webViewLink: res.data.webViewLink || undefined,
    parents: res.data.parents || undefined,
  }
}
