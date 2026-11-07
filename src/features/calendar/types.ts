export type EventType = 'meeting' | 'call' | 'visit' | 'task' | 'reminder'
export type EventStatus = 'pending' | 'completed' | 'cancelled'
export type EventPriority = 'low' | 'normal' | 'high'
export interface CalendarEvent {
  id: string
  tenant_user_id: string
  client_id: string | null
  title: string
  description: string | null
  type: EventType
  status: EventStatus
  priority: EventPriority
  all_day: boolean
  starts_at: string
  ends_at: string
}
export interface CalendarEventInput {
  title: string
  description: string | null
  type: EventType
  status: EventStatus
  priority: EventPriority
  all_day: boolean
  starts_at: string
  ends_at: string
}
