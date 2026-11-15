<script setup lang="ts">
import MultiSearchSelect from '@/components/ui/MultiSearchSelect.vue'
import { toRef } from 'vue'
import { useOrderActivationOverview } from '../composables/useOrderActivationOverview'

const props = defineProps<{ tenantId: string }>()
const { month, expanded, orderTypeIds, loading, error, overview, availableTypes, typesError, monthLabel, breakdown, refresh, money, trend, percentage } = useOrderActivationOverview(toRef(props, 'tenantId'))
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
        <div v-if="breakdown.length" class="mt-3 grid gap-3" :class="[loading ? 'opacity-60' : '', breakdown.length > 1 ? 'lg:grid-cols-2' : 'grid-cols-1']">
          <article v-for="item in breakdown" :key="item.id" class="rounded-xl border border-stone-200 bg-white p-4">
            <h4 class="font-semibold text-slate-900">{{ item.name }}</h4>
            <div class="mt-3 grid grid-cols-2 gap-3">
              <div class="rounded-lg bg-stone-50 px-3 py-2">
                <p class="text-xs text-slate-500">Linhas ativadas</p>
                <p class="mt-1 text-xl font-bold tabular-nums">{{ item.lines }}</p>
              </div>
              <div class="rounded-lg bg-stone-50 px-3 py-2">
                <p class="text-xs text-slate-500">Valor mensal das linhas</p>
                <p class="mt-1 text-lg font-bold tabular-nums">{{ money(String(item.monthly)) }}</p>
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
            <div class="mt-4 grid gap-2 rounded-lg border border-stone-100 bg-stone-50/70 p-3 sm:grid-cols-2">
              <div>
                <p class="text-xs font-semibold text-slate-600">Evolução das linhas</p>
                <p class="mt-1 text-sm font-medium" :class="trend(item.lines, item.previousLines).tone">{{ trend(item.lines, item.previousLines).label }}</p>
              </div>
              <div>
                <p class="text-xs font-semibold text-slate-600">Evolução do valor mensal</p>
                <p class="mt-1 text-sm font-medium" :class="trend(item.monthly, item.previousMonthly).tone">{{ trend(item.monthly, item.previousMonthly).label }}</p>
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
