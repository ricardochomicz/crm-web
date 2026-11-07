<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AppDialog from '@/components/ui/AppDialog.vue'
import OpportunityDetailsForm from './OpportunityDetailsForm.vue'
import OpportunityReceipt from './OpportunityReceipt.vue'
import { opportunitiesApi, type Opportunity, type OpportunityInput } from '../api'
import { errorMessage } from '@/lib/feedback'
import type { OrderType } from '@/features/order-types/api'
import type { Product } from '@/features/products/api'
import type { Client } from '@/features/clients/api'

const props = defineProps<{ open: boolean; tenantId: string; opportunity: Opportunity | null; clients: Client[]; products: Product[]; orderTypes: OrderType[] }>()
const emit = defineEmits<{ close: []; saved: [] }>()
const busy = ref(false)
const error = ref('')
const showImport = ref(false)
const pastedNumbers = ref('')
const batchProductId = ref('')
const batchTypeId = ref('')
const selectedBatchType = computed(() => props.orderTypes.find(type => type.id === batchTypeId.value))
const typeName = (id: string) => props.orderTypes.find(type => type.id === id)?.name ?? 'Tipo anterior'
const batchQuantity = ref(1)
const batchMonthly = ref(0)
const batchError = ref('')
const maxItems = 200
const lineCount = computed(() => form.value.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0))
const blank = (): OpportunityInput => ({
  code: '', title: '', client_id: '', order_type_id: '',
  description: null, expected_close_at: null,
  estimated_monthly_amount: 0, estimated_one_time_amount: 0, items: [],
})
const form = ref<OpportunityInput>(blank())
const totalMonthly = computed(() => form.value.items.reduce((sum, item) => sum + Number(item.monthly_unit_amount || 0) * Number(item.quantity || 0), 0))
const totalOnce = computed(() => form.value.items.reduce((sum, item) => sum + Number(item.one_time_unit_amount || 0) * Number(item.quantity || 0), 0))
function generateCode(): string {
  const now = new Date()
  const stamp = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0'), String(now.getHours()).padStart(2, '0'), String(now.getMinutes()).padStart(2, '0'), String(now.getSeconds()).padStart(2, '0')].join('')
  return 'OP-' + stamp + '-' + Math.random().toString(36).slice(2, 6).toUpperCase()
}
const money = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const parsedNumbers = computed(() => pastedNumbers.value.split(/[\s,;]+/).map(value => value.replace(/\D/g, '')).filter(Boolean))
function openImport() {
  pastedNumbers.value = ''
  batchProductId.value = ''
  batchTypeId.value = ''
  batchQuantity.value = 1
  batchMonthly.value = 0
  batchError.value = ''
  showImport.value = true
}
function chooseBatchPlan() {
  batchMonthly.value = Number(props.products.find(product => product.id === batchProductId.value)?.price ?? 0)
}
function addBatch() {
  batchError.value = ''
  const numbers = parsedNumbers.value
  const product = props.products.find(p => p.id === batchProductId.value && p.is_active)
  if (!selectedBatchType.value) { batchError.value = 'Selecione o tipo das linhas.'; return }
  if (selectedBatchType.value.requires_number && !numbers.length) { batchError.value = 'Cole pelo menos um número.'; return }
  if (!selectedBatchType.value.requires_number && (!Number.isInteger(Number(batchQuantity.value)) || Number(batchQuantity.value) < 1)) { batchError.value = 'Informe a quantidade de linhas novas.'; return }
  const count = !selectedBatchType.value.requires_number ? Number(batchQuantity.value) : numbers.length
  if (!product) { batchError.value = 'Selecione um plano ativo.'; return }
  if (!Number.isFinite(Number(batchMonthly.value)) || Number(batchMonthly.value) < 0) { batchError.value = 'Valor mensal inválido.'; return }
  if (count + form.value.items.length > maxItems) { batchError.value = 'Limite de 200 itens por oportunidade.'; return }
  const seen = new Set(form.value.items.map(item => (item.line_number ?? '').replace(/\D/g, '')).filter(Boolean))
  for (const number of selectedBatchType.value.requires_number ? numbers : []) {
    if (![10, 11].includes(number.length)) { batchError.value = 'Número inválido: ' + number; return }
    if (seen.has(number)) { batchError.value = 'Número duplicado: ' + number; return }
    seen.add(number)
  }
  form.value.items.push(...Array.from({ length: count }, (_, index) => ({
    order_type_id: batchTypeId.value,
    product_id: product.id, line_number: selectedBatchType.value.requires_number ? numbers[index] : null, description: product.name,
    quantity: 1, monthly_unit_amount: Number(batchMonthly.value),
    one_time_unit_amount: 0, notes: null,
  })))
  showImport.value = false
}
function validateLines(): boolean {
  if (!form.value.items.length) { error.value = 'Adicione pelo menos uma linha ou serviço.'; return false }
  const numbers = new Set<string>()
  for (const [index, item] of form.value.items.entries()) {
    if (props.orderTypes.find(type => type.id === item.order_type_id)?.requires_number && !item.line_number) { error.value = `O tipo do item ${index + 1} exige número.`; return false }
    if (!item.product_id) { error.value = `Selecione o plano do item ${index + 1}.`; return false }
    const number = (item.line_number ?? '').replace(/\D/g, '')
    if (number && ![10, 11].includes(number.length)) { error.value = `Informe o telefone com DDD no item ${index + 1}.`; return false }
    if (number && numbers.has(number)) { error.value = 'Existem números de linha duplicados.'; return false }
    if (number) numbers.add(number)
    if (number && Number(item.quantity) !== 1) { error.value = 'Uma linha identificada deve ter quantidade 1.'; return false }
  }
  return true
}
watch(() => [props.open, props.opportunity] as const, () => {
  if (!props.open) return
  error.value = ''
  showImport.value = false
  form.value = props.opportunity ? {
    code: props.opportunity.code, title: props.opportunity.title,
    client_id: props.opportunity.client_id, order_type_id: props.opportunity.order_type_id ?? '',
    description: props.opportunity.description,
    expected_close_at: props.opportunity.expected_close_at?.slice(0, 10) ?? null,
    estimated_monthly_amount: Number(props.opportunity.estimated_monthly_amount),
    estimated_one_time_amount: Number(props.opportunity.estimated_one_time_amount),
    items: (props.opportunity.items ?? []).map(item => ({ ...item, quantity: Number(item.quantity), monthly_unit_amount: Number(item.monthly_unit_amount), one_time_unit_amount: Number(item.one_time_unit_amount) })),
  } : { ...blank(), code: generateCode() }
}, { immediate: true })
async function save() {
  if (busy.value) return
  if (!form.value.client_id) { error.value = 'Selecione um cliente.'; return }
  if (!form.value.order_type_id) { error.value = 'Selecione o tipo da negociação.'; return }
  if (!validateLines()) return
  busy.value = true
  error.value = ''
  try {
    const payload = { ...form.value, expected_close_at: form.value.expected_close_at || null, estimated_monthly_amount: totalMonthly.value, estimated_one_time_amount: totalOnce.value, items: form.value.items.map(item => ({ ...item, line_number: item.line_number?.replace(/\D/g, '') || null })) }
    if (props.opportunity) await opportunitiesApi.update(props.tenantId, props.opportunity.id, payload)
    else await opportunitiesApi.create(props.tenantId, payload)
    emit('saved')
  } catch (e) { error.value = errorMessage(e) }
  finally { busy.value = false }
}
</script>
<template>
  <AppDialog :open="open" :title="opportunity ? 'Editar oportunidade' : 'Nova oportunidade'"
    description="Organize a negociação, seus serviços e valores." :busy="busy" size="full" @close="emit('close')">
    <form class="flex min-h-full flex-col gap-5" @submit.prevent="save">
      <div class="grid flex-1 gap-6 xl:grid-cols-[minmax(0,1fr)_350px]">
        <fieldset :disabled="busy" class="min-w-0 space-y-6">
          <OpportunityDetailsForm v-model="form" :clients="clients" :order-types="orderTypes" />
          <section class="space-y-4 rounded-2xl border border-stone-200 bg-stone-50/60 p-4 sm:p-5">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div><h3 class="text-lg font-semibold">Linhas e serviços</h3><p class="text-xs text-slate-500">Cole números do Excel em lotes, cada lote com seu plano.</p></div>
              <button type="button" class="primary-button w-auto" :disabled="form.items.length >= maxItems" @click="openImport">+ Importar linhas</button>
            </div>
            <p v-if="!form.items.length" class="rounded-xl border border-dashed border-stone-300 bg-white p-8 text-center text-sm text-slate-500">Nenhuma linha adicionada.</p>
            <div v-else class="max-h-[420px] overflow-auto rounded-xl border border-stone-200 bg-white">
              <table class="w-full min-w-[500px] text-left text-sm">
                <thead class="sticky top-0 bg-stone-100 text-xs uppercase text-slate-500"><tr><th class="p-3">Número</th><th class="p-3">Plano</th><th class="p-3 text-right">Mensal</th><th class="p-3 text-right">Ação</th></tr></thead>
                <tbody><tr v-for="(item, index) in form.items" :key="item.id ?? index" class="border-t border-stone-100">
                  <td class="p-3 font-medium">{{ item.line_number || 'Número pendente' }}<span class="ml-2 text-xs text-slate-400">{{ typeName(item.order_type_id) }}</span></td><td class="p-3">{{ item.description }}</td>
                  <td class="p-3 text-right">{{ money(Number(item.monthly_unit_amount) * Number(item.quantity)) }}</td>
                  <td class="p-3 text-right"><button type="button" class="font-semibold text-red-600 hover:underline" @click="form.items.splice(index, 1)">Excluir</button></td>
                </tr></tbody>
              </table>
            </div>
            <p class="text-sm font-semibold">{{ lineCount }} linha(s) · {{ money(totalMonthly) }}/mês</p>
          </section>
          <label class="block space-y-2 text-sm font-semibold text-slate-700">Observações
            <textarea v-model="form.description" class="field" rows="3" placeholder="Detalhes da negociação" />
          </label>
        </fieldset>
        <OpportunityReceipt :form="form" :order-types="orderTypes" />
      </div>
      <p v-if="error" role="alert" class="rounded-xl bg-red-50 p-3 text-sm text-red-700">{{ error }}</p>
      <footer class="sticky bottom-0 z-10 -mx-6 -mb-6 flex items-center justify-between gap-3 border-t border-stone-200 bg-white px-6 py-4 sm:-mx-8 sm:px-8">
        <span class="hidden text-sm font-semibold text-slate-600 sm:block">{{ lineCount }} itens · {{ money(totalMonthly) }}/mês</span>
        <div class="ml-auto flex gap-2">
          <button type="button" class="secondary-button w-auto" :disabled="busy" @click="emit('close')">Cancelar</button>
          <button type="submit" class="primary-button w-auto" :disabled="busy">{{ busy ? 'Salvando…' : 'Salvar oportunidade' }}</button>
        </div>
      </footer>
    </form>
  </AppDialog>
  <AppDialog :open="open && showImport" title="Importar linhas" description="Escolha o tipo de operação, informe as linhas e associe um plano ao lote." size="wide" @close="showImport = false">
    <div class="space-y-4">
      <label class="block space-y-2 text-sm font-semibold">Tipo das linhas
        <select v-model="batchTypeId" class="field" required>
          <option value="">Selecione o tipo</option>
          <option v-for="type in orderTypes" :key="type.id" :value="type.id">{{ type.name }}</option>
        </select>
      </label>
      <label v-if="selectedBatchType && !selectedBatchType.requires_number" class="block space-y-2 text-sm font-semibold">Quantidade de linhas novas
        <input v-model.number="batchQuantity" class="field" type="number" min="1" :max="maxItems - form.items.length" />
      </label>
      <label v-else-if="selectedBatchType?.requires_number" class="block space-y-2 text-sm font-semibold">Números (um por linha)
        <textarea v-model="pastedNumbers" class="field min-h-48 font-mono" rows="8" placeholder="42988080544&#10;42988080541&#10;42988080542" />
      </label>
      <div class="grid gap-4 sm:grid-cols-2">
        <label class="block space-y-2 text-sm font-semibold">Plano do lote
          <select v-model="batchProductId" class="field" @change="chooseBatchPlan">
            <option value="">Selecione o plano</option>
            <option v-for="product in products.filter(p => p.is_active)" :key="product.id" :value="product.id">{{ product.name }} — {{ money(Number(product.price)) }}</option>
          </select>
        </label>
        <label class="block space-y-2 text-sm font-semibold">Valor mensal por linha
          <input v-model.number="batchMonthly" class="field" type="number" min="0" step="0.01" />
        </label>
      </div>
      <p class="rounded-xl bg-stone-50 p-4 text-sm">{{ selectedBatchType && !selectedBatchType.requires_number ? batchQuantity : parsedNumbers.length }} linhas · Total mensal do lote: <strong>{{ money((selectedBatchType && !selectedBatchType.requires_number ? Number(batchQuantity) : parsedNumbers.length) * Number(batchMonthly || 0)) }}</strong></p>
      <p v-if="batchError" role="alert" class="text-sm text-red-700">{{ batchError }}</p>
      <div class="flex justify-end gap-3 border-t pt-4">
        <button type="button" class="secondary-button w-auto" @click="showImport = false">Cancelar</button>
        <button type="button" class="primary-button w-auto" @click="addBatch">Adicionar {{ selectedBatchType && !selectedBatchType.requires_number ? batchQuantity : parsedNumbers.length }} linhas</button>
      </div>
    </div>
  </AppDialog>
</template>
