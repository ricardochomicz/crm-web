<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import AsyncNotice from '@/components/ui/AsyncNotice.vue'
import ListFilters from '@/components/ui/ListFilters.vue'
import ListTable from '@/components/ui/ListTable.vue'
import PagePagination from '@/components/ui/PagePagination.vue'
import SearchSelect from '@/components/ui/SearchSelect.vue'
import CalendarEventHistoryDialog from '@/features/calendar/components/CalendarEventHistoryDialog.vue'
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
const appliedSearch = ref('')
const dialogOpen = ref(false)
const selected = ref<CalendarEvent | null>(null)
const historyEvent = ref<CalendarEvent | null>(null)
const now = ref(Date.now())
const page = ref(1)
const pagination = ref({ current_page: 1, last_page: 1, total: 0, per_page: 20 })
const canCreate = computed(() => can(tenant.value, 'calendar.create') && !!tenant.value?.access?.allows_operational_writes)
const canEdit = computed(() => can(tenant.value, 'calendar.update') && !!tenant.value?.access?.allows_operational_writes)
const canDelete = computed(() => can(tenant.value, 'calendar.delete') && !!tenant.value?.access?.allows_operational_writes)
const canTeam = computed(() => can(tenant.value, 'calendar.team.view'))
const isOverdue = (event: CalendarEvent) => event.status === 'pending' && new Date(event.ends_at).getTime() < now.value
const visible = computed(() => events.value)
const overview = ref({ total: 0, pending: 0, overdue: 0, completed: 0, cancelled: 0 })
const overviewLoading = ref(false)
const overviewError = ref('')
let overviewVersion = 0
async function loadOverview() {
  const current = ++overviewVersion
  overviewLoading.value = true
  overviewError.value = ''
  try {
    const response = await calendarApi.activitiesOverview(tenantId, { scope: scope.value, search: appliedSearch.value })
    if (current === overviewVersion) overview.value = response.data
  } catch (e) {
    if (current === overviewVersion) overviewError.value = errorMessage(e)
  } finally {
    if (current === overviewVersion) overviewLoading.value = false
  }
}
const dateLabel = (value: string) => new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
let version = 0
async function load() {
  const current = ++version
  loading.value = true
  error.value = ''
  try {
    // Reutiliza a agenda existente: nenhum segundo cadastro de tarefas é criado.
    const response = await calendarApi.activities(tenantId, { scope: scope.value, status: filter.value, search: appliedSearch.value, page: page.value, per_page: 20 })
    if (current === version) {
      events.value = response.data
      pagination.value = response.meta
      now.value = Date.now()
    }
  } catch (e) { if (current === version) error.value = errorMessage(e) }
  finally { if (current === version) loading.value = false }
}
watch([scope, filter, appliedSearch], () => {
  if (page.value !== 1) page.value = 1
  else void load()
}, { immediate: true })
watch(page, () => { void load() })
watch([scope, appliedSearch], () => { void loadOverview() }, { immediate: true })
function submitSearch() { const next = search.value.trim(); if (appliedSearch.value !== next) appliedSearch.value = next; else { page.value = 1; void load(); void loadOverview() } }
function clearFilters() { search.value = ''; appliedSearch.value = ''; filter.value = 'all'; scope.value = 'mine'; page.value = 1; void load(); void loadOverview() }
function changePage(value: number) { if (value >= 1 && value <= pagination.value.last_page) page.value = value }
void tenantApi.show(tenantId).then(r => { tenant.value = r.data }).catch(e => { error.value = errorMessage(e) })
function create() { selected.value = null; dialogOpen.value = true }
function edit(event: CalendarEvent) { if (scope.value !== 'mine') return; selected.value = event; dialogOpen.value = true }
async function complete(event: CalendarEvent) {
  if (!canEdit.value || scope.value !== 'mine' || event.status !== 'pending') return
  try {
    await calendarApi.update(tenantId, event.id, { status: 'completed' })
    toast.success('Tarefa concluída.')
    await Promise.all([load(), loadOverview()])
  } catch (e) { toast.error(errorMessage(e)) }
}
function saved() { dialogOpen.value = false; toast.success('Atividade salva.'); void load(); void loadOverview() }
</script>

