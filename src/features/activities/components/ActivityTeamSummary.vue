<script setup lang="ts">
import { ref } from 'vue'

const view = ref<'operational' | 'performance'>('operational')

defineProps<{
  rows: {
    tenant_user_id: string
    name: string
    pending: number
    overdue: number
    completed: number
    completed_7d: number
    completed_30d: number
    critical: number
  }[]
  loading: boolean
  error: string
  selectedId: string
}>()

const emit = defineEmits<{
  select: [consultantId: string]
  retry: []
}>()
</script>

<template>
  <section class="mb-5 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
    <div class="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 p-4">
      <div>
        <h2 class="font-semibold text-slate-800">Produtividade por consultor</h2>
        <p class="mt-1 text-xs text-slate-500">
          Selecione um consultor para filtrar as atividades e os indicadores. Os períodos são móveis e consideram a data de conclusão.
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
    <p v-if="loading" role="status" class="p-4 text-sm text-slate-500">
      Carregando produtividade da equipe…
    </p>
    <p v-if="error" role="alert" class="p-4 text-sm text-red-700">
      Não foi possível atualizar o painel: {{ error }}
    </p>
    <div v-if="rows.length" class="overflow-x-auto px-4 pb-4">
      <table class="w-full min-w-[580px] text-left text-sm">
        <thead class="bg-stone-50 text-xs uppercase text-slate-500">
          <tr>
            <th class="p-3">Consultor</th>
            <th v-if="view === 'operational'" class="p-3 text-right">Pendentes</th>
            <th v-if="view === 'operational'" class="p-3 text-right">Atrasadas</th>
            <th v-if="view === 'operational'" class="p-3 text-right">Críticas</th>
            <th v-if="view === 'performance'" class="p-3 text-right">Concluídas (total)</th>
            <th v-if="view === 'performance'" class="p-3 text-right">Últimos 7 dias</th>
            <th v-if="view === 'performance'" class="p-3 text-right">Últimos 30 dias</th>
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
          </tr>
        </tbody>
      </table>
    </div>
    <p v-else-if="!loading && !error" class="p-4 text-sm text-slate-500">
      Nenhum consultor disponível para esta equipe.
    </p>
  </section>
</template>
