<script setup lang="ts">
import { ref, watch } from 'vue'
import { protocolApi, type Protocol } from '@/features/after-sales/api'

const props = defineProps<{
  tenantId: string
  clientId: string
}>()

const protocols = ref<Protocol[]>([])
const page = ref(1)
const lastPage = ref(1)
const loading = ref(false)
const error = ref('')
let requestVersion = 0

const protocolStatuses: Record<string, string> = {
  open: 'Aberto',
  in_progress: 'Em atendimento',
  waiting: 'Aguardando retorno',
  resolved: 'Resolvido',
  cancelled: 'Cancelado',
  reopened: 'Reaberto',
}

async function load() {
  const version = ++requestVersion
  const tenantId = props.tenantId
  const clientId = props.clientId
  loading.value = true
  error.value = ''
  protocols.value = []

  try {
    const response = await protocolApi.list(tenantId, {
      client_id: clientId,
      page: String(page.value),
    })

    if (version !== requestVersion || tenantId !== props.tenantId || clientId !== props.clientId) {
      return
    }

    protocols.value = response.data
    lastPage.value = response.last_page
  } catch (cause) {
    if (version === requestVersion) {
      error.value = cause instanceof Error ? cause.message : 'Erro ao carregar protocolos.'
    }
  } finally {
    if (version === requestVersion) loading.value = false
  }
}

watch(
  () => [props.tenantId, props.clientId],
  () => { page.value = 1 },
)

watch(
  () => [props.tenantId, props.clientId, page.value],
  () => { void load() },
  { immediate: true },
)
</script>

<template>
  <section class="space-y-3">
    <p v-if="loading" class="py-6 text-center text-sm text-slate-500">
      Carregando protocolos…
    </p>
    <p v-else-if="error" class="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">
      {{ error }}
      <button type="button" class="underline" @click="load">
        Tentar novamente
      </button>
    </p>
    <template v-else>
      <div
        v-for="protocol in protocols"
        :key="protocol.id"
        class="rounded-xl border border-stone-200 bg-white p-4"
      >
        <div class="flex flex-wrap items-center justify-between gap-2">
          <span class="font-semibold text-slate-800">
            {{ protocol.code }} · {{ protocol.title }}
          </span>
          <span class="rounded-lg bg-stone-100 px-2 py-1 text-xs font-medium text-slate-700">
            {{ protocolStatuses[protocol.status] ?? protocol.status }}
          </span>
        </div>
        <p class="mt-2 text-sm text-slate-600">
          Responsável: {{ protocol.assignee_name || 'Não atribuído' }}
          · Aberto em {{ new Date(protocol.created_at).toLocaleDateString('pt-BR') }}
        </p>
        <p
          v-if="protocol.status === 'resolved' && protocol.resolved_at"
          class="mt-1 text-sm font-medium text-emerald-700"
        >
          Resolvido em: {{ new Date(protocol.resolved_at).toLocaleString('pt-BR') }}
        </p>
        <p v-if="protocol.due_at" class="mt-1 text-xs text-slate-500">
          Prazo: {{ new Date(protocol.due_at).toLocaleString('pt-BR') }}
        </p>
        <p v-if="protocol.description" class="mt-2 whitespace-pre-line text-sm text-slate-600">
          {{ protocol.description }}
        </p>
      </div>
      <p
        v-if="!protocols.length"
        class="rounded-xl border border-dashed border-stone-200 p-6 text-center text-sm text-slate-500"
      >
        Nenhum protocolo registrado para este cliente.
      </p>
      <div v-if="lastPage > 1" class="flex items-center justify-end gap-3 text-sm">
        <button
          type="button"
          class="secondary-button w-auto"
          :disabled="page <= 1"
          @click="page--"
        >
          Anterior
        </button>
        <span>{{ page }} / {{ lastPage }}</span>
        <button
          type="button"
          class="secondary-button w-auto"
          :disabled="page >= lastPage"
          @click="page++"
        >
          Próximo
        </button>
      </div>
    </template>
  </section>
</template>
