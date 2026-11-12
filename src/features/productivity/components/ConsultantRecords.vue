<script setup lang="ts">
import { computed, toRef } from 'vue'
import { useConsultantRecords } from '../composables/useConsultantRecords'
import type { ConsultantRecord, ConsultantRecordType } from '../api'

const props = defineProps<{ tenantId: string; consultantId: string | null; from: string; to: string }>()
const { tab, page, records, loading, error, selectTab, goToPage, load } = useConsultantRecords(
  toRef(props, 'tenantId'), toRef(props, 'consultantId'), toRef(props, 'from'), toRef(props, 'to'),
)
const tabs: { id: ConsultantRecordType; label: string }[] = [
  { id: 'activities', label: 'Atividades' },
  { id: 'opportunities', label: 'Oportunidades' },
  { id: 'orders', label: 'Pedidos' },
]
const routeFor = (item: ConsultantRecord) => {
  const base = `/empresas/${props.tenantId}`
  if (tab.value === 'activities') return `${base}/atividades?atividade=${encodeURIComponent(item.id)}`
  if (tab.value === 'opportunities') return `${base}/oportunidades?oportunidade=${encodeURIComponent(item.id)}`
  return `${base}/pedidos?pedido=${encodeURIComponent(item.id)}`
}
const canOpenDetails = (item: ConsultantRecord) => tab.value !== 'opportunities' || item.status?.toLowerCase() === 'open'
const heading = (item: ConsultantRecord) => item.title || item.customer_name || item.code || 'Registro'
const description = (item: ConsultantRecord) => [
  item.code, item.status, item.sold_on || item.ends_at?.slice(0, 10) || item.created_at?.slice(0, 10),
].filter(Boolean).join(' · ')
const totalLabel = computed(() => `${records.value?.total ?? 0} registros`)
</script>

<template>
  <section class="border-t border-stone-200 px-6 py-5">
    <h3 class="mb-3 font-semibold text-slate-900">Registros do consultor</h3>
    <div class="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Tipo de registro">
      <button v-for="item in tabs" :key="item.id" type="button" role="tab" :aria-selected="tab === item.id"
        class="rounded-lg px-3 py-2 text-sm font-medium" :class="tab === item.id ? 'bg-orange-600 text-white' : 'bg-stone-100 text-slate-700 hover:bg-stone-200'"
        @click="selectTab(item.id)">{{ item.label }}</button>
    </div>
    <p v-if="loading" class="py-6 text-sm text-slate-500">Carregando registros…</p>
    <p v-else-if="error" role="alert" class="py-4 text-sm text-red-700">{{ error }} <button type="button" class="underline" @click="load">Tentar novamente</button></p>
    <template v-else>
      <p class="mb-3 text-xs text-slate-500">{{ totalLabel }}</p>
      <p v-if="!records?.data.length" class="py-5 text-sm text-slate-500">Nenhum registro encontrado no período.</p>
      <ul v-else class="divide-y divide-stone-100">
        <li v-for="item in records.data" :key="item.id" class="flex items-center justify-between gap-3 py-3">
          <div class="min-w-0"><p class="truncate text-sm font-medium text-slate-800">{{ heading(item) }}</p><p class="mt-1 text-xs text-slate-500">{{ description(item) }}</p></div>
          <RouterLink v-if="canOpenDetails(item)" :to="routeFor(item)" class="shrink-0 text-xs font-semibold text-orange-700 hover:underline">Ver detalhes</RouterLink>
          <span v-else class="shrink-0 text-xs text-slate-500">Negociação encerrada</span>
        </li>
      </ul>
      <div v-if="records && records.last_page > 1" class="mt-4 flex items-center justify-between gap-3 border-t pt-4 text-sm">
        <button type="button" class="rounded-lg border px-3 py-2 disabled:opacity-40" :disabled="page <= 1" @click="goToPage(page - 1)">Anterior</button>
        <span>Página {{ page }} de {{ records.last_page }}</span>
        <button type="button" class="rounded-lg border px-3 py-2 disabled:opacity-40" :disabled="page >= records.last_page" @click="goToPage(page + 1)">Próxima</button>
      </div>
    </template>
  </section>
</template>
