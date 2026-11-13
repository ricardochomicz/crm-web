import { computed, ref, watch, type Ref } from 'vue'
import type { CalendarEvent, CalendarEventInput, EventType } from '../types'
import { emptyCalendarForm, localInput } from '../utils/calendarForm'

interface CalendarEventFormDependencies {
  open: Readonly<Ref<boolean>>
  tenantId: Readonly<Ref<string>>
  event: Readonly<Ref<CalendarEvent | null>>
  date: Readonly<Ref<string>>
  opportunityId: Readonly<Ref<string | undefined>>
  clientId: Readonly<Ref<string | undefined>>
  opportunityTitle: Readonly<Ref<string | undefined>>
  defaultType: Readonly<Ref<EventType | undefined>>
  defaultAssigneeId: Readonly<Ref<string | undefined>>
  initialTitle: Readonly<Ref<string | undefined>>
  protocolId: Readonly<Ref<string | undefined>>
  onReset?: () => void
}

export function useCalendarEventForm(deps: CalendarEventFormDependencies) {
  const form = ref<CalendarEventInput>(emptyCalendarForm(''))
  const title = computed(() => deps.event.value ? 'Editar compromisso' : 'Novo compromisso')
  const lockedLink = computed(() => !!deps.opportunityId.value || !!deps.clientId.value)

  watch(
    [
      deps.open,
      deps.tenantId,
      deps.event,
      deps.date,
      deps.opportunityId,
      deps.clientId,
      deps.opportunityTitle,
      deps.defaultType,
      deps.defaultAssigneeId,
      deps.initialTitle,
      deps.protocolId,
    ],
    () => {
      if (!deps.open.value) return

      const event = deps.event.value
      form.value = event
        ? {
            title: event.title,
            description: event.description,
            type: event.type,
            status: event.status,
            priority: event.priority,
            all_day: event.all_day,
            starts_at: localInput(event.starts_at),
            ends_at: localInput(event.ends_at),
            opportunity_id: event.opportunity_id,
            client_id: event.client_id,
            protocol_id: event.protocol_id ?? null,
            tenant_user_id: event.tenant_user_id,
          }
        : {
            ...emptyCalendarForm(deps.date.value),
            type: deps.defaultType.value ?? ('' as EventType),
            opportunity_id: deps.opportunityId.value ?? null,
            client_id: deps.clientId.value ?? null,
            tenant_user_id: deps.defaultAssigneeId.value ?? null,
            protocol_id: deps.protocolId.value ?? null,
            title: deps.initialTitle.value ??
              (deps.opportunityTitle.value ? `Contato: ${deps.opportunityTitle.value}` : ''),
          }

      deps.onReset?.()
    },
    { immediate: true },
  )

  function changeClient(value: string | number) {
    form.value.client_id = String(value || '') || null
    form.value.opportunity_id = null
    if (!deps.protocolId.value) form.value.protocol_id = null
  }

  return { form, title, lockedLink, changeClient }
}
