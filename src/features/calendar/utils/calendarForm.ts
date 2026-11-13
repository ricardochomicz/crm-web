import type { CalendarEventInput, EventType } from '../types'

export function localInput(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value.slice(0, 16)
  const pad = (number: number) => String(number).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function emptyCalendarForm(date: string): CalendarEventInput {
  const now = new Date()
  const earliest = new Date(now.getTime() + 60_000)
  earliest.setSeconds(0, 0)
  const proposed = new Date(`${date}T09:00`)
  const start = localInput((proposed > earliest ? proposed : earliest).toISOString())
  const end = localInput(new Date(new Date(start).getTime() + 3_600_000).toISOString())
  return {
    title: '',
    description: null,
    type: '' as EventType,
    status: 'pending',
    priority: 'normal',
    all_day: false,
    starts_at: start,
    ends_at: end,
  }
}
