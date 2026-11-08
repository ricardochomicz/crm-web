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
  if ((notes.value[id] ?? '').trim().length < 10) {
    error.value = 'Informe uma justificativa de pelo menos 10 caracteres para a decisão.'
    return
  }
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
      <p v-if="item.reason" class="text-sm text-slate-500">Motivo da solicitação: {{ item.reason }}</p>
      <div class="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
        <p>Sem interação há mais de 90 dias: <strong>{{ item.eligibility.inactive_for_90_days ? 'Sim' : 'Não' }}</strong></p>
        <p>Pedidos em andamento: <strong>{{ item.eligibility.has_open_orders ? 'Sim' : 'Não' }}</strong></p>
        <p>Oportunidades em andamento: <strong>{{ item.eligibility.has_open_opportunities ? 'Sim' : 'Não' }}</strong></p>
        <p v-if="!item.eligibility.inactive_for_90_days" class="mt-2 font-semibold">Atenção: interação recente. A aprovação exige avaliação expressa do gestor.</p>
        <p v-if="item.eligibility.requires_special_review" class="mt-2 font-semibold">Atenção: há negócios em andamento. Avalie os vínculos comerciais antes de autorizar.</p>
      </div>
      <label class="block text-sm font-medium text-slate-700">
        Observação da análise
        <textarea v-model="notes[item.id]" class="field mt-1" rows="2" minlength="10" maxlength="1000" />
      </label>
      <div class="flex flex-wrap gap-2">
        <button type="button" class="primary-button" :disabled="busy" @click="review(item.id, 'APPROVED')">Aprovar</button>
        <button type="button" class="secondary-button" :disabled="busy" @click="review(item.id, 'REJECTED')">Rejeitar</button>
      </div>
    </article>
  </section>
</template>
