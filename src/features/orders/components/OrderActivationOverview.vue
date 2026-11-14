<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import MultiSearchSelect from '@/components/ui/MultiSearchSelect.vue'
import { ordersApi, type OrderActivationOverview } from '../api'
import { errorMessage } from '@/lib/feedback'

const props = defineProps<{ tenantId: string }>()
const now = new Date()
const month = ref(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)
const expanded = ref(false)
const orderTypeIds = ref<string[]>([])
const loading = ref(false)
const error = ref('')
const overview = ref<OrderActivationOverview | null>(null)
const availableTypes = ref<{ value: string; label: string }[]>([])
const typesError = ref('')
let typesVersion = 0
let version = 0
const money = (amount: string) => Number(amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const monthLabel = computed(() => {
  const [year, number] = month.value.split('-').map(Number)
  return year && number >= 1 && number <= 12
    ? new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(year, number - 1, 1)))
    : 'Selecione o mês'
})
const metric = ref<'lines' | 'monthly'>('monthly')
const change = (current: number, previous: number) => previous === 0 ? (current === 0 ? '0%' : 'Novo') : `${((current - previous) / previous * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`
const barValues = computed(() => overview.value ? [Number(overview.value.previous_total[metric.value]), Number(overview.value.total[metric.value])] : [0, 0])
const barMax = computed(() => Math.max(1, ...barValues.value))
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
    const response = await ordersApi.activationOverview(props.tenantId, from, to, orderTypeIds.value)
    if (current === version) {
      overview.value = response.data
    }
  } catch (exception) {
    if (current === version) { error.value = errorMessage(exception); overview.value = null }
  } finally {
    if (current === version) loading.value = false
  }
}
async function loadTypes() {
  const current = ++typesVersion
  typesError.value = ''
  try {
    const response = await ordersApi.orderTypes()
    if (current === typesVersion) {
      availableTypes.value = response.data.map(type => ({ value: type.id, label: type.name }))
    }
  } catch (exception) {
    if (current === typesVersion) {
      availableTypes.value = []
      typesError.value = errorMessage(exception)
    }
  }
}
watch(() => props.tenantId, () => {
  version++
  overview.value = null
  orderTypeIds.value = []
  availableTypes.value = []
  if (expanded.value) { void loadTypes(); void refresh() }
})
watch(expanded, (open) => { if (open) { void loadTypes(); if (!overview.value) void refresh() } })
</script>