<template>
  <AppShell :tenant="tenant" title="Central de atividades" subtitle="Produtividade e acompanhamento">
    <header class="mb-7 flex flex-wrap items-center justify-between gap-4">
      <div>
        <p class="eyebrow">PRODUTIVIDADE</p>
        <h1 class="mt-3 text-3xl font-semibold">Central de atividades</h1>
        <p class="mt-2 text-sm text-slate-500">Acompanhe tarefas e lembretes da operação comercial.</p>
      </div>
      <button v-if="canCreate && scope === 'mine'" class="primary-button w-auto" @click="create">+ Nova tarefa</button>
    </header>
    <p v-if="overviewError" role="alert" class="mb-3 text-sm text-red-700">Indicadores indisponíveis: {{ overviewError }} <button type="button" class="font-semibold underline" @click="loadOverview">Tentar novamente</button></p>
    <div class="mb-5 grid gap-3 sm:grid-cols-3">
      <button v-for="item in [{ key: 'pending', label: 'Pendentes', count: overview.pending }, { key: 'overdue', label: 'Atrasadas', count: overview.overdue }, { key: 'completed', label: 'Concluídas', count: overview.completed }]" :key="item.key" type="button" class="rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:border-orange-300" :class="filter === item.key ? 'border-orange-500 ring-1 ring-orange-200' : 'border-stone-200'" @click="filter = item.key as typeof filter">
        <p class="text-sm text-slate-500">{{ item.label }}</p><p class="mt-2 text-2xl font-semibold text-slate-800">{{ overviewLoading ? '…' : overviewError ? '—' : item.count }}</p>
      </button>
    </div>
    <ListFilters :count-label="pagination.total + ' atividade(s) encontrada(s)'" :columns="3" collapsible :initially-collapsed="true" @search="submitSearch" @clear="clearFilters">
      <div><label class="mb-1 block text-xs font-semibold text-slate-600">Título, cliente ou oportunidade</label><input v-model="search" class="field w-full" placeholder="Pesquisar atividades" @keyup.enter="submitSearch" /></div>
      <div><label class="mb-1 block text-xs font-semibold text-slate-600">Situação</label><SearchSelect v-model="filter" :options="[{ value: 'all', label: 'Todas as situações' }, { value: 'pending', label: 'Pendentes' }, { value: 'overdue', label: 'Atrasadas' }, { value: 'completed', label: 'Concluídas' }, { value: 'cancelled', label: 'Canceladas' }]" /></div>
      <div v-if="canTeam"><label class="mb-1 block text-xs font-semibold text-slate-600">Visualização</label><SearchSelect v-model="scope" :options="[{ value: 'mine', label: 'Minhas atividades' }, { value: 'team', label: 'Atividades da equipe' }]" /></div>
    </ListFilters>
    <AsyncNotice :loading="loading" :error="error" label="Carregando atividades…" @retry="load" />
    <section v-if="!loading && !error" class="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
      <ListTable min-width="750px">
        <thead class="bg-stone-50 text-xs font-semibold uppercase text-slate-500">
          <tr><th class="p-4">Atividade</th><th class="p-4">Cliente / Oportunidade</th><th class="p-4">Prazo</th><th class="p-4">Prioridade</th><th class="p-4">Situação</th><th class="p-4 text-right">Ações</th></tr>
        </thead>
        <tbody>
          <tr v-for="event in visible" :key="event.id" class="border-t border-stone-100">
            <td class="p-4"><p class="font-semibold text-slate-800">{{ event.title }}</p><p v-if="event.description" class="mt-1 line-clamp-2 text-xs text-slate-500">{{ event.description }}</p></td>
            <td class="p-4 text-sm">{{ event.client_name || '—' }}<p v-if="event.opportunity_title" class="text-xs text-slate-500">{{ event.opportunity_title }}</p></td>
            <td class="p-4 text-sm" :class="isOverdue(event) ? 'font-semibold text-red-700' : ''">{{ dateLabel(event.ends_at) }}</td>
            <td class="p-4 text-sm">{{ event.priority === 'high' ? 'Alta' : event.priority === 'low' ? 'Baixa' : 'Normal' }}</td>
            <td class="p-4"><span class="rounded-lg px-3 py-1 text-xs font-semibold" :class="isOverdue(event) ? 'bg-red-50 text-red-700' : event.status === 'completed' ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'">{{ isOverdue(event) ? 'Atrasada' : event.status === 'completed' ? 'Concluída' : event.status === 'cancelled' ? 'Cancelada' : 'Pendente' }}</span></td>
            <td class="p-4 text-right"><div v-if="scope === 'mine'" class="flex justify-end gap-2"><button v-if="canEdit && event.status === 'pending'" class="secondary-button w-auto" @click="complete(event)">Concluir</button><button class="secondary-button w-auto" @click="edit(event)">{{ canEdit ? 'Editar' : 'Detalhes' }}</button><button type="button" class="secondary-button w-auto" @click="historyEvent = event">Histórico</button></div></td>
          </tr>
        </tbody>
      </ListTable>
      <p v-if="!visible.length" class="p-6 text-center text-sm text-slate-500">Nenhuma atividade encontrada.</p>
    </section>
    <PagePagination v-if="!loading && !error" :page="page" :last-page="pagination.last_page" :total="pagination.total" :per-page="pagination.per_page" @change="changePage" />
    <CalendarEventHistoryDialog :open="!!historyEvent" :tenant-id="tenantId" :event-id="historyEvent?.id ?? null" :title="historyEvent?.title" @close="historyEvent = null" />
    <CalendarEventDialog :open="dialogOpen" :tenant-id="tenantId" :event="selected" :date="''" :default-type="'task'" :can-write="(canEdit && !!selected) || (canCreate && !selected)" :can-delete="canDelete" @close="dialogOpen = false" @saved="saved" />
  </AppShell>
</template>
