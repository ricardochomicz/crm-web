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
const breakdown = computed(() => {
  if (!overview.value) return []
  const current = overview.value.by_type
  const previous = overview.value.previous_by_type ?? []
  const ids = new Set([...current, ...previous].map(item => item.order_type_id))
  return [...ids].map(id => {
    const currentRow = current.find(item => item.order_type_id === id)
    const previousRow = previous.find(item => item.order_type_id === id)
    return {
      id: id ?? 'unclassified',
      name: currentRow?.name ?? previousRow?.name ?? 'Sem tipo definido',
      lines: currentRow?.lines ?? 0,
      monthly: Number(currentRow?.monthly ?? 0),
      previousLines: previousRow?.lines ?? 0,
      previousMonthly: Number(previousRow?.monthly ?? 0),
    }
  }).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
})
const change = (current: number, previous: number) => previous === 0
  ? (current === 0 ? '—' : 'Sem base anterior')
  : `${((current - previous) / previous * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`
const percentage = (value: number, max: number) => `${Math.max(0, Math.min(100, max > 0 ? value / max * 100 : 0))}%`
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
    const endDay = month.value === `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}` ? new Date().getDate() : new Date(year, number, 0).getDate()
    const to = `${month.value}-${String(endDay).padStart(2, '0')}`
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
        <div class="mt-4 flex flex-wrap items-center justify-between gap-2">
          <h3 class="text-sm font-semibold text-slate-800">Desempenho por tipo de pedido</h3>
          <span class="text-xs text-slate-500">Quantidade e valor mensal apresentados juntos · comparação com mês anterior</span>
        </div>
        <div v-if="breakdown.length" class="mt-3 grid gap-3 lg:grid-cols-2" :class="loading ? 'opacity-60' : ''">
          <article v-for="item in breakdown" :key="item.id" class="rounded-xl border border-stone-200 bg-white p-4">
            <h4 class="font-semibold text-slate-900">{{ item.name }}</h4>
            <div class="mt-3 grid grid-cols-2 gap-3">
              <div class="rounded-lg bg-stone-50 px-3 py-2">
                <p class="text-xs text-slate-500">Linhas ativadas</p>
                <p class="mt-1 text-xl font-bold tabular-nums">{{ item.lines }}</p>
                <p class="mt-1 text-xs text-slate-500">{{ change(item.lines, item.previousLines) }}</p>
              </div>
              <div class="rounded-lg bg-stone-50 px-3 py-2">
                <p class="text-xs text-slate-500">Valor mensal das linhas</p>
                <p class="mt-1 text-lg font-bold tabular-nums">{{ money(String(item.monthly)) }}</p>
                <p class="mt-1 text-xs text-slate-500">{{ change(item.monthly, item.previousMonthly) }}</p>
              </div>
            </div>
            <div class="mt-4 grid grid-cols-2 gap-4">
              <div>
                <p class="mb-2 text-xs font-medium text-slate-600">Linhas</p>
                <div class="space-y-2">
                  <div v-for="(value, index) in [item.previousLines, item.lines]" :key="index">
                    <div class="mb-1 flex justify-between gap-2 text-xs text-slate-500"><span>{{ index ? 'Atual' : 'Anterior' }}</span><span>{{ value }}</span></div>
                    <div class="h-2 rounded-full bg-stone-100"><div class="h-full rounded-full" :class="index ? 'bg-orange-500' : 'bg-slate-400'" :style="{ width: percentage(value, Math.max(item.lines, item.previousLines)) }"></div></div>
                  </div>
                </div>
              </div>
              <div>
                <p class="mb-2 text-xs font-medium text-slate-600">Valor mensal</p>
                <div class="space-y-2">
                  <div v-for="(value, index) in [item.previousMonthly, item.monthly]" :key="index">
                    <div class="mb-1 flex justify-between gap-2 text-xs text-slate-500"><span>{{ index ? 'Atual' : 'Anterior' }}</span><span>{{ money(String(value)) }}</span></div>
                    <div class="h-2 rounded-full bg-stone-100"><div class="h-full rounded-full" :class="index ? 'bg-orange-500' : 'bg-slate-400'" :style="{ width: percentage(value, Math.max(item.monthly, item.previousMonthly)) }"></div></div>
                  </div>
                </div>
              </div>
            </div>
          </article>
        </div>
        <p v-else class="mt-4 rounded-xl border border-dashed border-stone-200 p-5 text-sm text-slate-500">Nenhuma ativação encontrada nos períodos comparados.</p>
        <p class="mt-3 text-xs text-slate-500">Comparação: {{ overview.previous_period.from.split('-').reverse().join('/') }} a {{ overview.previous_period.to.split('-').reverse().join('/') }} × {{ overview.period.from.split('-').reverse().join('/') }} a {{ overview.period.to.split('-').reverse().join('/') }}.</p>
      </template>
      <p v-else-if="loading" class="mt-3 text-sm text-slate-500">Carregando ativações…</p>
      <p class="mt-3 text-xs text-slate-500">Considera a data e o tipo de cada linha ativada, inclusive em pedidos parcialmente ativados. Valor mensal ativado não significa faturamento recebido.</p>
    </div>
  </section>
</template>
