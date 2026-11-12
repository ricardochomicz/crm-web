import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { tenantApi } from '@/features/tenants/api'
import { can, type Tenant } from '@/features/tenants/types'
import { calendarApi } from '../api'
import { subscribeActivityChanged } from '../activityEvents'
import type { CalendarEvent } from '../types'
import { completedColors, eventStyles, dateKey, isEventOverdue, eventStatusLabel } from '../utils/calendarPresentation'
import { errorMessage } from '@/lib/feedback'
import { toast } from '@/services/toast'

export function useCalendarPage() {
const tenantId = String(useRoute().params.tenantId)
const tenant = ref<Tenant>()
const month = ref(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
const scope = ref<'mine' | 'team'>('mine')
const events = ref<CalendarEvent[]>([])
const loading = ref(true)
const error = ref('')
const dialogOpen = ref(false)
const selectedEvent = ref<CalendarEvent | null>(null)
const historyEvent = ref<CalendarEvent | null>(null)
const selectedDate = ref('')
const focusedDay = ref('')
const dayDetailsSection = ref<HTMLElement | null>(null)
const now = ref(Date.now())
let clock: ReturnType<typeof setInterval> | undefined
let unsubscribeActivityChanged: (() => void) | undefined
onMounted(() => {
  clock = setInterval(() => { now.value = Date.now() }, 30_000)
  unsubscribeActivityChanged = subscribeActivityChanged(id => { if (id === tenantId) void load() })
})
onUnmounted(() => {
  if (clock) clearInterval(clock)
  unsubscribeActivityChanged?.()
  requestVersion++
})
const isOverdue = (event: CalendarEvent) => isEventOverdue(event, now.value)
const statusLabel = (event: CalendarEvent) => eventStatusLabel(event, now.value)
const dayEvents = computed(() => [...(byDay.value.get(focusedDay.value) ?? [])].sort((a, b) => a.starts_at.localeCompare(b.starts_at)))
const dayTitle = computed(() => new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full' }).format(new Date(`${focusedDay.value}T12:00:00`)))
const eventTime = (value: string) => new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(value))
const canCreate = computed(() => can(tenant.value, 'calendar.create') && !!tenant.value?.access?.allows_operational_writes)
const canEdit = computed(() => can(tenant.value, 'calendar.update') && !!tenant.value?.access?.allows_operational_writes)
const canDelete = computed(() => can(tenant.value, 'calendar.delete') && !!tenant.value?.access?.allows_operational_writes)
const teamAllowed = computed(() => can(tenant.value, 'calendar.team.view') || tenant.value?.access?.role_name?.trim().toLocaleLowerCase('pt-BR') === 'supervisor de equipe')
const title = computed(() => new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(month.value))
focusedDay.value = dateKey(new Date())
const range = computed(() => {
  const first = new Date(month.value.getFullYear(), month.value.getMonth(), 1)
  const last = new Date(month.value.getFullYear(), month.value.getMonth() + 1, 1)
  return { from: dateKey(first) + 'T00:00:00', to: dateKey(last) + 'T00:00:00' }
})
const days = computed(() => {
  const first = new Date(month.value.getFullYear(), month.value.getMonth(), 1)
  const offset = first.getDay()
  const count = new Date(month.value.getFullYear(), month.value.getMonth() + 1, 0).getDate()
  return [...Array(offset).fill(null), ...Array.from({ length: count }, (_, i) => i + 1)] as (number | null)[]
})
const byDay = computed(() => {
  const map = new Map<string, CalendarEvent[]>()
  for (const event of events.value) {
    const key = dateKey(new Date(event.starts_at))
    map.set(key, [...(map.get(key) ?? []), event])
  }
  return map
})
let requestVersion = 0
async function load() {
  const version = ++requestVersion
  loading.value = true
  error.value = ''
  try {
    const response = await calendarApi.list(tenantId, range.value.from, range.value.to, scope.value)
    if (version === requestVersion) events.value = response.data
  } catch (e) { if (version === requestVersion) error.value = errorMessage(e) }
  finally { if (version === requestVersion) loading.value = false }
}
watch([month, scope], () => { void load() }, { immediate: true })
void tenantApi.show(tenantId).then(r => { tenant.value = r.data }).catch(e => { error.value = errorMessage(e) })
function navigate(delta: number) {
  const next = new Date(month.value.getFullYear(), month.value.getMonth() + delta, 1)
  month.value = next
  focusedDay.value = dateKey(next)
}
function create(day: number) {
  if (!canCreate.value || dateKey(new Date(month.value.getFullYear(), month.value.getMonth(), day)) < dateKey(new Date())) return
  selectedEvent.value = null
  selectedDate.value = dateKey(new Date(month.value.getFullYear(), month.value.getMonth(), day))
  dialogOpen.value = true
}
async function selectDay(day: number) {
  focusedDay.value = dateKey(new Date(month.value.getFullYear(), month.value.getMonth(), day))
  await nextTick()
  dayDetailsSection.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
function edit(event: CalendarEvent) {
  if (scope.value === 'team' || !canEdit.value) return
  selectedEvent.value = event
  selectedDate.value = ''
  dialogOpen.value = true
}
function saved() {
  dialogOpen.value = false
  toast.success('Agenda atualizada.')
}

return { tenantId, tenant, month, scope, events, loading, error, dialogOpen, selectedEvent, historyEvent, selectedDate, focusedDay, dayDetailsSection, now, isOverdue, statusLabel, dayEvents, dayTitle, eventTime, canCreate, canEdit, canDelete, teamAllowed, title, range, days, byDay, load, navigate, create, selectDay, edit, saved, dateKey, completedColors, eventStyles }
}
