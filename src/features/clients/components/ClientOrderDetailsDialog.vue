<script setup lang="ts">
import AppDialog from '@/components/ui/AppDialog.vue'
import type { CommercialOrder } from '@/features/orders/api'

defineProps<{
  order: CommercialOrder | null
  loading: boolean
  error: string
}>()

defineEmits<{ close: [] }>()

const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

function date(value?: string | null) {
  if (!value) return '—'
  const [year, month, day] = value.slice(0, 10).split('-')
  return `${day}/${month}/${year}`
}
</script>

<template>
  <AppDialog
    :open="!!order"
    :title="order?.code ?? 'Detalhes do pedido'"
    description="Dados comerciais, situação e linhas do pedido."
    size="wide"
    @close="$emit('close')"
  >
    <div v-if="order" class="space-y-5">
      <p v-if="loading" class="text-sm text-slate-500">Carregando detalhes do pedido...</p>
      <p v-if="error" role="alert" class="rounded-lg bg-red-50 p-3 text-sm text-red-700">
        {{ error }}
      </p>

      <div class="grid gap-3 rounded-xl bg-stone-50 p-4 text-sm sm:grid-cols-3">
        <div><p class="text-slate-500">Cliente</p><p class="font-semibold">{{ order.customer_name }}</p></div>
        <div><p class="text-slate-500">Status</p><p class="font-semibold">{{ order.order_status ?? order.status }}</p></div>
        <div><p class="text-slate-500">Consultor</p><p class="font-semibold">{{ order.consultant_name ?? '—' }}</p></div>
        <div><p class="text-slate-500">Data da venda</p><p class="font-semibold">{{ date(order.sold_on) }}</p></div>
        <div><p class="text-slate-500">Ativação</p><p class="font-semibold">{{ date(order.activated_at) }}</p></div>
        <div><p class="text-slate-500">Conclusão</p><p class="font-semibold">{{ date(order.administratively_completed_at) }}</p></div>
        <div><p class="text-slate-500">Linhas</p><p class="font-semibold">{{ order.line_quantity }}</p></div>
        <div><p class="text-slate-500">Receita mensal</p><p class="font-semibold">{{ money.format(Number(order.monthly_amount ?? 0)) }}</p></div>
        <div><p class="text-slate-500">Tipo do pedido</p><p class="font-semibold">{{ order.order_type ?? '—' }}</p></div>
      </div>

      <section>
        <h3 class="mb-3 font-semibold text-slate-800">Linhas e serviços</h3>
        <div v-if="order.items?.length" class="overflow-x-auto rounded-xl border border-stone-200">
          <table class="w-full min-w-[650px] text-left text-sm">
            <thead class="bg-stone-50 text-xs uppercase text-slate-500">
              <tr>
                <th class="p-3">Número</th>
                <th class="p-3">Descrição</th>
                <th class="p-3 text-right">Quantidade</th>
                <th class="p-3 text-right">Mensalidade unitária</th>
                <th class="p-3">Ativação</th>
                <th class="p-3">Situação</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-stone-100">
              <tr v-for="item in order.items" :key="item.id">
                <td class="p-3">{{ item.line_number ?? '—' }}</td>
                <td class="p-3">{{ item.description ?? '—' }}</td>
                <td class="p-3 text-right">{{ item.quantity }}</td>
                <td class="p-3 text-right">{{ money.format(Number(item.monthly_unit_amount ?? 0)) }}</td>
                <td class="p-3">{{ date(item.activated_at) }}</td>
                <td class="p-3">{{ item.status ?? '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-else class="text-sm text-slate-500">
          {{ loading ? 'Carregando linhas...' : 'Nenhuma linha disponível nesta consulta.' }}
        </p>
      </section>
    </div>
    <template #footer>
      <div class="flex justify-end">
        <button type="button" class="secondary-button w-auto" @click="$emit('close')">
          Fechar
        </button>
      </div>
    </template>
  </AppDialog>
</template>
