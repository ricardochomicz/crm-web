<script setup lang="ts">
import { ref, watch } from 'vue'
import { clientsApi, type ClientTransferPending } from '../api'

const props = defineProps<{ tenantId: string }>()
const rows = ref<ClientTransferPending[]>([])
const loading = ref(false)
const busy = ref(false)
const error = ref('')
const notes = ref<Record<string, string>>({})
const emit = defineEmits<{ reviewed: [] }>()

async function load() {
  loading.value = true
  error.value = ''
  try {
    rows.value = (await clientsApi.pendingTransfers(props.tenantId)).data
  } catch (failure) {
    error.value = failure instanceof Error ? failure.message : 'Não foi possível carregar as solicitações.'
  } finally {
    loading.value = false
  }
}

async function review(id: string, decision: 'APPROVED' | 'REJECTED') {
  if (busy.value) return
  busy.value = true
  error.value = ''
  try {
    await clientsApi.reviewTransfer(props.tenantId, id, decision, notes.value[id] ?? '')
    await load()
    emit('reviewed')
  } catch (failure) {
    error.value = failure instanceof Error ? failure.message : 'Não foi possível analisar a solicitação.'
  } finally {
    busy.value = false
  }
}

watch(() => props.tenantId, () => void load(), { immediate: true })
</script>

<template>
  <section class="space-y-4 rounded-2xl border border-stone-200 bg-white p-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 class="text-lg font-semibold">Transferências de carteira</h2>
        <p class="text-sm text-slate-500">Solicitações pendentes de autorização do supervisor.</p>
      </div>
      <button type="button" class="secondary-button" :disabled="loading" @click="load">Atualizar</button>
    </div>
    <p v-if="error" role="alert" class="text-sm text-red-700">{{ error }}</p>
    <p v-if="loading" class="text-sm text-slate-500">Carregando solicitações...</p>
    <p v-else-if="!rows.length" class="text-sm text-slate-500">Nenhuma solicitação pendente para análise.</p>
    <article v-for="item in rows" :key="item.id" class="space-y-3 rounded-xl border border-stone-200 p-4">
      <h3 class="font-semibold text-slate-800">{{ item.client_name }}</h3>
      <p class="text-sm text-slate-600">
        De <strong>{{ item.from_name ?? 'Responsável atual' }}</strong>
        para <strong>{{ item.to_name ?? 'Solicitante' }}</strong>
      </p>
      <p v-if="item.reason" class="text-sm text-slate-500">{{ item.reason }}</p>
      <label class="block text-sm font-medium text-slate-700">
        Observação da análise
        <textarea v-model="notes[item.id]" class="field mt-1" rows="2" maxlength="1000" />
      </label>
      <div class="flex flex-wrap gap-2">
        <button type="button" class="primary-button" :disabled="busy" @click="review(item.id, 'APPROVED')">Aprovar</button>
        <button type="button" class="secondary-button" :disabled="busy" @click="review(item.id, 'REJECTED')">Rejeitar</button>
      </div>
    </article>
  </section>
</template>
