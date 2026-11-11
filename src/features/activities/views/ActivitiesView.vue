<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import AsyncNotice from '@/components/ui/AsyncNotice.vue'
import CalendarEventDialog from '@/features/calendar/components/CalendarEventDialog.vue'
import { calendarApi } from '@/features/calendar/api'
import type { CalendarEvent } from '@/features/calendar/types'
import { tenantApi } from '@/features/tenants/api'
import { can, type Tenant } from '@/features/tenants/types'
import { errorMessage } from '@/lib/feedback'
import { toast } from '@/services/toast'

const tenantId = String(useRoute().params.tenantId)
const tenant = ref<Tenant>()
const events = ref<CalendarEvent[]>([])
const loading = ref(false)
const error = ref('')
const scope = ref<'mine' | 'team'>('mine')
const filter = ref<'pending' | 'overdue' | 'completed' | 'all'>('pending')
const search = ref('')
const dialogOpen = ref(false)
const selected = ref<CalendarEvent | null>(null)
const now = ref(Date.now())
const canCreate = computed(() => can(tenant.value, 'calendar.create') && !!tenant.value?.access?.allows_operational_writes)
const canEdit = computed(() => can(tenant.value, 'calendar.update') && !!tenant.value?.access?.allows_operational_writes)
const canDelete = computed(() => can(tenant.value, 'calendar.delete') && !!tenant.value?.access?.allows_operational_writes)
const canTeam = computed(() => can(tenant.value, 'calendar.team.view'))
const isOverdue = (event: CalendarEvent) => event.status === 'pending' && new Date(event.ends_at).getTime() < now.value
const visible = computed(() => events.value.filter(event => {
  if (filter.value === 'pending' && event.status !== 'pending') return false
  if (filter.value === 'overdue' && !isOverdue(event)) return false
  if (filter.value === 'completed' && event.status !== 'completed') return false
  const query = search.value.trim().toLocaleLowerCase('pt-BR')
  return !query || [event.title, event.description, event.client_name, event.opportunity_title].some(value => value?.toLocaleLowerCase('pt-BR').includes(query))
}).sort((a, b) => {
  if (a.status === 'pending' && b.status !== 'pending') return -1
  if (b.status === 'pending' && a.status !== 'pending') return 1
  return new Date(a.ends_at).getTime() - new Date(b.ends_at).getTime()
}))
const pending = computed(() => events.value.filter(e => e.status === 'pending').length)
const overdue = computed(() => events.value.filter(isOverdue).length)
const completed = computed(() => events.value.filter(e => e.status === 'completed').length)
const dateLabel = (value: string) => new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
let version = 0
async function load() {
  const current = ++version
  loading.value = true
  error.value = ''
  try {
    // Reutiliza a agenda existente: nenhum segundo cadastro de tarefas é criado.
    const response = await calendarApi.list(tenantId, '2000-01-01T00:00:00', '2100-01-01T00:00:00', scope.value)
    if (current === version) {
      events.value = response.data.filter(e => e.type === 'task' || e.type === 'reminder')
      now.value = Date.now()
    }
  } catch (e) { if (current === version) error.value = errorMessage(e) }
  finally { if (current === version) loading.value = false }
}
watch(scope, () => { void load() }, { immediate: true })
void tenantApi.show(tenantId).then(r => { tenant.value = r.data }).catch(e => { error.value = errorMessage(e) })
function create() { selected.value = null; dialogOpen.value = true }
function edit(event: CalendarEvent) { if (scope.value !== 'mine') return; selected.value = event; dialogOpen.value = true }
async function complete(event: CalendarEvent) {
  if (!canEdit.value || scope.value !== 'mine' || event.status !== 'pending') return
  try {
    await calendarApi.update(tenantId, event.id, { status: 'completed' })
    toast.success('Tarefa concluída.')
    await load()
  } catch (e) { toast.error(errorMessage(e)) }
}
function saved() { dialogOpen.value = false; toast.success('Atividade salva.'); void load() }
</script>

