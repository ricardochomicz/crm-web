import type { CalendarEvent } from '@/features/calendar/types'

export type ActivityUrgency = 'overdue' | 'due-soon' | 'high' | 'normal'

const DAY_IN_MS = 24 * 60 * 60 * 1000

/**
 * Urgency is a presentation concern. The backend remains responsible for
 * tenant visibility, status filtering and pagination.
 */
export function activityUrgency(event: CalendarEvent, now: number): ActivityUrgency {
  if (event.status !== 'pending') return 'normal'

  const deadline = new Date(event.ends_at).getTime()
  if (Number.isFinite(deadline)) {
    if (deadline < now) return 'overdue'
    if (deadline <= now + DAY_IN_MS) return 'due-soon'
  }

  return event.priority === 'high' ? 'high' : 'normal'
}

export const activityUrgencyLabels: Record<ActivityUrgency, string> = {
  overdue: 'Atrasada',
  'due-soon': 'Vence em 24h',
  high: 'Prioridade alta',
  normal: '',
}
