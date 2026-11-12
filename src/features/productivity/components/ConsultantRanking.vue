<script setup lang="ts">
import { toRef } from 'vue'
import type { ProductivityRow } from '../api'
import { rankingMetrics, useConsultantRanking } from '../composables/useConsultantRanking'

const props = defineProps<{ rows: ProductivityRow[] }>()
const { metric, ranked, maximum } = useConsultantRanking(toRef(props, 'rows'))
const currency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
const formatValue = (row: ProductivityRow) => metric.value === 'monthly_amount'
  ? currency(row.monthly_amount)
  : new Intl.NumberFormat('pt-BR').format(row[metric.value])
</script>

<template>
  <section class="rounded-xl border border-stone-200 bg-white p-5" aria-label="Ranking de consultores">
    <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 class="font-semibold text-slate-800">Ranking de consultores</h2>
        <p class="mt-1 text-xs text-slate-500">Classificação por indicador no período selecionado</p>
      </div>
      <label class="text-xs font-medium text-slate-600">Ordenar por
        <select v-model="metric" class="ml-2 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-slate-800">
          <option v-for="option in rankingMetrics" :key="option.value" :value="option.value">{{ option.label }}</option>
        </select>
      </label>
    </div>
    <p v-if="!ranked.length" class="py-5 text-center text-sm text-slate-500">Nenhum consultor encontrado para o período.</p>
    <ol v-else class="max-h-96 space-y-4 overflow-y-auto pr-1">
      <li v-for="person in ranked" :key="person.id" class="flex items-center gap-3">
        <span class="w-7 shrink-0 text-center text-sm font-bold text-slate-500">{{ person.position }}º</span>
        <div class="min-w-0 flex-1">
          <div class="mb-1 flex items-center justify-between gap-3 text-sm">
            <span class="truncate font-medium text-slate-800" :title="person.name">{{ person.name }}</span>
            <span class="shrink-0 font-semibold tabular-nums text-slate-800">{{ formatValue(person) }}</span>
          </div>
          <div class="h-2 overflow-hidden rounded-full bg-stone-100">
            <div class="h-full rounded-full bg-orange-500 transition-all" :style="{ width: `${Math.max(0, person[metric]) / maximum * 100}%` }" />
          </div>
        </div>
      </li>
    </ol>
  </section>
</template>
