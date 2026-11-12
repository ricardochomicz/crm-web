<script setup lang="ts">
import { computed } from 'vue'
import AppDialog from '@/components/ui/AppDialog.vue'
import ContractConsolidationOrderCard from './ContractConsolidationOrderCard.vue'
import { useContractConsolidation } from '../composables/useContractConsolidation'

const props = defineProps<{
  open: boolean
  tenantId: string
  clientId: string | null
  clientName?: string
}>()

const emit = defineEmits<{
  close: []
  consolidated: []
}>()

const open = computed(() => props.open)
const tenantId = computed(() => props.tenantId)
const clientId = computed(() => props.clientId)

const {
  data,
  selections,
  busyOrderId,
  loading,
  error,
  success,
  contractOptions,
  load,
  consolidate,
} = useContractConsolidation(tenantId, clientId, open)

async function confirm(orderId: string) {
  if (await consolidate(orderId)) emit('consolidated')
}
</script>

<template>
  <AppDialog
    :open="open"
    :title="clientName ? `Consolidar pedidos · ${clientName}` : 'Consolidar pedidos do cliente'"
    description="Organize os pedidos por contrato. Somente contratos da mesma operadora e com classificação compatível podem receber o pedido."
    size="wide"
    :busy="!!busyOrderId"
    @close="emit('close')"
  >
    <div class="space-y-4" aria-live="polite">
      <p
        v-if="error"
        role="alert"
        class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
      >
        {{ error }}
        <button
          v-if="!busyOrderId"
          type="button"
          class="ml-2 underline"
          @click="load"
        >
          Tentar novamente
        </button>
      </p>
      <p
        v-if="success"
        role="status"
        class="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700"
      >
        {{ success }}
      </p>

      <p v-if="loading" class="py-8 text-center text-sm text-slate-500">
        Carregando pedidos...
      </p>
      <p
        v-else-if="!data.orders.length && !error"
        class="rounded-xl border border-stone-200 bg-stone-50 p-6 text-sm text-slate-500"
      >
        Nenhum pedido concluído pendente de consolidação.
      </p>

      <div v-else class="space-y-3">
        <p class="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
          Para cada pedido, escolha um contrato existente da mesma operadora ou crie um novo.
          O sistema impede vínculos entre operadoras diferentes.
        </p>
        <ContractConsolidationOrderCard
          v-for="order in data.orders"
          :key="order.id"
          v-model="selections[order.id]"
          :order="order"
          :options="contractOptions(order)"
          :busy="busyOrderId === order.id"
          :disabled="!!busyOrderId || loading"
          @confirm="confirm(order.id)"
        />
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end">
        <button
          type="button"
          class="secondary-button w-auto"
          :disabled="!!busyOrderId"
          @click="emit('close')"
        >
          Fechar
        </button>
      </div>
    </template>
  </AppDialog>
</template>
