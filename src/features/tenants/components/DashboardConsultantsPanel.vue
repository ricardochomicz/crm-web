<script setup lang="ts">
import { toRef } from 'vue'
import SearchSelect from '@/components/ui/SearchSelect.vue'
import DashboardMetricCard from './DashboardMetricCard.vue'
import { useDashboardConsultants } from '../composables/useDashboardConsultants'

const props = defineProps<{ tenantId: string; enabled: boolean }>()
const { data, loading, error, period, selectedConsultant, consultants, totals, leaders, refresh } =
  useDashboardConsultants(toRef(props, 'tenantId'), toRef(props, 'enabled'))
const money = (value: number) => new Intl.NumberFormat('pt-BR', {
  style: 'currency', currency: 'BRL', maximumFractionDigits: 0,
}).format(value)
</script>

<template>
  <section class="space-y-4 rounded-2xl border border-stone-200 bg-white p-5" aria-label="Desempenho dos consultores" :aria-busy="loading">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 class="text-base font-semibold text-slate-900">Desempenho dos consultores</h2>
        <p class="mt-1 text-xs text-slate-500">Pedidos vendidos e oportunidades criadas no período, até hoje</p>
      </div>
      <RouterLink :to="`/empresas/${tenantId}/produtividade`" class="text-xs font-semibold text-orange-700 hover:underline">Ver produtividade</RouterLink>
    </div>
    <div class="grid gap-3 sm:grid-cols-2">
      <div>
        <label class="mb-1 block text-xs font-medium text-slate-600">Período</label>
        <SearchSelect :model-value="period" @update:model-value="value => { if (value === 'month' || value === 'quarter') period = value }" :options="[{ value: 'month', label: 'Este mês' }, { value: 'quarter', label: 'Este trimestre' }]" />
      </div>
      <div>
        <label class="mb-1 block text-xs font-medium text-slate-600">Consultor</label>
        <SearchSelect :model-value="selectedConsultant" @update:model-value="value => { selectedConsultant = String(value) }" :options="[{ value: '', label: 'Todos os consultores' }, ...consultants]" />
      </div>
    </div>
    <p v-if="error" role="alert" class="text-sm text-rose-700">{{ error }} <button type="button" class="underline" @click="refresh">Tentar novamente</button></p>
    <div class="grid gap-3 sm:grid-cols-3">
      <DashboardMetricCard label="Pedidos vendidos" :value="data ? totals.orders.toLocaleString('pt-BR') : '—'" detail="Pedidos registrados no período" accent="violet" />
      <DashboardMetricCard label="Valor mensal vendido" :value="data ? money(totals.monthly) : '—'" detail="Valor dos pedidos; não é receita recebida" accent="emerald" />
      <DashboardMetricCard label="Oportunidades criadas" :value="data ? totals.opportunities.toLocaleString('pt-BR') : '—'" detail="Criadas no período selecionado" accent="sky" />
    </div>
    <div v-if="data" class="space-y-2">
      <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Consultores por pedidos vendidos</p>
      <p v-if="!leaders.length" class="text-sm text-slate-500">Nenhum consultor disponível neste período.</p>
      <div v-for="row in leaders" :key="row.id" class="flex items-center justify-between gap-3 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm">
        <span class="min-w-0 truncate font-medium text-slate-800">{{ row.name }}</span>
        <span class="shrink-0 text-slate-600">{{ row.orders }} pedidos · {{ money(row.monthly_amount) }}/mês</span>
      </div>
    </div>
    <p class="text-xs text-slate-500">Dados limitados aos consultores visíveis para o perfil atual. Ranking por quantidade de pedidos, não por ativações.</p>
  </section>
</template>
