<script setup lang="ts">
import { computed, toRef } from 'vue'
import { useDashboardActivations } from '../composables/useDashboardActivations'
import DashboardMetricCard from './DashboardMetricCard.vue'
import type { DashboardPeriod } from '../composables/useDashboardPeriod'

const props = defineProps<{ tenantId: string; enabled: boolean; period: DashboardPeriod }>()
const { data, loading, error, periodLabel, refresh } = useDashboardActivations(
  toRef(props, 'tenantId'),
  toRef(props, 'enabled'),
  toRef(props, 'period'),
)
const money = (value: string) => new Intl.NumberFormat('pt-BR', {
  style: 'currency', currency: 'BRL',
}).format(Number(value))
const lines = computed(() => data.value?.total.lines.toLocaleString('pt-BR') ?? '—')
const monthly = computed(() => data.value ? money(data.value.total.monthly) : '—')
const previousLines = computed(() => data.value?.previous_total.lines.toLocaleString('pt-BR') ?? '—')
const previousMonthly = computed(() => data.value ? money(data.value.previous_total.monthly) : '—')
const comparisonLabel = computed(() => {
  if (!data.value) return ''
  const format = (date: string) => date.split('-').reverse().join('/')
  return `Comparativo: ${format(data.value.previous_period.from)} a ${format(data.value.previous_period.to)}`
})
const lineChange = computed(() => {
  if (!data.value) return ''
  const previous = data.value.previous_total.lines
  const current = data.value.total.lines
  if (!previous) return current ? 'Sem base de comparação anterior' : 'Sem ativações nos dois períodos'
  const change = (current - previous) / previous * 100
  if (!change) return 'Mesmo volume do período anterior'
  return `${Math.abs(change).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}% de ${change > 0 ? 'alta' : 'queda'}`
})
</script>

<template>
  <section aria-label="Ativações comerciais" class="space-y-3" :aria-busy="loading">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 class="text-base font-semibold text-slate-900">Ativações comerciais</h2>
        <p class="mt-1 text-xs text-slate-500">Linhas efetivamente ativadas no período: {{ periodLabel }}</p>
      </div>
      <div class="flex items-center gap-3">
        <RouterLink :to="`/empresas/${tenantId}/pedidos`" class="text-xs font-semibold text-orange-700 hover:underline">Ver pedidos</RouterLink>
        <button type="button" class="secondary-button w-auto" :disabled="loading" @click="refresh">
          {{ loading ? 'Atualizando…' : 'Atualizar' }}
        </button>
      </div>
    </div>
    <p v-if="error" role="alert" class="text-sm text-rose-700">
      {{ error }} <button type="button" class="underline" @click="refresh">Tentar novamente</button>
    </p>
    <div class="grid gap-3 sm:grid-cols-2">
      <DashboardMetricCard label="Linhas ativadas" :value="lines" detail="Quantidade de linhas ativadas no mês" accent="sky" />
      <DashboardMetricCard label="Valor mensal das ativações" :value="monthly" detail="Valor contratado das linhas ativadas; não é receita recebida" accent="emerald" />
    </div>
    <div v-if="data" class="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-slate-600">
      <p class="font-medium text-slate-800">{{ comparisonLabel }}</p>
      <p class="mt-1">Período anterior: {{ previousLines }} linhas · {{ previousMonthly }}/mês.</p>
      <p class="mt-1 font-semibold text-slate-700">{{ lineChange }}</p>
    </div>
  </section>
</template>