<template>
  <AppShell :tenant="tenant" title="Central de atividades" subtitle="Produtividade e acompanhamento">
    <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div><h1 class="text-2xl font-bold text-slate-800">Minhas atividades</h1><p class="mt-1 text-sm text-slate-500">Tarefas e lembretes vinculados à sua agenda comercial.</p></div>
      <button v-if="canCreate && scope === 'mine'" class="primary-button w-auto" @click="create">+ Nova tarefa</button>
    </div>
    <div class="mb-5 grid gap-3 sm:grid-cols-3">
      <button class="rounded-xl border border-stone-200 bg-white p-4 text-left shadow-sm" @click="filter = 'pending'"><span class="text-xs text-slate-500">Pendentes</span><strong class="mt-1 block text-2xl text-slate-800">{{ pending }}</strong></button>
      <button class="rounded-xl border border-orange-200 bg-orange-50 p-4 text-left" @click="filter = 'overdue'"><span class="text-xs text-orange-800">Atrasadas</span><strong class="mt-1 block text-2xl text-orange-800">{{ overdue }}</strong></button>
      <button class="rounded-xl border border-stone-200 bg-white p-4 text-left shadow-sm" @click="filter = 'completed'"><span class="text-xs text-slate-500">Concluídas</span><strong class="mt-1 block text-2xl text-slate-800">{{ completed }}</strong></button>
    </div>
    <div class="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-stone-200 bg-white p-3">
      <input v-model="search" class="field min-w-48 flex-1" aria-label="Buscar atividades" placeholder="Buscar por título, cliente ou oportunidade" />
      <select v-model="filter" class="field w-auto" aria-label="Filtrar situação"><option value="pending">Pendentes</option><option value="overdue">Atrasadas</option><option value="completed">Concluídas</option><option value="all">Todas</option></select>
      <select v-if="canTeam" v-model="scope" class="field w-auto" aria-label="Visualização"><option value="mine">Minhas</option><option value="team">Equipe</option></select>
      <button class="secondary-button" :disabled="loading" @click="load">Atualizar</button>
    </div>
    <AsyncNotice :loading="loading" :error="error" label="Carregando atividades…" @retry="load" />
    <div v-if="!loading && !error" class="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
      <p v-if="!visible.length" class="p-8 text-center text-sm text-slate-500">Nenhuma atividade encontrada para os filtros selecionados.</p>
      <div v-for="event in visible" :key="event.id" class="flex flex-wrap items-center justify-between gap-4 border-b border-stone-100 p-4 last:border-0">
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-2"><strong class="text-sm text-slate-800">{{ event.title }}</strong><span class="rounded-full px-2 py-0.5 text-xs" :class="isOverdue(event) ? 'bg-red-50 text-red-700' : event.status === 'completed' ? 'bg-green-50 text-green-700' : 'bg-stone-100 text-slate-600'">{{ isOverdue(event) ? 'Atrasada' : event.status === 'completed' ? 'Concluída' : event.status === 'cancelled' ? 'Cancelada' : 'Pendente' }}</span><span v-if="event.priority === 'high'" class="text-xs font-semibold text-orange-700">Alta prioridade</span></div>
          <p class="mt-1 text-xs text-slate-500">Prazo: {{ dateLabel(event.ends_at) }}<span v-if="event.client_name"> · {{ event.client_name }}</span><span v-if="event.opportunity_title"> · {{ event.opportunity_title }}</span></p>
          <p v-if="event.description" class="mt-1 line-clamp-2 text-sm text-slate-600">{{ event.description }}</p>
        </div>
        <div v-if="scope === 'mine'" class="flex gap-2">
          <button v-if="canEdit && event.status === 'pending'" class="secondary-button" @click="complete(event)">Concluir</button>
          <button class="secondary-button" @click="edit(event)">{{ canEdit ? 'Editar' : 'Ver detalhes' }}</button>
        </div>
      </div>
    </div>
    <CalendarEventDialog :open="dialogOpen" :tenant-id="tenantId" :event="selected" :date="''" :default-type="'task'" :can-write="canEdit && !!selected || canCreate && !selected" :can-delete="canDelete" @close="dialogOpen = false" @saved="saved" />
  </AppShell>
</template>
