<script setup lang="ts">
import { computed } from 'vue'
import ClientOrderDetailsDialog from './ClientOrderDetailsDialog.vue'
import { useClientOrderHistory } from '../composables/useClientOrderHistory'

const props = defineProps<{
  tenantId: string
  clientId: string
}>()

const tenantId = computed(() => props.tenantId)
const clientId = computed(() => props.clientId)
const enabled = computed(() => !!props.clientId)

const {
  orders,
  loading,
  error,
  selectedOrder,
  detailLoading,
  detailError,
  load,
  openDetails,
  closeDetails,
} = useClientOrderHistory(tenantId, clientId, enabled)

const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

function date(value?: string | null) {
  if (!value) return '—'
  const [year, month, day] = value.slice(0, 10).split('-')
  return `${day}/${month}/${year}`
}
</script>

<template>
  <section class="space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h3 class="text-lg font-semibold text-slate-800">Histórico de pedidos</h3>
        <p class="mt-1 text-sm text-slate-500">
          Pedidos comerciais do cliente, inclusive após a consolidação dos contratos.
        </p>
      </div>
      <button type="button" class="secondary-button w-auto" :disabled="loading" @click="load">
        Atualizar
      </button>
    </div>

    <p v-if="loading" class="py-6 text-center text-sm text-slate-500">Carregando pedidos...</p>
    <p v-else-if="error" role="alert" class="rounded-xl bg-red-50 p-4 text-sm text-red-700">
      {{ error }}
      <button type="button" class="ml-2 underline" @click="load">Tentar novamente</button>
    </p>
    <div v-else class="overflow-x-auto rounded-xl border border-stone-200">
      <table class="w-full min-w-[760px] text-left text-sm">
        <thead class="bg-stone-50 text-xs font-semibold uppercase text-slate-500">
          <tr>
            <th class="p-4">Pedido</th>
            <th class="p-4">Data da venda</th>
            <th class="p-4">Consultor</th>
            <th class="p-4">Linhas</th>
            <th class="p-4">Receita mensal</th>
            <th class="p-4">Situação</th>
            <th class="p-4 text-right">Ações</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-stone-100">
          <tr v-for="order in orders" :key="order.id" class="hover:bg-stone-50/70">
            <td class="p-4 font-semibold">{{ order.code ?? order.id.slice(0, 8) }}</td>
            <td class="p-4">{{ date(order.sold_on) }}</td>
            <td class="p-4">{{ order.consultant_name ?? '—' }}</td>
            <td class="p-4">{{ order.line_quantity }}</td>
            <td class="p-4">{{ money.format(Number(order.monthly_amount ?? 0)) }}</td>
            <td class="p-4">{{ order.order_status ?? order.status }}</td>
            <td class="p-4 text-right">
              <button type="button" class="secondary-button w-auto" @click="openDetails(order)">
                Ver detalhes
              </button>
            </td>
          </tr>
          <tr v-if="!orders.length">
            <td colspan="7" class="p-6 text-center text-slate-500">
              Nenhum pedido comercial encontrado para este cliente.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <ClientOrderDetailsDialog
      :order="selectedOrder"
      :loading="detailLoading"
      :error="detailError"
      @close="closeDetails"
    />
  </section>
</template>
