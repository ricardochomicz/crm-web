import type { CalendarEvent } from '../types'

export const completedColors: Record<CalendarEvent['type'], string> = {
  meeting: 'bg-blue-50/50 text-blue-800 hover:bg-blue-100',
  call: 'bg-emerald-50/50 text-emerald-800 hover:bg-emerald-100',
  visit: 'bg-orange-50/50 text-orange-800 hover:bg-orange-100',
  task: 'bg-violet-50/50 text-violet-800 hover:bg-violet-100',
  reminder: 'bg-slate-100/50 text-slate-700 hover:bg-slate-200',
}

export const eventStyles: Record<CalendarEvent['type'], { label: string; color: string; dot: string }> = {
  meeting: { label: 'Reunião', color: 'bg-blue-50 text-blue-800 hover:bg-blue-100', dot: 'bg-blue-500' },
  call: { label: 'Ligação', color: 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100', dot: 'bg-emerald-500' },
  visit: { label: 'Visita', color: 'bg-orange-50 text-orange-800 hover:bg-orange-100', dot: 'bg-orange-500' },
  task: { label: 'Tarefa', color: 'bg-violet-50 text-violet-800 hover:bg-violet-100', dot: 'bg-violet-500' },
  reminder: { label: 'Lembrete', color: 'bg-slate-100 text-slate-700 hover:bg-slate-200', dot: 'bg-slate-400' },
}

export const dateKey = (date: Date): string =>
  [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-')

export function isEventOverdue(event: CalendarEvent, now: number): boolean {
  return event.status === 'pending' && new Date(event.ends_at).getTime() < now
}

export function eventStatusLabel(event: CalendarEvent, now: number): string {
  if (event.status === 'completed') return 'Concluído'
  if (event.status === 'cancelled') return 'Cancelado'
  return isEventOverdue(event, now) ? 'Atrasado' : 'Pendente'
}
