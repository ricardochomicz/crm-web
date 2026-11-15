<script setup lang="ts">
import { ref, watch } from 'vue'
import SearchSelect from '@/components/ui/SearchSelect.vue'
import { commissionsApi, type CommissionRevisionPreview, type CommissionFinancialTotals } from '../api'

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
const revising = ref(false)
const selected = ref<string[]>([])
const reason = ref('')
const confirmation = ref(false)
const comparison = ref<Array<{ order_id: string; status: string; reason: string | null; current: CommissionFinancialTotals; projected: CommissionFinancialTotals | null }> | null>(null)
const comparing = ref(false)
const previewedSelection = ref('')
const outcome = ref<{ revised: number; skipped: number; failed: number } | null>(null)
let sequence = 0

watch(() => props.tenantId, () => {
  sequence++
  result.value = null
  selected.value = []
  outcome.value = null
  error.value = ''
  loading.value = false
})

async function preview() {
  const id = ++sequence
  result.value = null
  selected.value = []
  confirmation.value = false
  comparison.value = null
  previewedSelection.value = ''
  outcome.value = null
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
function toggle(id: string, checked: boolean) {
  selected.value = checked ? [...selected.value, id] : selected.value.filter(value => value !== id)
  confirmation.value = false
  comparison.value = null
  previewedSelection.value = ''
}
const money = (value: string | undefined) => Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const selectionKey = () => [operatorId.value, orderType.value, ...selected.value.slice().sort()].join('|')
async function compare() {
  if (!selected.value.length || comparing.value) return
  const key = selectionKey()
  comparing.value = true
  comparison.value = null
  confirmation.value = false
  error.value = ''
  try {
    const response = await commissionsApi.previewBulkRevision(props.tenantId, {
      order_ids: selected.value,
      operator_id: Number(operatorId.value),
      order_type: orderType.value,
    })
    if (key === selectionKey()) {
      comparison.value = response.data.orders
      previewedSelection.value = key
    }
  } catch {
    error.value = 'Não foi possível calcular a prévia financeira.'
  } finally {
    comparing.value = false
  }
}
async function revise() {
  if (!comparison.value || previewedSelection.value !== selectionKey() || comparison.value.some(row => row.status !== 'ready') || !confirmation.value || selected.value.length < 1 || selected.value.length > 20 || reason.value.trim().length < 10 || revising.value) return
  revising.value = true
  error.value = ''
  try {
    const response = await commissionsApi.bulkRevise(props.tenantId, {
      order_ids: selected.value,
      operator_id: Number(operatorId.value),
      order_type: orderType.value,
      reason: reason.value.trim(),
    })
    await preview()
    outcome.value = response.data
  } catch {
    error.value = 'Não foi possível executar a revisão. Nenhum sucesso foi confirmado.'
  } finally {
    revising.value = false
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
    <p v-if="outcome" class="mt-3 text-sm font-medium text-slate-700" role="status">
      Revisados: {{ outcome.revised }} · Ignorados: {{ outcome.skipped }} · Falhas: {{ outcome.failed }}.
      Confira o histórico de cada pedido.
    </p>
    <p v-if="error" class="mt-3 text-sm text-red-700" role="alert">{{ error }}</p>
    <template v-if="result">
      <p class="mt-4 text-sm text-slate-600">{{ result.message }}</p>
      <p v-if="result.truncated" class="mt-2 text-sm font-medium text-amber-800">
        Exibindo apenas os primeiros 100 pedidos. Refine o período.
      </p>
      <div v-if="result.orders.length" class="mt-3 overflow-x-auto">
        <table class="w-full min-w-[540px] text-sm">
          <thead><tr class="border-b text-left text-slate-500"><th class="py-3">Selecionar</th><th>Venda</th><th>Pedido</th><th class="text-right">Linhas pendentes</th></tr></thead>
          <tbody><tr v-for="order in result.orders" :key="order.order_id" class="border-b border-stone-100">
            <td class="py-3"><input type="checkbox" :checked="selected.includes(order.order_id)" :disabled="revising || (!selected.includes(order.order_id) && selected.length >= 20)" :aria-label="'Selecionar pedido ' + order.order_id" @change="toggle(order.order_id, ($event.target as HTMLInputElement).checked)" /></td>
            <td class="py-3">{{ formatDate(order.sold_on) }}</td>
            <td class="font-mono text-xs">{{ order.order_id }}</td>
            <td class="text-right">{{ order.pending_lines }}</td>
          </tr></tbody>
        </table>
      </div>
      <template v-if="result.orders.length">
        <div class="mt-4 space-y-3 border-t border-stone-200 pt-4">
          <p class="text-sm font-medium text-slate-700">Revisão auditada · {{ selected.length }} pedido(s) selecionado(s), máximo 20</p>
          <button class="secondary-button w-auto" type="button" :disabled="comparing || revising || selected.length === 0" @click="compare">
            {{ comparing ? 'Calculando prévia…' : 'Comparar valores antes da revisão' }}
          </button>
          <div v-if="comparison" class="overflow-x-auto rounded-xl border border-stone-200 p-3">
            <p class="mb-3 text-sm font-semibold">Prévia financeira — valores atuais e projetados</p>
            <table class="w-full min-w-[650px] text-sm">
              <thead><tr class="border-b text-left text-slate-500"><th class="py-2">Pedido</th><th>Situação</th><th class="text-right">Bruto atual</th><th class="text-right">Bruto projetado</th><th class="text-right">Líquido atual</th><th class="text-right">Líquido projetado</th><th class="text-right">Repasses atuais</th><th class="text-right">Repasses projetados</th></tr></thead>
              <tbody><tr v-for="row in comparison" :key="row.order_id" class="border-b border-stone-100">
                <td class="py-2 font-mono text-xs">{{ row.order_id.slice(0, 8) }}</td>
                <td>{{ row.status === 'ready' ? 'Apto' : 'Bloqueado: ' + row.reason }}</td>
                <td class="text-right">{{ money(row.current.gross_amount) }}</td>
                <td class="text-right">{{ row.projected ? money(row.projected.gross_amount) : '—' }}</td>
                <td class="text-right">{{ money(row.current.net_amount) }}</td>
                <td class="text-right">{{ row.projected ? money(row.projected.net_amount) : '—' }}</td>
                <td class="text-right">{{ money(row.current.participant_total) }}</td>
                <td class="text-right">{{ row.projected ? money(row.projected.participant_total) : '—' }}</td>
              </tr></tbody>
            </table>
            <div v-for="row in comparison.filter(item => item.projected)" :key="row.order_id" class="mt-3 border-t pt-3 text-xs text-slate-600">
              <p class="font-semibold">Pedido {{ row.order_id.slice(0, 8) }} — repasses por participante</p>
              <p v-for="participant in row.projected!.participants" :key="participant.role + participant.name">
                {{ participant.name }} ({{ participant.role }}): {{ money(participant.amount) }} projetado
              </p>
            </div>
          </div>
          <label class="block text-sm font-semibold text-slate-700">
            Motivo da revisão (mínimo 10 caracteres)
            <textarea v-model="reason" rows="2" maxlength="1000" class="mt-2 w-full rounded-xl border border-stone-200 p-3 text-sm" placeholder="Ex.: Regularização após cadastro de comissão com vigência retroativa" />
          </label>
          <label class="flex items-start gap-2 text-sm text-slate-700">
            <input v-model="confirmation" type="checkbox" class="mt-1" />
            Confirmo a criação de novas revisões apenas nos pedidos que passarem na validação das regras.
          </label>
          <button class="primary-button w-auto" type="button" :disabled="revising || loading || !comparison || previewedSelection !== selectionKey() || comparison.some(row => row.status !== 'ready') || selected.length === 0 || reason.trim().length < 10 || !confirmation" @click="revise">
            {{ revising ? 'Revisando…' : 'Revisar pedidos selecionados' }}
          </button>
          <p class="text-xs text-slate-500">Pedidos com regras incompletas ou valores inconsistentes serão ignorados; os resultados são informados após a operação.</p>
        </div>
      </template>
      <p v-else class="mt-3 text-sm text-slate-500">Nenhum pedido pendente encontrado para estes filtros.</p>
    </template>
  </section>
</template>
