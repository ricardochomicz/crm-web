<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import AsyncNotice from '@/components/ui/AsyncNotice.vue'
import CalendarEventDialog from '../components/CalendarEventDialog.vue'
import { tenantApi } from '@/features/tenants/api'
import { can, type Tenant } from '@/features/tenants/types'
import { calendarApi } from '../api'
import type { CalendarEvent } from '../types'
import { errorMessage } from '@/lib/feedback'
import { toast } from '@/services/toast'

const tenantId = String(useRoute().params.tenantId)
const tenant = ref<Tenant>()
const month = ref(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
const scope = ref<'mine' | 'team'>('mine')
const events = ref<CalendarEvent[]>([])
const loading = ref(true)
const error = ref('')
const dialogOpen = ref(false)
const selectedEvent = ref<CalendarEvent | null>(null)
const selectedDate = ref('')
const canCreate = computed(() => can(tenant.value, 'calendar.create') && !!tenant.value?.access?.allows_operational_writes)
const canEdit = computed(() => can(tenant.value, 'calendar.update') && !!tenant.value?.access?.allows_operational_writes)
const canDelete = computed(() => can(tenant.value, 'calendar.delete') && !!tenant.value?.access?.allows_operational_writes)
const teamAllowed = computed(() => can(tenant.value, 'calendar.team.view') || tenant.value?.access?.role_name?.trim().toLocaleLowerCase('pt-BR') === 'supervisor de equipe')
const title = computed(() => new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(month.value))
const dateKey = (date: Date) => [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-')
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
  month.value = new Date(month.value.getFullYear(), month.value.getMonth() + delta, 1)
}
function create(day: number) {
  if (!canCreate.value || dateKey(new Date(month.value.getFullYear(), month.value.getMonth(), day)) < dateKey(new Date())) return
  selectedEvent.value = null
  selectedDate.value = dateKey(new Date(month.value.getFullYear(), month.value.getMonth(), day))
  dialogOpen.value = true
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
  void load()
}
</script>
<template>
  <AppShell :tenant="tenant" title="Agenda" subtitle="Organização de compromissos">
    <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div><h1 class="text-2xl font-bold capitalize text-slate-800">{{ title }}</h1><p class="mt-1 text-sm text-slate-500">Compromissos e atividades da empresa</p></div>
      <button v-if="canCreate && scope === 'mine' && new Date(month.getFullYear(), month.getMonth() + 1, 0) >= new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())" class="primary-button w-auto" @click="create(new Date().getMonth() === month.getMonth() && new Date().getFullYear() === month.getFullYear() ? new Date().getDate() : (new Date(month.getFullYear(), month.getMonth(), 1) < new Date(new Date().getFullYear(), new Date().getMonth(), 1) ? new Date().getDate() : 1))">Novo compromisso</button>
    </div>
    <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div class="flex gap-2"><button class="secondary-button" aria-label="Mês anterior" @click="navigate(-1)">Anterior</button><button class="secondary-button" @click="month = new Date(new Date().getFullYear(), new Date().getMonth(), 1)">Hoje</button><button class="secondary-button" aria-label="Próximo mês" @click="navigate(1)">Próximo</button></div>
      <div v-if="teamAllowed" class="flex rounded-xl bg-stone-100 p-1"><button class="rounded-lg px-4 py-2 text-sm" :class="scope === 'mine' ? 'bg-white font-semibold shadow-sm' : ''" @click="scope = 'mine'">Minha agenda</button><button class="rounded-lg px-4 py-2 text-sm" :class="scope === 'team' ? 'bg-white font-semibold shadow-sm' : ''" @click="scope = 'team'">Equipe</button></div>
    </div>
    <AsyncNotice :loading="loading" :error="error" label="Carregando agenda…" @retry="load" />
    <section v-if="!loading && !error" aria-label="Calendário mensal" class="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
      <div class="grid grid-cols-7 border-b border-stone-200 bg-stone-50 text-center text-xs font-semibold text-slate-500"><div v-for="name in ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']" :key="name" class="py-3">{{ name }}</div></div>
      <div class="grid grid-cols-7">
        <div v-for="(day, index) in days" :key="index" class="min-h-28 border-b border-r border-stone-100 p-1.5 sm:min-h-36 sm:p-2" :class="{ 'bg-stone-50/70': day && dateKey(new Date(month.getFullYear(), month.getMonth(), day)) < dateKey(new Date()) }">
          <template v-if="day">
            <button type="button" class="mb-1 flex size-7 items-center justify-center rounded-full text-xs font-semibold hover:bg-orange-100" :class="dateKey(new Date(month.getFullYear(), month.getMonth(), day)) === dateKey(new Date()) ? 'bg-orange-600 text-white hover:bg-orange-700' : 'text-slate-700'" :disabled="!canCreate || scope === 'team' || dateKey(new Date(month.getFullYear(), month.getMonth(), day)) < dateKey(new Date())" :aria-label="`Adicionar compromisso no dia ${day}`" @click="create(day)">{{ day }}</button>
            <button v-for="event in (byDay.get(dateKey(new Date(month.getFullYear(), month.getMonth(), day))) ?? []).slice(0, 3)" :key="event.id" type="button" class="mb-1 block w-full truncate rounded-md bg-orange-50 px-1.5 py-1 text-left text-[11px] font-medium text-orange-800 hover:bg-orange-100" :disabled="scope === 'team' || !canEdit" :title="event.title" @click="edit(event)">{{ event.title }}</button>
            <p v-if="(byDay.get(dateKey(new Date(month.getFullYear(), month.getMonth(), day))) ?? []).length > 3" class="text-[10px] text-slate-500">Mais compromissos…</p>
          </template>
        </div>
      </div>
    </section>
    <CalendarEventDialog :open="dialogOpen" :tenant-id="tenantId" :event="selectedEvent" :date="selectedDate" :can-write="selectedEvent ? canEdit : canCreate" :can-delete="canDelete" @close="dialogOpen = false" @saved="saved" />
  </AppShell>
</template>
