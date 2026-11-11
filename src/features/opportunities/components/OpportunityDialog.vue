<script setup lang="ts">
import TimelinePanel from '@/features/timeline/components/TimelinePanel.vue'
import AppCheckbox from '@/components/ui/AppCheckbox.vue'
import AppAutocomplete from '@/components/ui/AppAutocomplete.vue'
import AppCurrencyField from '@/components/ui/AppCurrencyField.vue'
import { computed, ref, watch } from 'vue'
import { tenantApi } from '@/features/tenants/api'
import type { Tenant } from '@/features/tenants/types'
import AppDialog from '@/components/ui/AppDialog.vue'
import OpportunityDetailsForm from './OpportunityDetailsForm.vue'
import OpportunityReceipt from './OpportunityReceipt.vue'
import OpportunityComparisonPanel from './OpportunityComparisonPanel.vue'
import OpportunityProposalPanel from './OpportunityProposalPanel.vue'
import OpportunityAppointmentsPanel from './OpportunityAppointmentsPanel.vue'
import ClientDocumentsPanel from './ClientDocumentsPanel.vue'
import OpportunityLineEditDialog from './OpportunityLineEditDialog.vue'
import OpportunityBulkEditDialog from './OpportunityBulkEditDialog.vue'
import { opportunitiesApi, type Opportunity, type OpportunityInput } from '../api'
import { errorMessage } from '@/lib/feedback'
import type { OrderType } from '@/features/order-types/api'
import type { Product } from '@/features/products/api'
import type { TenantOperator } from '@/features/operators/api'
import { clientsApi, type Client } from '@/features/clients/api'
import QuickClientOnboardingDialog from '@/features/clients/components/QuickClientOnboardingDialog.vue'
import type { Contact } from '@/features/clients/api'

const props = defineProps<{ initialTab?: 'details' | 'history'; open: boolean; tenantId: string; opportunity: Opportunity | null; clients: Client[]; products: Product[]; operators: TenantOperator[]; orderTypes: OrderType[] }>()
const emit = defineEmits<{ close: []; saved: [] }>()
const activeTab = ref<'details' | 'documents' | 'history' | 'comparison' | 'appointments' | 'proposal'>('details')
const viewerTenant = ref<Tenant | null>(null)
const showResponsible = computed(() => !!viewerTenant.value && (['OWNER', 'MANAGER'].includes(viewerTenant.value.role) || viewerTenant.value.role === 'CONSULTANT' && viewerTenant.value.access?.permissions.includes('teams.view')))
watch(() => [props.open, props.tenantId], async () => {
  if (!props.open) return
  try { viewerTenant.value = (await tenantApi.show(props.tenantId)).data } catch { viewerTenant.value = null }
}, { immediate: true })
const clientContacts = ref<Contact[]>([])
const loadingClientContacts = ref(false)
let contactRequestVersion = 0

