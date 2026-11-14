<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { opportunitiesApi } from '@/features/opportunities/api'
import { errorMessage } from '@/lib/feedback'

const props = defineProps<{ tenantId: string }>()
const now = new Date()
const month = ref(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)
const loading = ref(false)
const error = ref('')
const lines = ref<{ count: number; monthly: string } | null>(null)
let version = 0
const money = (amount: string) => Number(amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const monthLabel = computed(() => {
  const [year, number] = month.value.split('-').map(Number)
  return year && number >= 1 && number <= 12
    ? new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(year, number - 1, 1)))
    : 'Selecione o mês'
})
async function refresh() {
  const [year, number] = month.value.split('-').map(Number)
  if (!year || !number || number < 1 || number > 12) {
    error.value = 'Selecione um mês válido.'
    return
  }
  const current = ++version
  loading.value = true
  error.value = ''
  try {
    const from = `${month.value}-01`
    const to = `${month.value}-${String(new Date(year, number, 0).getDate()).padStart(2, '0')}`
    const response = await opportunitiesApi.overview(props.tenantId, from, to)
    if (current === version) lines.value = response.data.activated_lines ?? null
  } catch (exception) {
    if (current === version) { error.value = errorMessage(exception); lines.value = null }
  } finally {
    if (current === version) loading.value = false
  }
}
watch(() => props.tenantId, () => { version++; lines.value = null; void refresh() }, { immediate: true })
</script>

<template>
  <section class="mb-5 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5" aria-label="Ativações comerciais">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 class="text-base font-semibold text-slate-900">Ativações comerciais</h2>
        <p class="mt-1 text-xs text-slate-500">Linhas ativadas e valor mensal correspondente · {{ monthLabel }}</p>
      </div>
      <form class="flex flex-wrap items-end gap-2" @submit.prevent="refresh">
        <label class="text-xs font-semibold text-slate-600">Mês de ativação
          <input v-model="month" type="month" class="field mt-1" required />
        </label>
        <button type="submit" class="primary-button w-auto" :disabled="loading">{{ loading ? 'Consultando…' : 'Consultar' }}</button>
      </form>
    </div>
    <p v-if="error" class="mt-3 text-sm text-rose-700" role="alert">{{ error }}</p>
    <div v-if="lines" class="mt-4 grid gap-3 sm:grid-cols-2" :class="loading ? 'opacity-60' : ''">
      <div class="rounded-xl border border-stone-100 bg-stone-50 p-4">
        <p class="text-xs text-slate-600">Linhas ativadas no período</p>
        <p class="mt-2 text-2xl font-semibold tabular-nums">{{ lines.count }}</p>
      </div>
      <div class="rounded-xl border border-stone-100 bg-stone-50 p-4">
        <p class="text-xs text-slate-600">Valor mensal das linhas ativadas</p>
        <p class="mt-2 text-2xl font-semibold tabular-nums">{{ money(lines.monthly) }}</p>
      </div>
    </div>
    <p v-else-if="loading" class="mt-3 text-sm text-slate-500">Carregando ativações…</p>
    <p class="mt-3 text-xs text-slate-500">Considera ativações parciais de pedidos vinculados às oportunidades visíveis para você. Não representa faturamento recebido.</p>
  </section>
</template>
