<script setup lang="ts">
import { ref, watch } from 'vue'
import { opportunitiesApi, type OpportunityForecastChange } from '../api'
import { errorMessage } from '@/lib/feedback'

const props = defineProps<{ tenantId: string; opportunityId: string }>()
const changes = ref<OpportunityForecastChange[]>([])
const page = ref(0)
const lastPage = ref(1)
const loading = ref(false)
const error = ref('')
let sequence = 0

function dateBr(date: string | null): string {
  if (!date) return 'Não informada'
  const value = date.slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value.split('-').reverse().join('/') : value
}
function dateTimeBr(value: string | null): string {
  if (!value) return 'Data não informada'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}
function description(kind: OpportunityForecastChange['kind']): string {
  return kind === 'extension' ? 'Previsão prorrogada' : kind === 'advance' ? 'Previsão antecipada' : 'Primeira previsão registrada'
}

async function load(next = 1) {
  if (loading.value) return
  const current = ++sequence
  loading.value = true
  error.value = ''
  try {
    const response = await opportunitiesApi.forecastHistory(props.tenantId, props.opportunityId, next)
    if (current !== sequence) return
    changes.value = next === 1 ? response.data : [...changes.value, ...response.data]
    page.value = response.current_page
    lastPage.value = response.last_page
  } catch (exception) {
    if (current === sequence) error.value = errorMessage(exception)
  } finally {
    if (current === sequence) loading.value = false
  }
}

watch(() => [props.tenantId, props.opportunityId] as const, () => {
  sequence++
  loading.value = false
  changes.value = []
  page.value = 0
  lastPage.value = 1
  error.value = ''
  void load()
}, { immediate: true })
</script>

<template>
  <section aria-label="Auditoria de previsões" class="space-y-3 rounded-2xl border border-stone-200 bg-stone-50 p-4">
    <div>
      <h3 class="text-sm font-semibold text-slate-900">Histórico estruturado das previsões</h3>
      <p class="mt-1 text-xs text-slate-500">Registros de auditoria separados das observações. Alterações anteriores à ativação deste histórico não aparecem aqui.</p>
    </div>
    <p v-if="error" class="text-sm text-rose-700" role="alert">{{ error }}</p>
    <ol v-if="changes.length" class="space-y-3">
      <li v-for="change in changes" :key="change.id" class="rounded-xl border border-stone-200 bg-white p-3">
        <div class="flex flex-wrap items-start justify-between gap-2">
          <strong class="text-sm" :class="change.kind === 'extension' ? 'text-amber-900' : 'text-slate-800'">
            {{ description(change.kind) }}
          </strong>
          <time class="text-xs text-slate-500">{{ dateTimeBr(change.created_at) }}</time>
        </div>
        <p class="mt-2 text-sm text-slate-700">{{ dateBr(change.previous_date) }} → {{ dateBr(change.new_date) }}</p>
        <p class="mt-1 text-xs text-slate-500">Por {{ change.author_name }}</p>
        <p v-if="change.reason" class="mt-2 whitespace-pre-wrap break-words text-sm text-slate-700">
          <span class="font-semibold">Justificativa:</span> {{ change.reason }}
        </p>
      </li>
    </ol>
    <p v-else-if="!loading && !error" class="text-sm text-slate-500">Nenhuma alteração estruturada registrada.</p>
    <p v-if="loading" class="text-xs text-slate-500">Carregando alterações…</p>
    <button v-if="page < lastPage" type="button" class="secondary-button w-full" :disabled="loading" @click="load(page + 1)">
      Carregar alterações anteriores
    </button>
  </section>
</template>