const busy = ref(false)
const quickClientOpen = ref(false)
const canCreateClient = ref(false)
const availableClients = ref<Client[]>([])
watch(() => [props.open, props.clients] as const, () => { if (props.open) availableClients.value = [...props.clients] }, { immediate: true })
watch(() => [props.open, props.tenantId] as const, async () => {
  if (!props.open) return
  try { canCreateClient.value = (await clientsApi.list(props.tenantId)).meta.can_create }
  catch { canCreateClient.value = false }
}, { immediate: true })
function onClientCreated(client: Client) {
  availableClients.value = [...availableClients.value.filter(item => item.id !== client.id), client]
  form.value.client_id = client.id
  quickClientOpen.value = false
}
const error = ref('')
const showImport = ref(false)
const editingLineIndex = ref<number | null>(null)
const selectedLineIndices = ref<number[]>([])
const lineSearch = ref('')
const filteredLineIndices = computed(() => form.value.items.map((_, index) => index).filter(index => {
  const query = lineSearch.value.replace(/\D/g, '')
  return !query || (form.value.items[index]?.line_number ?? '').replace(/\D/g, '').includes(query)
}))
const showBulkEdit = ref(false)
const allSelected = computed(() => form.value.items.length > 0 && selectedLineIndices.value.length === form.value.items.length)
const selectedItems = computed(() => selectedLineIndices.value.map(index => form.value.items[index]).filter((item): item is OpportunityInput['items'][number] => !!item))
function toggleLine(index: number, checked: boolean) {
  selectedLineIndices.value = checked ? [...selectedLineIndices.value.filter(i => i !== index), index] : selectedLineIndices.value.filter(i => i !== index)
}
function toggleAll(checked: boolean) { selectedLineIndices.value = checked ? form.value.items.map((_, index) => index) : [] }
function removeLine(index: number) {
  form.value.items.splice(index, 1)
  selectedLineIndices.value = selectedLineIndices.value.filter(i => i !== index).map(i => i > index ? i - 1 : i)
}
function applyBulk(changes: { order_type_id?: string; product_id?: string; monthly_unit_amount?: number }) {
  const product = changes.product_id ? filteredProducts.value.find(p => p.id === changes.product_id) : null
  for (const index of selectedLineIndices.value) {
    const item = form.value.items[index]
    if (!item) continue
    form.value.items.splice(index, 1, {
      ...item, ...changes, ...(product ? { description: product.name } : {}),
    })
  }
  selectedLineIndices.value = []
  showBulkEdit.value = false
}
const editingLine = computed(() => editingLineIndex.value === null ? null : form.value.items[editingLineIndex.value] ?? null)
const otherNumbers = computed(() => form.value.items.filter((_, i) => i !== editingLineIndex.value).map(i => (i.line_number ?? '').replace(/\D/g, '')).filter(Boolean))
function updateLine(item: OpportunityInput['items'][number]) { if (editingLineIndex.value !== null) form.value.items.splice(editingLineIndex.value, 1, item); editingLineIndex.value = null }
const pastedNumbers = ref('')
const batchProductId = ref('')
const batchTypeId = ref('')
const filteredProducts = computed(() => props.products.filter(p => p.is_active && Number(p.operator_id) === Number(form.value.operator_id)))
const operatorOptions = computed(() => props.operators.map(operator => ({ id: operator.id, name: operator.name })))
const activePlanOptions = computed(() => filteredProducts.value.map(p => ({
  id: p.id, name: p.name + ' — ' + money(Number(p.price)),
})))
watch(batchProductId, () => chooseBatchPlan())
const selectedBatchType = computed(() => props.orderTypes.find(type => type.id === batchTypeId.value))
const typeName = (id: string) => props.orderTypes.find(type => type.id === id)?.name ?? 'Tipo anterior'
const batchQuantity = ref(1)
const batchMonthly = ref(0)
const batchError = ref('')
const maxItems = 200
const lineCount = computed(() => form.value.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0))
const blank = (): OpportunityInput => ({
  code: '', title: '', client_id: '', order_type_id: '', operator_id: null,
  description: null, expected_close_at: null,
  estimated_monthly_amount: 0, estimated_one_time_amount: 0, items: [],
})
const form = ref<OpportunityInput>(blank())
watch(() => [props.open, props.tenantId, form.value.client_id] as const, async ([isOpen, tenantId, clientId]) => {
  const current = ++contactRequestVersion
  clientContacts.value = []
  loadingClientContacts.value = false
  if (!isOpen || !clientId) return
  loadingClientContacts.value = true
  try {
    const result = await clientsApi.show(tenantId, clientId)
    if (current === contactRequestVersion) clientContacts.value = result.data.contacts ?? []
  } catch {
    if (current === contactRequestVersion) clientContacts.value = []
  } finally {
    if (current === contactRequestVersion) loadingClientContacts.value = false
  }
})
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
  batchMonthly.value = Number(filteredProducts.value.find(product => product.id === batchProductId.value)?.price ?? 0)
}
function addBatch() {
  batchError.value = ''
  const numbers = parsedNumbers.value
  const product = filteredProducts.value.find(p => p.id === batchProductId.value && p.is_active)
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
function changeOperator(id: number | null) {
  if (id === form.value.operator_id) return
  if (form.value.items.length && !window.confirm('Alterar a operadora removerá as linhas e planos da oportunidade. Deseja continuar?')) return
  form.value.items = []
  selectedLineIndices.value = []
  batchProductId.value = ''
  form.value.operator_id = id
}
function validateLines(): boolean {
  if (!form.value.items.length) { error.value = 'Adicione pelo menos uma linha ou serviço.'; return false }
  const numbers = new Set<string>()
  for (const [index, item] of form.value.items.entries()) {
    if (props.orderTypes.find(type => type.id === item.order_type_id)?.requires_number && !item.line_number) { error.value = `O tipo do item ${index + 1} exige número.`; return false }
    if (!filteredProducts.value.some(product => product.id === item.product_id)) { error.value = `O plano do item ${index + 1} não pertence à operadora selecionada.`; return false }
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
  activeTab.value = props.opportunity ? (props.initialTab ?? 'details') : 'details'
  error.value = ''
  showImport.value = false
  editingLineIndex.value = null
  selectedLineIndices.value = []
  showBulkEdit.value = false
  form.value = props.opportunity ? {
    code: props.opportunity.code, title: props.opportunity.title,
    client_id: props.opportunity.client_id, order_type_id: props.opportunity.order_type_id ?? '', operator_id: props.opportunity.operator_id,
    description: props.opportunity.description,
    expected_close_at: props.opportunity.expected_close_at?.slice(0, 10) ?? null,
    estimated_monthly_amount: Number(props.opportunity.estimated_monthly_amount),
    estimated_one_time_amount: Number(props.opportunity.estimated_one_time_amount),
    items: (props.opportunity.items ?? []).map(item => ({ ...item, quantity: Number(item.quantity), monthly_unit_amount: Number(item.monthly_unit_amount), one_time_unit_amount: Number(item.one_time_unit_amount) })),
  } : { ...blank(), code: generateCode(), operator_id: operatorOptions.value.length === 1 ? operatorOptions.value[0]!.id : null }
}, { immediate: true })
async function save() {
  if (busy.value) return
  if (!form.value.operator_id) { error.value = 'Selecione a operadora da oportunidade.'; return }
  if (!form.value.client_id) { error.value = 'Selecione um cliente.'; return }
  if (!form.value.order_type_id) { error.value = 'Selecione o tipo da negociação.'; return }
  if (!form.value.expected_close_at) { error.value = 'Informe a previsão de fechamento da oportunidade.'; return }
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
    <div v-if="opportunity && showResponsible" class="mb-3 flex items-center gap-2 text-sm text-slate-600"><span class="font-medium">Consultor responsável:</span><span class="font-semibold text-slate-900">{{ opportunity.assignee?.user?.name || "Não atribuído" }}</span></div>
    <div v-if="opportunity" class="mb-5 flex gap-2 border-b border-stone-200 pb-3">
        <button type="button" class="rounded-lg px-4 py-2 text-sm font-semibold" :class="activeTab === 'details' ? 'bg-orange-50 text-orange-700' : 'text-slate-600'" @click="activeTab = 'details'">Dados da oportunidade</button>
        <button type="button" class="rounded-lg px-4 py-2 text-sm font-semibold" :class="activeTab === 'documents' ? 'bg-orange-50 text-orange-700' : 'text-slate-600'" @click="activeTab = 'documents'">Anexos do Cliente</button>
        <button type="button" class="rounded-lg px-4 py-2 text-sm font-semibold" :class="activeTab === 'history' ? 'bg-orange-50 text-orange-700' : 'text-slate-600'" @click="activeTab = 'history'">Histórico</button>
        <button type="button" class="rounded-lg px-4 py-2 text-sm font-semibold" :class="activeTab === 'appointments' ? 'bg-orange-50 text-orange-700' : 'text-slate-600'" @click="activeTab = 'appointments'">Agendamentos</button>
        <button type="button" class="rounded-lg px-4 py-2 text-sm font-semibold" :class="activeTab === 'comparison' ? 'bg-orange-50 text-orange-700' : 'text-slate-600'" @click="activeTab = 'comparison'">Comparativo de operadoras</button>
        <button type="button" class="rounded-lg px-4 py-2 text-sm font-semibold" :class="activeTab === 'proposal' ? 'bg-orange-50 text-orange-700' : 'text-slate-600'" @click="activeTab = 'proposal'">Proposta comercial</button>
    </div>
    <OpportunityProposalPanel v-if="open && opportunity && activeTab === 'proposal'" :opportunity="opportunity" :tenant-id="tenantId" :company-name="viewerTenant?.name ?? 'Empresa'" />
    <ClientDocumentsPanel v-if="open && opportunity && activeTab === 'documents'" :tenant-id="tenantId" :client-id="opportunity.client_id" :can-upload="!!viewerTenant?.access?.permissions.includes('clients.update')" />
    <OpportunityAppointmentsPanel v-if="open && opportunity && activeTab === 'appointments'" :tenant-id="tenantId" :opportunity-id="opportunity.id" :client-id="opportunity.client_id" :title="opportunity.title" />
    <OpportunityComparisonPanel v-if="open && opportunity && activeTab === 'comparison'" :tenant-id="tenantId" :opportunity-id="opportunity.id" :products="products" :operators="operators" />
    <TimelinePanel v-if="open && opportunity && activeTab === 'history'" :tenant-id="tenantId" type="opportunity" :subject-id="opportunity.id" :can-write="true" />
    <form id="opportunity-details-form" v-show="activeTab === 'details'" class="flex flex-col gap-5" @submit.prevent="save">
      <div class="grid flex-1 gap-6 xl:grid-cols-[minmax(0,1fr)_350px]">
        <fieldset :disabled="busy" class="min-w-0 space-y-6">
          <OpportunityDetailsForm v-model="form" :clients="availableClients" :can-create-client="canCreateClient" :client-contacts="clientContacts" :loading-client-contacts="loadingClientContacts" :order-types="orderTypes" :operators="operatorOptions" @change-operator="changeOperator" @create-client="quickClientOpen = true" />
          <section class="space-y-4 rounded-2xl border border-stone-200 bg-stone-50/60 p-4 sm:p-5">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div><h3 class="text-lg font-semibold">Linhas e serviços</h3><p class="text-xs text-slate-500">Cole números do Excel em lotes, cada lote com seu plano.</p></div>
              <button type="button" class="primary-button w-auto" :disabled="form.items.length >= maxItems" @click="openImport">+ Importar linhas</button>
            </div>
            <div v-if="selectedLineIndices.length" class="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-orange-50 px-4 py-3">
              <span class="text-sm font-semibold text-orange-900">{{ selectedLineIndices.length }} linha(s) selecionada(s)</span>
              <div class="flex gap-2">
                <button type="button" class="secondary-button w-auto" @click="selectedLineIndices = []">Limpar seleção</button>
                <button type="button" class="primary-button w-auto" @click="showBulkEdit = true">Editar selecionadas</button>
              </div>
            </div>
            <div v-if="form.items.length" class="flex flex-wrap items-end justify-between gap-3">
              <label class="block w-full max-w-sm space-y-1 text-xs font-semibold text-slate-600">Buscar número da linha
                <input v-model="lineSearch" class="field w-full" type="search" inputmode="numeric" placeholder="Número completo ou parte dele" />
              </label>
              <span class="text-xs text-slate-500">Exibindo {{ filteredLineIndices.length }} de {{ form.items.length }} linhas</span>
            </div>
            <p v-if="!form.items.length" class="rounded-xl border border-dashed border-stone-300 bg-white p-8 text-center text-sm text-slate-500">Nenhuma linha adicionada.</p>
            <div v-else class="overflow-auto rounded-xl border border-stone-200 bg-white" :class="form.items.length > 10 ? 'max-h-[480px]' : ''">
              <table class="w-full min-w-[500px] text-left text-sm">
                <thead class="sticky top-0 bg-stone-100 text-xs uppercase text-slate-500"><tr><th class="p-3"><div class="flex items-center gap-3"><AppCheckbox label="Selecionar todas as linhas" :show-label="false" :model-value="allSelected" :indeterminate="selectedLineIndices.length > 0 && !allSelected" @update:model-value="toggleAll" /><span>Número</span></div></th><th class="p-3">Plano</th><th class="p-3 text-right">Mensal</th><th class="p-3 text-right">Ação</th></tr></thead>
                <tbody><tr v-for="index in filteredLineIndices" :key="form.items[index]?.id ?? index" class="border-t border-stone-100 transition-colors" :class="selectedLineIndices.includes(index) ? 'bg-orange-50/70' : 'hover:bg-stone-50'">
                  <td class="p-3 font-medium"><div class="flex items-center gap-3"><AppCheckbox :label="'Selecionar linha ' + (index + 1)" :show-label="false" :model-value="selectedLineIndices.includes(index)" @update:model-value="checked => toggleLine(index, checked)" /><span>{{ form.items[index]?.line_number || 'Número pendente' }}<span class="ml-2 text-xs text-slate-400">{{ typeName(form.items[index]?.order_type_id ?? '') }}</span></span></div></td><td class="p-3">{{ form.items[index]?.description }}</td>
                  <td class="p-3 text-right">{{ money(Number(form.items[index]?.monthly_unit_amount) * Number(form.items[index]?.quantity)) }}</td>
                  <td class="p-3 text-right"><div class="flex justify-end gap-3"><button type="button" class="font-semibold text-blue-700 hover:underline" @click="editingLineIndex = index">Editar</button><button type="button" class="font-semibold text-red-600 hover:underline" @click="removeLine(index)">Excluir</button></div></td>
                </tr><tr v-if="!filteredLineIndices.length"><td colspan="4" class="p-6 text-center text-sm text-slate-500">Nenhuma linha encontrada.</td></tr></tbody>
              </table>
            </div>
            <p class="text-sm font-semibold">{{ lineCount }} linha(s) · {{ money(totalMonthly) }}/mês</p>
          </section>
        </fieldset>
        <OpportunityReceipt :form="form" :order-types="orderTypes" />
      </div>
      <p v-if="error" role="alert" class="rounded-xl bg-red-50 p-3 text-sm text-red-700">{{ error }}</p>
    </form>
    <template v-if="activeTab === 'details'" #footer>
      <div class="flex flex-wrap items-center justify-between gap-3">
        <span class="hidden text-sm font-semibold text-slate-600 sm:block">{{ lineCount }} itens · {{ money(totalMonthly) }}/mês</span>
        <div class="ml-auto flex gap-2">
          <button type="button" class="secondary-button w-auto" :disabled="busy" @click="emit('close')">Cancelar</button>
          <button type="submit" form="opportunity-details-form" class="primary-button w-auto" :disabled="busy">{{ busy ? 'Salvando…' : 'Salvar oportunidade' }}</button>
        </div>
      </div>
    </template>
  </AppDialog>
  <QuickClientOnboardingDialog :open="open && quickClientOpen" :tenant-id="tenantId"
    @close="quickClientOpen = false" @created="onClientCreated" />
  <OpportunityBulkEditDialog :open="open && showBulkEdit" :items="selectedItems" :products="filteredProducts" :order-types="orderTypes" @close="showBulkEdit = false" @apply="applyBulk" />
  <OpportunityLineEditDialog :open="open && editingLineIndex !== null" :item="editingLine" :products="products" :order-types="orderTypes" :existing-numbers="otherNumbers" @close="editingLineIndex = null" @save="updateLine" />
  <AppDialog :open="open && showImport" title="Importar linhas" description="Escolha o tipo de operação, informe as linhas e associe um plano ao lote." size="wide" @close="showImport = false">
    <div class="space-y-4">
      <AppAutocomplete v-model="batchTypeId" label="Tipo das linhas" placeholder="Buscar tipo das linhas" :options="orderTypes" />
      <label v-if="selectedBatchType && !selectedBatchType.requires_number" class="block space-y-2 text-sm font-semibold">Quantidade de linhas novas
        <input v-model.number="batchQuantity" class="field" type="number" min="1" :max="maxItems - form.items.length" />
      </label>
      <label v-else-if="selectedBatchType?.requires_number" class="block space-y-2 text-sm font-semibold">Números (um por linha)
        <textarea v-model="pastedNumbers" class="field min-h-48 font-mono" rows="8" placeholder="00900000001&#10;00900000002&#10;00900000003" />
      </label>
      <div class="grid gap-4 sm:grid-cols-2">
        <AppAutocomplete v-model="batchProductId" label="Plano do lote" placeholder="Buscar plano" :options="activePlanOptions" />
        <AppCurrencyField v-model="batchMonthly" label="Valor mensal por linha" />
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
