<script setup lang="ts">
import { ref } from 'vue'

const view = ref<'operational' | 'performance'>('operational')
const from = ref('')
const to = ref('')
const periodError = ref('')

defineProps<{
  rows: {
    tenant_user_id: string
    name: string
    pending: number
    overdue: number
    completed: number
    completed_7d: number
    completed_30d: number
    completed_period: number
    won_opportunities_period: number
    orders_period: number
    critical: number
  }[]
  loading: boolean
  error: string
  selectedId: string
  period: { from: string; to: string } | null
}>()

const emit = defineEmits<{
  select: [consultantId: string]
  retry: []
  periodChange: [period: { from: string; to: string } | null]
}>()

function applyPeriod() {
  if (!from.value || !to.value || from.value > to.value) {
    periodError.value = 'Informe um período válido com data inicial e final.'
    return
  }
  periodError.value = ''
  emit('periodChange', { from: from.value, to: to.value })
}

function clearPeriod() {
  from.value = ''
  to.value = ''
  periodError.value = ''
  emit('periodChange', null)
}
</script>

<template>
  <section class="mb-5 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
    <div class="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 p-4">
      <div>
        <h2 class="font-semibold text-slate-800">Produtividade por consultor</h2>
        <p class="mt-1 text-xs text-slate-500">
          Selecione um consultor para filtrar as atividades e os indicadores. Os períodos são móveis e consideram a data de conclusão. Oportunidades e pedidos vinculados consideram o período selecionado (30 dias por padrão) e não representam conversão causal.
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <div class="inline-flex rounded-xl border border-stone-200 bg-stone-50 p-1" role="group" aria-label="Visão de produtividade">
          <button
            type="button"
            class="rounded-lg px-3 py-2 text-xs font-semibold transition"
            :class="view === 'operational' ? 'bg-white text-orange-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'"
            :aria-pressed="view === 'operational'"
            @click="view = 'operational'"
          >
            Operacional
          </button>
          <button
            type="button"
            class="rounded-lg px-3 py-2 text-xs font-semibold transition"
            :class="view === 'performance' ? 'bg-white text-orange-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'"
            :aria-pressed="view === 'performance'"
            @click="view = 'performance'"
          >
            Desempenho
          </button>
        </div>
        <button type="button" class="secondary-button w-auto" @click="emit('retry')">
          Atualizar
        </button>
      </div>
    </div>
    <div v-if="view === 'performance'" class="flex flex-wrap items-end gap-3 border-b border-stone-100 px-4 py-3">
      <label class="text-xs font-semibold text-slate-600">
        Data inicial
        <input v-model="from" type="date" class="field mt-1 block" />
      </label>
      <label class="text-xs font-semibold text-slate-600">
        Data final
        <input v-model="to" type="date" class="field mt-1 block" />
      </label>
      <button type="button" class="secondary-button w-auto" @click="applyPeriod">
        Aplicar período
      </button>
      <button v-if="period" type="button" class="secondary-button w-auto" @click="clearPeriod">
        Limpar período
      </button>
      <span v-if="periodError" role="alert" class="text-xs text-red-700">{{ periodError }}</span>
    </div>
    <p v-if="loading" role="status" class="p-4 text-sm text-slate-500">
      Carregando produtividade da equipe…
    </p>
    <p v-if="error" role="alert" class="p-4 text-sm text-red-700">
      Não foi possível atualizar o painel: {{ error }}
    </p>
    <div v-if="rows.length" class="overflow-x-auto px-4 pb-4">
      <table class="w-full min-w-[760px] text-left text-sm">
        <thead class="bg-stone-50 text-xs uppercase text-slate-500">
          <tr>
            <th class="p-3">Consultor</th>
            <th v-if="view === 'operational'" class="p-3 text-right">Pendentes</th>
            <th v-if="view === 'operational'" class="p-3 text-right">Atrasadas</th>
            <th v-if="view === 'operational'" class="p-3 text-right">Críticas</th>
            <th v-if="view === 'performance'" class="p-3 text-right">Concluídas (total)</th>
            <th v-if="view === 'performance'" class="p-3 text-right">Últimos 7 dias</th>
            <th v-if="view === 'performance'" class="p-3 text-right">Últimos 30 dias</th>
            <th v-if="view === 'performance' && period" class="p-3 text-right">Concluídas no período</th>
            <th v-if="view === 'performance'" class="p-3 text-right">Oportunidades ganhas vinculadas</th>
            <th v-if="view === 'performance'" class="p-3 text-right">Pedidos vinculados</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in rows"
            :key="row.tenant_user_id"
            class="border-t border-stone-100"
            :class="selectedId === row.tenant_user_id ? 'bg-orange-50' : ''"
          >
            <td class="p-3">
              <button
                type="button"
                class="font-semibold text-slate-800 underline-offset-2 hover:text-orange-700 hover:underline"
                :aria-pressed="selectedId === row.tenant_user_id"
                @click="emit('select', selectedId === row.tenant_user_id ? '' : row.tenant_user_id)"
              >
                {{ row.name }}
              </button>
            </td>
            <td v-if="view === 'operational'" class="p-3 text-right tabular-nums">{{ row.pending }}</td>
            <td v-if="view === 'operational'" class="p-3 text-right font-semibold text-red-700 tabular-nums">{{ row.overdue }}</td>
            <td v-if="view === 'operational'" class="p-3 text-right font-semibold text-orange-700 tabular-nums">{{ row.critical }}</td>
            <td v-if="view === 'performance'" class="p-3 text-right tabular-nums">{{ row.completed }}</td>
            <td v-if="view === 'performance'" class="p-3 text-right font-semibold text-slate-800 tabular-nums">{{ row.completed_7d }}</td>
            <td v-if="view === 'performance'" class="p-3 text-right font-semibold text-slate-800 tabular-nums">{{ row.completed_30d }}</td>
            <td v-if="view === 'performance' && period" class="p-3 text-right font-semibold text-orange-700 tabular-nums">{{ row.completed_period }}</td>
            <td v-if="view === 'performance'" class="p-3 text-right font-semibold text-slate-800 tabular-nums">{{ row.won_opportunities_period }}</td>
            <td v-if="view === 'performance'" class="p-3 text-right font-semibold text-slate-800 tabular-nums">{{ row.orders_period }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-else-if="!loading && !error" class="p-4 text-sm text-slate-500">
      Nenhum consultor disponível para esta equipe.
    </p>
  </section>
</template>
