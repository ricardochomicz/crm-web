<script setup lang="ts">
import type { ProductivityResponse } from '../api'
import ConsultantRanking from './ConsultantRanking.vue'
import GoalConfigurations from './GoalConfigurations.vue'
import ConsultantDetailsDialog from './ConsultantDetailsDialog.vue'
import { toRef } from 'vue'
import { useConsultantDetails } from '../composables/useConsultantDetails'
const props = defineProps<{ result: ProductivityResponse; tenantId: string; from: string; to: string; consultantId?: string }>()
const { selected, openConsultant, closeConsultant } = useConsultantDetails(toRef(() => props.result.data))
const currency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
</script>

<template>
  <div class="space-y-6">
    <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <div v-for="metric in [
        { label: 'Atividades concluídas', value: result.totals.completed },
        { label: 'Atividades atrasadas', value: result.totals.overdue },
        { label: 'Oportunidades criadas', value: result.totals.opportunities },
        { label: 'Oportunidades abertas', value: result.totals.open_opportunities },
        { label: 'Pedidos vendidos', value: result.totals.orders },
        { label: 'Valor mensal vendido', value: currency(result.totals.monthly_amount) },
      ]" :key="metric.label" class="rounded-xl border border-stone-200 bg-white p-5">
        <p class="text-xs font-medium text-slate-500">{{ metric.label }}</p>
        <p class="mt-2 text-2xl font-bold text-slate-800">{{ metric.value }}</p>
      </div>
    </div>
    <GoalConfigurations :tenant-id="tenantId" :from="from" :to="to" :consultant-id="consultantId" />
    <ConsultantRanking :rows="result.data" @select="openConsultant" />
    <div class="overflow-hidden rounded-xl border border-stone-200 bg-white">
      <div class="border-b border-stone-200 px-5 py-4"><h2 class="font-semibold text-slate-800">Resultados por consultor</h2></div>
      <div class="overflow-x-auto">
        <table class="w-full min-w-[850px] text-left text-sm">
          <thead class="bg-stone-50 text-xs text-slate-600"><tr>
            <th scope="col" class="px-4 py-3">Consultor</th>
            <th scope="col" class="px-4 py-3 text-right">Concluídas</th>
            <th scope="col" class="px-4 py-3 text-right">Atrasadas</th>
            <th scope="col" class="px-4 py-3 text-right">Oportunidades</th>
            <th scope="col" class="px-4 py-3 text-right">Em aberto</th>
            <th scope="col" class="px-4 py-3 text-right">Pedidos</th>
            <th scope="col" class="px-4 py-3 text-right">Valor mensal</th>
          </tr></thead>
          <tbody class="divide-y divide-stone-100">
            <tr v-for="row in result.data" :key="row.id">
              <th scope="row" class="px-4 py-3 font-medium"><button type="button" class="text-left hover:text-orange-700 hover:underline focus-visible:outline-2 focus-visible:outline-orange-600" @click="openConsultant(row.id)">{{ row.name }}</button></th>
              <td class="px-4 py-3 text-right">{{ row.completed }}</td>
              <td class="px-4 py-3 text-right">{{ row.overdue }}</td>
              <td class="px-4 py-3 text-right">{{ row.opportunities }}</td>
              <td class="px-4 py-3 text-right">{{ row.open_opportunities }}</td>
              <td class="px-4 py-3 text-right">{{ row.orders }}</td>
              <td class="px-4 py-3 text-right">{{ currency(row.monthly_amount) }}</td>
            </tr>
            <tr v-if="!result.data.length"><td colspan="7" class="px-4 py-10 text-center text-slate-500">Nenhum consultor encontrado para os filtros.</td></tr>
          </tbody>
        </table>
      </div>
    </div>
    <ConsultantDetailsDialog :consultant="selected" :tenant-id="tenantId" :from="from" :to="to" @close="closeConsultant" />
  </div>
</template>
