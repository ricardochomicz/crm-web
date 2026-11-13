<script setup lang="ts">
import TimelinePanel from '@/features/timeline/components/TimelinePanel.vue'
import AppAutocomplete from '@/components/ui/AppAutocomplete.vue'
import AppCurrencyField from '@/components/ui/AppCurrencyField.vue'
import { computed, ref, watch } from 'vue'
import { opportunityLineCount, opportunityTotal, MAX_OPPORTUNITY_ITEMS } from '../utils/opportunityForm'
import AppDialog from '@/components/ui/AppDialog.vue'
import OpportunityDetailsForm from './OpportunityDetailsForm.vue'
import OpportunityReceipt from './OpportunityReceipt.vue'
import OpportunityComparisonPanel from './OpportunityComparisonPanel.vue'
import OpportunityProposalPanel from './OpportunityProposalPanel.vue'
import OpportunityAppointmentsPanel from './OpportunityAppointmentsPanel.vue'
import ClientDocumentsPanel from './ClientDocumentsPanel.vue'
import OpportunityLineEditDialog from './OpportunityLineEditDialog.vue'
import OpportunityBulkEditDialog from './OpportunityBulkEditDialog.vue'
import type { Opportunity } from '../api'
import type { OrderType } from '@/features/order-types/api'
import type { Product } from '@/features/products/api'
import type { TenantOperator } from '@/features/operators/api'
import type { Client } from '@/features/clients/api'
import { useOpportunityDialogPermissions } from '../composables/useOpportunityDialogPermissions'
import { useOpportunityLineSelection } from '../composables/useOpportunityLineSelection'
import { useOpportunityBatchImport } from '../composables/useOpportunityBatchImport'
import { useOpportunityFormSubmission } from '../composables/useOpportunityFormSubmission'
import { useOpportunityDialogClients } from '../composables/useOpportunityDialogClients'
import { useOpportunityFormState } from '../composables/useOpportunityFormState'
import OpportunityLinesSection from './OpportunityLinesSection.vue'
import QuickClientOnboardingDialog from '@/features/clients/components/QuickClientOnboardingDialog.vue'

const props = defineProps<{ initialTab?: 'details' | 'history'; open: boolean; tenantId: string; opportunity: Opportunity | null; clients: Client[]; products: Product[]; operators: TenantOperator[]; orderTypes: OrderType[] }>()
const emit = defineEmits<{ close: []; saved: [] }>()
const activeTab = ref<'details' | 'documents' | 'history' | 'comparison' | 'appointments' | 'proposal'>('details')
const { viewerTenant, showResponsible, canCreateClient } = useOpportunityDialogPermissions(
  computed(() => props.open),
  computed(() => props.tenantId),
)
const filteredProducts = computed(() => props.products.filter(p => p.is_active && Number(p.operator_id) === Number(form.value.operator_id)))
const operatorOptions = computed(() => props.operators.map(operator => ({ id: operator.id, name: operator.name })))
const activePlanOptions = computed(() => filteredProducts.value.map(p => ({
  id: p.id, name: p.name + ' — ' + money(Number(p.price)),
})))
const typeName = (id: string) => props.orderTypes.find(type => type.id === id)?.name ?? 'Tipo anterior'
const maxItems = MAX_OPPORTUNITY_ITEMS
const lineCount = computed(() => opportunityLineCount(form.value.items))
const { form, changeOperator, initialize } = useOpportunityFormState({
  operators: computed(() => props.operators),
  onOperatorChanged: () => {
    selectedLineIndices.value = []
    batchProductId.value = ''
  },
  confirmOperatorChange: () => window.confirm('Alterar a operadora removerá as linhas e planos da oportunidade. Deseja continuar?'),
})
const { availableClients, clientContacts, loadingClientContacts, quickClientOpen, onClientCreated } =
  useOpportunityDialogClients(
    computed(() => props.open),
    computed(() => props.tenantId),
    computed(() => props.clients),
    form,
  )
const {
  editingLineIndex, selectedLineIndices, lineSearch, filteredLineIndices, showBulkEdit,
  allSelected, selectedItems, editingLine, otherNumbers,
  toggleLine, toggleAll, removeLine, applyBulk, updateLine, resetSelection,
} = useOpportunityLineSelection(form, filteredProducts)
const {
  showImport, pastedNumbers, batchProductId, batchTypeId, batchQuantity,
  batchMonthly, batchError, parsedNumbers, selectedBatchType,
  openImport, addBatch,
} = useOpportunityBatchImport(form, filteredProducts, computed(() => props.orderTypes))
const { busy, error, save } = useOpportunityFormSubmission({
  form,
  tenantId: computed(() => props.tenantId),
  opportunity: computed(() => props.opportunity),
  orderTypes: computed(() => props.orderTypes),
  filteredProducts,
  onSaved: () => emit('saved'),
})
const totalMonthly = computed(() => opportunityTotal(form.value.items, 'monthly_unit_amount'))
const totalOnce = computed(() => opportunityTotal(form.value.items, 'one_time_unit_amount'))
const money = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
watch(() => [props.open, props.opportunity] as const, () => {
  if (!props.open) return
  activeTab.value = props.opportunity ? (props.initialTab ?? 'details') : 'details'
  error.value = ''
  showImport.value = false
  resetSelection()
  initialize(props.opportunity)
}, { immediate: true })
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
          <OpportunityLinesSection
            :items="form.items"
            :max-items="maxItems"
            :selected-line-indices="selectedLineIndices"
            :filtered-line-indices="filteredLineIndices"
            :all-selected="allSelected"
            v-model:line-search="lineSearch"
            :line-count="lineCount"
            :total-monthly="totalMonthly"
            :type-name="typeName"
            :money="money"
            @import="openImport"
            @clear-selection="selectedLineIndices = []"
            @bulk-edit="showBulkEdit = true"
            @toggle-all="toggleAll"
            @toggle-line="toggleLine"
            @edit="editingLineIndex = $event"
            @remove="removeLine"
          />
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
