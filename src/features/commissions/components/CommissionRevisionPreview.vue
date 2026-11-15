<script setup lang="ts">
import { ref, watch } from 'vue'
import SearchSelect from '@/components/ui/SearchSelect.vue'
import { commissionsApi, type CommissionRevisionPreview } from '../api'

const props = defineProps<{
  tenantId: string
  operators: Array<{ id: number; name: string }>
  orderTypes: Array<{ value: string; label: string }>
}>()

const operatorId = ref('')
const orderType = ref('')
const from = ref('')
const to = ref('')
const result = ref<CommissionRevisionPreview | null>(null)
const error = ref('')
const loading = ref(false)
let sequence = 0

watch(() => props.tenantId, () => {
  sequence++
  result.value = null
  error.value = ''
  loading.value = false
})

async function preview() {
  const id = ++sequence
  result.value = null
  error.value = ''
  if (!operatorId.value || !orderType.value) {
    error.value = 'Selecione a operadora e o tipo de pedido.'
    return
  }
  loading.value = true
  try {
    const response = await commissionsApi.revisionPreview(props.tenantId, {
      operator_id: Number(operatorId.value),
      order_type: orderType.value,
      ...(from.value ? { from: from.value } : {}),
      ...(to.value ? { to: to.value } : {}),
    })
    if (id === sequence) result.value = response.data
  } catch {
    if (id === sequence) error.value = 'Não foi possível consultar os pedidos pendentes.'
  } finally {
    if (id === sequence) loading.value = false
  }
}
function formatDate(value: string) {
  return value.slice(0, 10).split('-').reverse().join('/')
}
</script>

<template>
  <section class="mt-6 rounded-2xl border border-stone-200 bg-white p-5">
    <h2 class="text-lg font-semibold text-slate-800">Pedidos impactados por novas regras</h2>
    <p class="mt-1 text-sm text-slate-500">
      Consulte vendas anteriores que continuam com comissões pendentes. A consulta não recalcula valores.
    </p>
    <form class="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" @submit.prevent="preview">
      <label class="text-xs font-semibold text-slate-600">
        Operadora
        <SearchSelect v-model="operatorId" :options="[{ value: '', label: 'Selecione' }, ...operators.map(o => ({ value: String(o.id), label: o.name }))]" />
      </label>
      <label class="text-xs font-semibold text-slate-600">
        Tipo de pedido
        <SearchSelect v-model="orderType" :options="[{ value: '', label: 'Selecione' }, ...orderTypes]" />
      </label>
      <label class="text-xs font-semibold text-slate-600">
        Venda a partir de
        <input v-model="from" type="date" class="field mt-1 w-full" />
      </label>
      <label class="text-xs font-semibold text-slate-600">
        Venda até
        <input v-model="to" type="date" :min="from || undefined" class="field mt-1 w-full" />
      </label>
      <div class="sm:col-span-2 xl:col-span-4">
        <button class="secondary-button w-auto" type="submit" :disabled="loading">
          {{ loading ? 'Consultando…' : 'Ver pedidos pendentes' }}
        </button>
      </div>
    </form>
    <p v-if="error" class="mt-3 text-sm text-red-700" role="alert">{{ error }}</p>
    <template v-if="result">
      <p class="mt-4 text-sm text-slate-600">{{ result.message }}</p>
      <p v-if="result.truncated" class="mt-2 text-sm font-medium text-amber-800">
        Exibindo apenas os primeiros 100 pedidos. Refine o período.
      </p>
      <div v-if="result.orders.length" class="mt-3 overflow-x-auto">
        <table class="w-full min-w-[540px] text-sm">
          <thead><tr class="border-b text-left text-slate-500"><th class="py-3">Venda</th><th>Pedido</th><th class="text-right">Linhas pendentes</th></tr></thead>
          <tbody><tr v-for="order in result.orders" :key="order.order_id" class="border-b border-stone-100">
            <td class="py-3">{{ formatDate(order.sold_on) }}</td>
            <td class="font-mono text-xs">{{ order.order_id }}</td>
            <td class="text-right">{{ order.pending_lines }}</td>
          </tr></tbody>
        </table>
      </div>
      <p v-else class="mt-3 text-sm text-slate-500">Nenhum pedido pendente encontrado para estes filtros.</p>
    </template>
  </section>
</template>
