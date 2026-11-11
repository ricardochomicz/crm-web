<script setup lang="ts">
import { ref, watch } from 'vue'
import AppDialog from '@/components/ui/AppDialog.vue'
import AsyncNotice from '@/components/ui/AsyncNotice.vue'
import { calendarApi, type CalendarEventHistoryEntry } from '../api'
import { errorMessage } from '@/lib/feedback'

const props = defineProps<{ open: boolean; tenantId: string; eventId: string | null; title?: string }>()
const emit = defineEmits<{ close: [] }>()
const entries = ref<CalendarEventHistoryEntry[]>([])
const loading = ref(false)
const error = ref('')
let requestVersion = 0

async function load() {
  const version = ++requestVersion
  if (!props.open || !props.eventId) return
  loading.value = true
  error.value = ''
  try {
    const result = await calendarApi.history(props.tenantId, props.eventId)
    if (version === requestVersion) entries.value = result.data
  } catch (e) {
    if (version === requestVersion) error.value = errorMessage(e)
  } finally {
    if (version === requestVersion) loading.value = false
  }
}
watch(() => [props.open, props.eventId, props.tenantId] as const, () => {
  if (props.open && props.eventId) void load()
  else { requestVersion++; entries.value = []; error.value = ''; loading.value = false }
}, { immediate: true })

const labels: Record<string, string> = {
  created: 'Atividade criada', updated: 'Atividade atualizada',
  reassigned: 'Responsável alterado', completed: 'Atividade concluída',
  deleted: 'Atividade excluída',
}
const fields: Record<string, string> = {
  title: 'Título', type: 'Tipo', status: 'Situação', priority: 'Prioridade',
  tenant_user_id: 'Responsável', client_id: 'Cliente', opportunity_id: 'Oportunidade',
  starts_at: 'Início', ends_at: 'Término',
}
const values: Record<string, string> = {
  pending: 'Pendente', completed: 'Concluída', cancelled: 'Cancelada',
  low: 'Baixa', normal: 'Normal', high: 'Alta',
  meeting: 'Reunião', call: 'Ligação', visit: 'Visita', task: 'Tarefa', reminder: 'Lembrete',
}
function display(value: unknown, field: string): string {
  if (value === null || value === undefined || value === '') return 'Não informado'
  if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') return 'Alterado'
  const text = String(value)
  if (values[text]) return values[text]
  if (field === 'starts_at' || field === 'ends_at') {
    const date = new Date(text)
    if (!Number.isNaN(date.getTime())) return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(date)
  }
  return text
}
function dateLabel(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(date)
}
</script>

<template>
  <AppDialog :open="open" title="Histórico da atividade" :description="title || 'Movimentações registradas no CRM'" size="wide" @close="emit('close')">
    <AsyncNotice :loading="loading" :error="error" label="Carregando histórico…" @retry="load" />
    <p v-if="!loading && !error && !entries.length" class="rounded-xl bg-stone-50 p-6 text-center text-sm text-slate-500">Nenhuma movimentação registrada para esta atividade.</p>
    <ol v-if="!loading && !error && entries.length" class="relative ml-2 border-l-2 border-stone-200 pb-2">
      <li v-for="entry in entries" :key="entry.id" class="relative mb-5 ml-6 last:mb-0">
        <span class="absolute -left-[31px] top-1.5 size-3 rounded-full border-2 border-white bg-orange-500" />
        <div class="rounded-xl border border-stone-200 bg-white p-4">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <strong class="text-sm text-slate-800">{{ labels[entry.action] || 'Movimentação' }}</strong>
            <time class="text-xs text-slate-500" :datetime="entry.created_at">{{ dateLabel(entry.created_at) }}</time>
          </div>
          <p class="mt-1 text-xs text-slate-500">Por {{ entry.actor_name }}</p>
          <ul v-if="entry.changes && Object.keys(entry.changes).length" class="mt-3 space-y-2">
            <li v-for="(change, field) in entry.changes" :key="field" class="rounded-lg bg-stone-50 p-2 text-xs">
              <span class="font-semibold text-slate-700">{{ fields[field] || field }}:</span>
              <span class="ml-1 text-slate-500">{{ display(change.from, String(field)) }}</span>
              <span class="mx-1 text-orange-600">→</span>
              <span class="text-slate-800">{{ display(change.to, String(field)) }}</span>
            </li>
          </ul>
        </div>
      </li>
    </ol>
    <div class="mt-5 flex justify-end"><button type="button" class="secondary-button" @click="emit('close')">Fechar</button></div>
  </AppDialog>
</template>
