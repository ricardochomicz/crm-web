<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { clientsApi, type ConsolidationOptions } from '../api'

const route = useRoute()
const router = useRouter()
const tenantId = computed(() => String(route.params.tenantId))
const clientId = computed(() => String(route.params.clientId))
const data = ref<ConsolidationOptions['data']>({ orders: [], contracts: [] })
const selections = ref<Record<string, string>>({})
const busy = ref(false)
const loading = ref(true)
const error = ref('')
const success = ref('')

async function load() {
  loading.value = true
  error.value = ''
  try {
    data.value = (await clientsApi.consolidationOptions(tenantId.value, clientId.value)).data
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Erro ao carregar pedidos.'
  } finally {
    loading.value = false
  }
}

async function consolidate(orderId: string) {
  if (busy.value) return
  busy.value = true
  error.value = ''
  success.value = ''
  try {
    const selected = selections.value[orderId]
    await clientsApi.consolidate(tenantId.value, clientId.value, orderId, selected || undefined)
    success.value = 'Pedido vinculado ao contrato com sucesso.'
    await load()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Não foi possível vincular o pedido.'
  } finally {
    busy.value = false
  }
}

watch([tenantId, clientId], () => void load(), { immediate: true })
</script>

<template>
  <main class="mx-auto max-w-5xl space-y-6 p-6">
    <button type="button" class="secondary-button" @click="router.push(`/empresas/${tenantId}/carteira`)">
      Voltar à carteira
    </button>
    <div>
      <h1 class="text-2xl font-semibold text-slate-900">Consolidar pedidos do cliente</h1>
      <p class="mt-2 text-sm text-slate-500">
        Selecione o contrato correto para cada pedido. Não agrupe contratos distintos apenas por terem a mesma operadora.
      </p>
    </div>
    <p v-if="error" role="alert" class="rounded-lg bg-red-50 p-3 text-sm text-red-700">{{ error }}</p>
    <p v-if="success" role="status" class="rounded-lg bg-green-50 p-3 text-sm text-green-700">{{ success }}</p>
    <p v-if="loading" class="text-sm text-slate-500">Carregando pedidos...</p>
    <div v-else-if="!data.orders.length" class="rounded-xl border bg-white p-6 text-sm text-slate-500">
      Nenhum pedido concluído pendente de consolidação.
    </div>
    <section v-else class="space-y-3">
      <article v-for="order in data.orders" :key="order.id" class="rounded-xl border border-stone-200 bg-white p-5">
        <div class="mb-3 flex flex-wrap justify-between gap-3">
          <div>
            <p class="font-semibold">{{ order.code ?? 'Pedido sem código' }}</p>
            <p class="text-sm text-slate-500">{{ order.operator_name }} · {{ order.line_quantity }} linhas</p>
          </div>
          <p class="text-sm font-medium">R$ {{ Number(order.monthly_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</p>
        </div>
        <label class="block text-sm font-medium text-slate-700">
          Destino do pedido
          <select v-model="selections[order.id]" class="field mt-1">
            <option value="">Criar um novo contrato</option>
            <option
              v-for="contract in data.contracts.filter((item) =>
                item.operator_id === order.operator_id &&
                (!order.classification_id || !item.classification_id || item.classification_id === order.classification_id)
              )"
              :key="contract.id"
              :value="contract.id"
            >
              Contrato {{ contract.id.slice(0, 8) }} · {{ contract.renewal_policy }}
            </option>
          </select>
        </label>
        <button type="button" class="primary-button mt-3" :disabled="busy" @click="consolidate(order.id)">
          {{ busy ? 'Salvando...' : 'Confirmar vínculo' }}
        </button>
      </article>
    </section>
  </main>
</template>
