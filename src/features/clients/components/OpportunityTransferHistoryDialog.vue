<script setup lang="ts">
import { ref, watch } from 'vue'
import { clientsApi, type OpportunityTransferHistoryItem } from '../api'

const props = defineProps<{ tenantId: string; open: boolean; clientId?: string }>()
const emit = defineEmits<{ close: [] }>()
const rows = ref<OpportunityTransferHistoryItem[]>([])
const page = ref(1)
const pages = ref(1)
const total = ref(0)
const loading = ref(false)
const error = ref('')
let version = 0

function formatDate(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('pt-BR')
}

async function load(nextPage = 1) {
  if (!props.open) return
  const current = ++version
  loading.value = true
  error.value = ''
  try {
    const result = await clientsApi.opportunityTransferHistory(props.tenantId, nextPage, props.clientId)
    if (current !== version) return
    rows.value = result.data
    page.value = result.meta.current_page
    pages.value = result.meta.last_page
    total.value = result.meta.total
  } catch (failure) {
    if (current === version) {
      error.value = failure instanceof Error ? failure.message : 'Não foi possível carregar o histórico.'
    }
  } finally {
    if (current === version) loading.value = false
  }
}

watch(() => [props.open, props.tenantId, props.clientId], () => {
  ++version
  rows.value = []
  if (props.open) void load()
}, { immediate: true })
</script>

<template>
  <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" @click.self="emit('close')">
    <section role="dialog" aria-modal="true" aria-labelledby="opportunity-transfer-title" class="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
      <header class="flex items-center justify-between gap-4 border-b border-stone-200 p-5">
        <div>
          <h2 id="opportunity-transfer-title" class="text-lg font-semibold">Histórico de transferências de oportunidades</h2>
          <p class="text-sm text-slate-500">{{ total }} movimentações registradas</p>
        </div>
        <button type="button" class="secondary-button" @click="emit('close')">Fechar</button>
      </header>
      <div class="overflow-y-auto p-5">
        <p v-if="error" role="alert" class="mb-4 text-sm text-red-700">{{ error }}</p>
        <p v-if="loading" class="text-sm text-slate-500">Carregando histórico...</p>
        <p v-else-if="!rows.length && !error" class="text-sm text-slate-500">Nenhuma transferência registrada.</p>
        <div v-for="item in rows" :key="item.id" class="mb-3 rounded-xl border border-stone-200 p-4">
          <div class="flex flex-wrap justify-between gap-2">
            <div>
              <p class="font-semibold text-slate-800">{{ item.opportunity_title }}</p>
              <p class="text-sm text-slate-600">{{ item.client_name }}</p>
            </div>
            <time class="text-sm text-slate-500">{{ formatDate(item.created_at) }}</time>
          </div>
          <p class="mt-3 text-sm"><strong>{{ item.from_name }}</strong> → <strong>{{ item.to_name }}</strong></p>
          <p class="mt-1 text-sm text-slate-600">Autorizado por: {{ item.actor_name }}</p>
          <p class="mt-1 text-sm text-slate-600">Origem: {{ item.source_type === 'client_transfer' ? 'Transferência individual' : 'Redistribuição de carteira' }}</p>
          <p class="mt-2 whitespace-pre-wrap text-sm text-slate-700">Motivo: {{ item.reason }}</p>
        </div>
      </div>
      <footer class="flex items-center justify-between gap-3 border-t border-stone-200 p-4">
        <span class="text-sm text-slate-500">Página {{ page }} de {{ pages }}</span>
        <div class="flex gap-2">
          <button type="button" class="secondary-button" :disabled="loading || page <= 1" @click="load(page - 1)">Anterior</button>
          <button type="button" class="secondary-button" :disabled="loading || page >= pages" @click="load(page + 1)">Próxima</button>
        </div>
      </footer>
    </section>
  </div>
</template>
