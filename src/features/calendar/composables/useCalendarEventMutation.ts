import { ref, type Ref } from 'vue'
import { calendarApi } from '../api'
import { errorMessage } from '@/lib/feedback'
import type { CalendarEvent, CalendarEventInput } from '../types'
import { localInput } from '../utils/calendarForm'

interface Dependencies {
  tenantId: Readonly<Ref<string>>
  event: Readonly<Ref<CalendarEvent | null>>
  canWrite: Readonly<Ref<boolean>>
  canDelete: Readonly<Ref<boolean>>
  form: Ref<CalendarEventInput>
  onSaved: () => void
}

export function useCalendarEventMutation({
  tenantId, event, canWrite, canDelete, form, onSaved,
}: Dependencies) {
  const busy = ref(false)
  const error = ref('')

  async function save() {
    if (busy.value || !canWrite.value) return
    if (!form.value.type || !form.value.status || !form.value.priority) {
      error.value = 'Selecione o tipo, a situação e a prioridade.'
      return
    }
    const start = new Date(form.value.starts_at)
    const end = new Date(form.value.ends_at)
    if (Number.isNaN(start.getTime()) || (!event.value && start <= new Date())) {
      error.value = 'Escolha uma data e horário de início futuros.'
      return
    }
    if (Number.isNaN(end.getTime()) || end <= start) {
      error.value = 'O término deve ser posterior ao início.'
      return
    }

    const currentTenant = tenantId.value
    const currentEvent = event.value
    busy.value = true
    error.value = ''
    try {
      if (currentEvent) {
        const changes: Partial<CalendarEventInput> = {
          title: form.value.title,
          description: form.value.description,
          type: form.value.type,
          status: form.value.status,
          priority: form.value.priority,
          all_day: form.value.all_day,
          client_id: form.value.client_id || null,
          opportunity_id: form.value.opportunity_id || null,
          protocol_id: form.value.protocol_id || null,
          ...(form.value.tenant_user_id ? { tenant_user_id: form.value.tenant_user_id } : {}),
        }
        if (form.value.starts_at !== localInput(currentEvent.starts_at)) {
          changes.starts_at = form.value.starts_at
        }
        if (form.value.ends_at !== localInput(currentEvent.ends_at)) {
          changes.ends_at = form.value.ends_at
        }
        await calendarApi.update(currentTenant, currentEvent.id, changes)
      } else {
        const { tenant_user_id, ...values } = form.value
        await calendarApi.create(currentTenant, {
          ...values,
          ...(tenant_user_id ? { tenant_user_id } : {}),
          status: form.value.status || 'pending',
          priority: form.value.priority || 'normal',
        })
      }
      if (currentTenant === tenantId.value && currentEvent?.id === event.value?.id) onSaved()
    } catch (cause) {
      if (currentTenant === tenantId.value) error.value = errorMessage(cause)
    } finally {
      busy.value = false
    }
  }

  async function remove() {
    if (!event.value || !canDelete.value || busy.value || !window.confirm('Excluir este compromisso?')) return
    const currentTenant = tenantId.value
    const currentEvent = event.value
    busy.value = true
    error.value = ''
    try {
      await calendarApi.remove(currentTenant, currentEvent.id)
      if (currentTenant === tenantId.value && currentEvent.id === event.value?.id) onSaved()
    } catch (cause) {
      if (currentTenant === tenantId.value) error.value = errorMessage(cause)
    } finally {
      busy.value = false
    }
  }

  return { busy, error, save, remove }
}
