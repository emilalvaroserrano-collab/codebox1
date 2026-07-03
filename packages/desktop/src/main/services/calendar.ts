import { google } from 'googleapis'
import { getUserClient, refreshIfNeeded } from '../auth/google-oauth'

export interface CalendarEvent {
  id: string
  summary: string
  description?: string
  start: string
  end: string
  location?: string
  attendees?: string[]
  creator?: string
  htmlLink?: string
}

export interface CalendarList {
  id: string
  summary: string
  primary?: boolean
}

export async function listCalendars(): Promise<CalendarList[]> {
  await refreshIfNeeded()
  const calendar = google.calendar({ version: 'v3', auth: getUserClient() })
  const res = await calendar.calendarList.list()
  return (res.data.items || []).map((c) => ({
    id: c.id!,
    summary: c.summary!,
    primary: c.primary || false,
  }))
}

export async function listEvents(opts?: {
  calendarId?: string
  maxResults?: number
  timeMin?: string
  timeMax?: string
}): Promise<CalendarEvent[]> {
  await refreshIfNeeded()
  const calendar = google.calendar({ version: 'v3', auth: getUserClient() })
  const res = await calendar.events.list({
    calendarId: opts?.calendarId || 'primary',
    maxResults: opts?.maxResults || 20,
    timeMin: opts?.timeMin || new Date().toISOString(),
    timeMax: opts?.timeMax,
    singleEvents: true,
    orderBy: 'startTime',
  })

  return (res.data.items || []).map((e: any) => ({
    id: e.id!,
    summary: e.summary || '(no title)',
    description: e.description ?? undefined,
    start: e.start?.dateTime || e.start?.date || '',
    end: e.end?.dateTime || e.end?.date || '',
    location: e.location ?? undefined,
    attendees: e.attendees?.map((a: any) => a.email!),
    creator: e.creator?.email ?? undefined,
    htmlLink: e.htmlLink ?? undefined,
  }))
}

export async function createEvent(opts: {
  summary: string
  description?: string
  start: string
  end: string
  location?: string
  attendees?: string[]
  calendarId?: string
}): Promise<CalendarEvent> {
  await refreshIfNeeded()
  const calendar = google.calendar({ version: 'v3', auth: getUserClient() })
  const res = await calendar.events.insert({
    calendarId: opts.calendarId || 'primary',
    requestBody: {
      summary: opts.summary,
      description: opts.description,
      start: { dateTime: opts.start, timeZone: 'UTC' },
      end: { dateTime: opts.end, timeZone: 'UTC' },
      location: opts.location,
      attendees: opts.attendees?.map((email) => ({ email })),
    },
  })

  return {
    id: res.data.id!,
    summary: res.data.summary!,
    description: res.data.description ?? undefined,
    start: res.data.start?.dateTime || res.data.start?.date || '',
    end: res.data.end?.dateTime || res.data.end?.date || '',
    location: res.data.location ?? undefined,
    attendees: res.data.attendees?.map((a) => a.email!),
    creator: res.data.creator?.email ?? undefined,
    htmlLink: res.data.htmlLink ?? undefined,
  }
}