<template>
  <section class="mb-5 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm" aria-label="Visão gerencial de ativações">
    <button type="button" class="flex w-full items-center justify-between gap-3 p-4 text-left sm:p-5" :aria-expanded="expanded" @click="expanded = !expanded">
      <div>
        <h2 class="text-base font-semibold text-slate-900">Visão gerencial · Ativações comerciais</h2>
        <p class="mt-1 text-xs text-slate-500">Linhas ativadas, receita mensal e tipos de pedido · {{ monthLabel }}</p>
      </div>
      <span class="text-sm font-medium text-slate-600">{{ expanded ? 'Recolher ▲' : 'Expandir ▼' }}</span>
    </button>
    <div v-if="expanded" class="border-t border-stone-100 p-4 sm:p-5">
      <form class="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end" @submit.prevent="refresh">
        <label class="text-xs font-semibold text-slate-600">Mês de ativação
          <input v-model="month" type="month" class="field mt-1 w-full" required />
        </label>
        <div>
          <label class="mb-1 block text-xs font-semibold text-slate-600">Tipo de pedido da linha</label>
          <MultiSearchSelect v-model="orderTypeIds" :options="availableTypes" placeholder="Todos os tipos" />
          <p v-if="typesError" class="mt-1 text-xs text-rose-700" role="alert">Não foi possível carregar os tipos: {{ typesError }}</p>
        </div>
        <button type="submit" class="primary-button w-auto" :disabled="loading">{{ loading ? 'Consultando…' : 'Consultar' }}</button>
      </form>
      <p v-if="error" class="mt-3 text-sm text-rose-700" role="alert">{{ error }}</p>
      <template v-if="overview">
        <div class="mt-4 grid gap-3 sm:grid-cols-2" :class="loading ? 'opacity-60' : ''">
          <div class="rounded-xl border border-stone-100 bg-stone-50 p-4">
            <p class="text-xs text-slate-600">Total de linhas ativadas</p>
            <p class="mt-2 text-2xl font-semibold tabular-nums">{{ overview.total.lines }}</p>
          </div>
          <div class="rounded-xl border border-stone-100 bg-stone-50 p-4">
            <p class="text-xs text-slate-600">Valor mensal das linhas ativadas</p>
            <p class="mt-2 text-2xl font-semibold tabular-nums">{{ money(overview.total.monthly) }}</p>
          </div>
        </div>
        <div class="mt-4 rounded-xl border border-stone-100 p-4">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <h3 class="text-sm font-semibold text-slate-800">Comparativo com o período equivalente do mês anterior</h3>
            <div class="flex gap-2">
              <button type="button" class="rounded-lg px-3 py-1.5 text-xs" :class="metric === 'monthly' ? 'bg-orange-600 text-white' : 'bg-stone-100'" @click="metric = 'monthly'">Receita mensal</button>
              <button type="button" class="rounded-lg px-3 py-1.5 text-xs" :class="metric === 'lines' ? 'bg-orange-600 text-white' : 'bg-stone-100'" @click="metric = 'lines'">Linhas</button>
            </div>
          </div>
          <p class="mt-2 text-xs text-slate-500">Linhas: {{ change(overview.total.lines, overview.previous_total.lines) }} · Receita: {{ change(Number(overview.total.monthly), Number(overview.previous_total.monthly)) }}</p>
          <div class="mt-4 space-y-3">
            <div v-for="(value, index) in barValues" :key="index" class="grid grid-cols-[6rem_1fr_auto] items-center gap-3 text-xs">
              <span class="text-slate-600">{{ index === 0 ? 'Mês anterior' : 'Período atual' }}</span>
              <div class="h-5 overflow-hidden rounded bg-stone-100"><div class="h-full rounded" :class="index === 0 ? 'bg-slate-400' : 'bg-orange-500'" :style="{ width: `${value / barMax * 100}%` }"></div></div>
              <span class="font-medium tabular-nums">{{ metric === 'monthly' ? money(String(value)) : value }}</span>
            </div>
          </div>
          <p class="mt-2 text-xs text-slate-500">{{ overview.previous_period.from.split('-').reverse().join('/') }} a {{ overview.previous_period.to.split('-').reverse().join('/') }} vs. {{ overview.period.from.split('-').reverse().join('/') }} a {{ overview.period.to.split('-').reverse().join('/') }}</p>
        </div>
        <div class="mt-4 overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="border-b border-stone-200 text-xs uppercase text-slate-500"><tr><th class="py-3">Tipo de pedido</th><th class="py-3 text-right">Linhas</th><th class="py-3 text-right">Valor mensal</th></tr></thead>
            <tbody>
              <tr v-for="item in overview.by_type" :key="item.order_type_id ?? 'none'" class="border-b border-stone-100">
                <td class="py-3">{{ item.name }}</td><td class="py-3 text-right tabular-nums">{{ item.lines }}</td><td class="py-3 text-right tabular-nums">{{ money(item.monthly) }}</td>
              </tr>
              <tr v-if="!overview.by_type.length"><td colspan="3" class="py-4 text-slate-500">Nenhuma linha ativada no período.</td></tr>
            </tbody>
            <tfoot class="font-semibold"><tr><td class="pt-3">Total</td><td class="pt-3 text-right">{{ overview.total.lines }}</td><td class="pt-3 text-right">{{ money(overview.total.monthly) }}</td></tr></tfoot>
          </table>
        </div>
      </template>
      <p v-else-if="loading" class="mt-3 text-sm text-slate-500">Carregando ativações…</p>
      <p class="mt-3 text-xs text-slate-500">Considera a data e o tipo de cada linha ativada, inclusive em pedidos parcialmente ativados. Valor mensal ativado não significa faturamento recebido.</p>
    </div>
  </section>
</template>
