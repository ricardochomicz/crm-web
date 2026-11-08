<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import CalendarEventDialog from '@/features/calendar/components/CalendarEventDialog.vue'
import { calendarApi } from '@/features/calendar/api'
import type { CalendarEvent } from '@/features/calendar/types'
import { tenantApi } from '@/features/tenants/api'
import { can, type Tenant } from '@/features/tenants/types'
import { errorMessage } from '@/lib/feedback'
import { toast } from '@/services/toast'

const props = defineProps<{ tenantId: string; opportunityId: string; clientId: string; title: string }>()
const tenant = ref<Tenant>()
const events = ref<CalendarEvent[]>([])
const loading = ref(false)
const error = ref('')
const dialogOpen = ref(false)
const selected = ref<CalendarEvent | null>(null)
const canCreate = computed(() => can(tenant.value, 'calendar.create') && !!tenant.value?.access?.allows_operational_writes)
const canEdit = computed(() => can(tenant.value, 'calendar.update') && !!tenant.value?.access?.allows_operational_writes)
const canDelete = computed(() => can(tenant.value, 'calendar.delete') && !!tenant.value?.access?.allows_operational_writes)
const ordered = computed(() => [...events.value].sort((a, b) => a.starts_at.localeCompare(b.starts_at)))
const dateLabel = (value: string) => new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
const typeLabels: Record<string, string> = { meeting: 'Reunião', call: 'Ligação', visit: 'Visita', task: 'Tarefa', reminder: 'Lembrete' }
const statusLabels: Record<string, string> = { pending: 'Pendente', completed: 'Concluído', cancelled: 'Cancelado' }
let version = 0
async function load() {
  const current = ++version
  loading.value = true
  error.value = ''
  try {
    const result = await calendarApi.forOpportunity(props.tenantId, props.opportunityId)
    if (current === version) events.value = result.data
  } catch (e) { if (current === version) error.value = errorMessage(e) }
  finally { if (current === version) loading.value = false }
}
watch(() => [props.tenantId, props.opportunityId], () => { void load() }, { immediate: true })
watch(() => props.tenantId, () => {
  tenant.value = undefined
  void tenantApi.show(props.tenantId).then(r => { tenant.value = r.data }).catch(e => { error.value = errorMessage(e) })
}, { immediate: true })
function create() { selected.value = null; dialogOpen.value = true }
function edit(event: CalendarEvent) { selected.value = event; dialogOpen.value = true }
function saved() { dialogOpen.value = false; toast.success('Agendamento atualizado.'); void load() }
</script>
<template>
  <section class="space-y-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div><h3 class="text-lg font-semibold text-slate-900">Agendamentos da oportunidade</h3><p class="mt-1 text-sm text-slate-500">Ligações, reuniões, visitas e retornos vinculados à negociação.</p></div>
      <button v-if="canCreate" type="button" class="primary-button w-auto" @click="create">+ Novo agendamento</button>
    </div>
    <p v-if="loading" class="text-sm text-slate-500">Carregando agendamentos…</p>
    <div v-if="error" role="alert" class="rounded-xl bg-red-50 p-4 text-sm text-red-700">{{ error }} <button type="button" class="ml-2 font-semibold underline" @click="load">Tentar novamente</button></div>
    <p v-if="!loading && !error && !ordered.length" class="rounded-xl border border-dashed border-stone-300 p-8 text-center text-sm text-slate-500">Nenhum agendamento registrado nesta oportunidade.</p>
    <div v-for="event in ordered" :key="event.id" class="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-stone-200 bg-white p-4">
      <div class="space-y-1"><p class="font-semibold text-slate-900">{{ event.title }}</p><p class="text-sm text-slate-600">{{ typeLabels[event.type] ?? event.type }} · {{ dateLabel(event.starts_at) }} – {{ dateLabel(event.ends_at) }}</p><p class="text-xs text-slate-500">{{ statusLabels[event.status] ?? event.status }}</p><p v-if="event.description" class="whitespace-pre-wrap text-sm text-slate-600">{{ event.description }}</p></div>
      <button v-if="canEdit" type="button" class="secondary-button w-auto" @click="edit(event)">Editar</button>
    </div>
    <CalendarEventDialog :open="dialogOpen" :tenant-id="tenantId" :event="selected" date="" :opportunity-id="opportunityId" :client-id="clientId" :opportunity-title="title" :can-write="selected ? canEdit : canCreate" :can-delete="canDelete" @close="dialogOpen = false" @saved="saved" />
  </section>
</template>
