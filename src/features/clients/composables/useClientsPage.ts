import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { tenantApi } from '@/features/tenants/api'
import { operatorsApi, type TenantOperator } from '@/features/operators/api'
import { toast } from '@/services/toast'
import { ApiError } from '@/lib/http'
import { validateClient } from '../validation'
import { blankClient } from '../utils/clientFormDefaults'
import { useClientContacts } from './useClientContacts'
import { useClientTransfer } from './useClientTransfer'
import { useClientsList } from '../composables/useClientsList'
import { useClientMasks } from '../composables/useClientMasks'
import { useClientAddress } from '../composables/useClientAddress'
import { useFormValidation } from '@/composables/useFormValidation'
import { can } from '@/features/tenants/types'
import {
  clientsApi,
  type Client,
  type ClientInput,
  type Classification,
  type Seller,
} from '../api'
import type { Tenant } from '@/features/tenants/types'

export function useClientsPage() {
const route = useRoute(),
  tenantId = computed(() => String(route.params.tenantId))
const tenant = ref<Tenant>(),
  rows = ref<Client[]>([]),
  operators = ref<TenantOperator[]>([]),
  classes = ref<Classification[]>([]),
  sellers = ref<Seller[]>([])
const canAssignSeller = ref(false),
  currentSellerId = ref<string | null>(null)
const loading = ref(true),
  busy = ref(false),
  error = ref(''),
  canManage = ref(false),
  canCreate = ref(false)
const activityClient = ref<Client | null>(null)
const canCreateActivity = computed(() => can(tenant.value, 'calendar.create') && !!tenant.value?.access?.allows_operational_writes)
const showSellerSelect = computed(
  () => canAssignSeller.value || tenant.value?.role === 'OWNER' || tenant.value?.role === 'MANAGER',
)
const writable = computed(
  () => canManage.value && !!tenant.value?.access?.allows_operational_writes,
)
const canAdd = computed(() => canCreate.value && !!tenant.value?.access?.allows_operational_writes)
const {
  search,
  operatorFilter,
  filtered,
  applyFilters,
  clearFilters,
  page,
  total,
  lastPage,
  pageRows,
  changePage,
} = useClientsList(rows)
const blank = blankClient
const validationState = useFormValidation<keyof ClientInput>()
const form = ref<ClientInput>(blank()),
  editing = ref(''),
  modal = ref(false),
  selected = ref<Client | null>(null),
  detailsInitialTab = ref<'data' | 'history'>('data')
const {
  duplicate,
  checkingDocument,
  transferBusy,
  transferDialogOpen,
  checkDocument,
  requestTransfer,
  submitTransfer,
  resetLookup,
} = useClientTransfer({
  tenantId,
  form,
  editing,
  closeClientModal: () => { modal.value = false },
})
const {
  contactBlank,
  contact,
  contactEditing,
  contactModal,
  pendingContactClientId,
  editContact,
  saveContact,
} = useClientContacts({
  tenantId,
  selected,
  busy,
  reloadClients: load,
  showDetails: details,
  resetDetailsTab: () => { detailsInitialTab.value = 'data' },
})

const { documentModel, phoneModel, contactPhoneModel } = useClientMasks(form, contact)
const { cepModel, cepBusy, cepMessage, lookupCep, cancelLookup } = useClientAddress(form)

const classesForOperator = computed(() =>
  classes.value.filter(
    (c) => Number(c.operator_id) === Number(form.value.operator_id) && c.is_active,
  ),
)
const activeSeller = (c: Client) => c.sellers?.find((s) => !s.ended_at)
const sellerName = (client: Client): string => {
  const sellerId = activeSeller(client)?.tenant_user_id
  return sellers.value.find((seller) => seller.id === sellerId)?.name ?? '—'
}
function start(c?: Client) {
  resetLookup()
  validationState.clear()
  editing.value = c?.id ?? ''
  form.value = c
    ? {
        person_type: c.person_type,
        document: c.document,
        company_name: c.company_name,
        phone: c.phone,
        email: c.email,
        zip_code: c.zip_code,
        address: c.address,
        address_number: c.address_number,
        address_complement: c.address_complement,
        neighborhood: c.neighborhood,
        city: c.city,
        state: c.state,
        operator_id: c.operator_id,
        classification_id: c.classification_id,
        contract_started_on: c.contract_started_on,
        contract_ends_on: c.contract_ends_on,
        is_active: c.is_active,
        seller_membership_id: activeSeller(c)?.tenant_user_id ?? null,
        seller_reason: null,
      }
    : blank()
  if (!c && !showSellerSelect.value) form.value.seller_membership_id = currentSellerId.value
  cancelLookup()
  modal.value = true
}
async function load() {
  const id = tenantId.value
  loading.value = true
  error.value = ''
  try {
    const [t, list, op, cl, opts] = await Promise.all([
      tenantApi.show(id),
      clientsApi.list(id),
      operatorsApi.available(),
      clientsApi.classifications(id),
      clientsApi.options(id),
    ])
    if (id !== tenantId.value) return
    tenant.value = t.data
    rows.value = list.data
    const pending = list.data.find((client) => client.contact_pending)
    if (pending && !pendingContactClientId.value && !contactModal.value && list.meta.can_create) {
      pendingContactClientId.value = pending.id
      selected.value = (await clientsApi.show(id, pending.id)).data
      editContact()
      contact.value.is_primary = true
    }
    canManage.value = list.meta.can_manage
    canCreate.value = list.meta.can_create
    operators.value = op.data.map((o) => ({ ...o, selected: true }))
    classes.value = cl.data
    sellers.value = opts.data.sellers
    canAssignSeller.value = opts.data.can_assign_seller
    currentSellerId.value = opts.data.current_seller_id
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Erro ao carregar clientes.'
  } finally {
    if (id === tenantId.value) loading.value = false
  }
}
async function save() {
  if (busy.value) return
  if (!editing.value) {
    const documentChecked = await checkDocument()
    if (!documentChecked) return
    if (duplicate.value?.exists) {
      toast.error('Cliente já cadastrado. Utilize a transferência de carteira, quando disponível.')
      return
    }
  }
  validationState.clear()
  const validation = validateClient(form.value)
  if (Object.keys(validation).length) {
    validationState.set(validation)
    return
  }
  busy.value = true
  try {
    const data = {
      ...form.value,
      operator_id: form.value.operator_id || null,
      classification_id: form.value.classification_id || null,
      seller_membership_id: showSellerSelect.value
        ? form.value.seller_membership_id || null
        : editing.value
          ? null
          : currentSellerId.value,
      contract_started_on: form.value.contract_started_on || null,
      contract_ends_on: form.value.contract_ends_on || null,
      document: form.value.document.replace(/\D/g, ''),
      zip_code: form.value.zip_code?.replace(/\D/g, '') || null,
      phone: form.value.phone?.replace(/\D/g, '') || null,
    }
    const r = await clientsApi.save(tenantId.value, data, editing.value || undefined)
    modal.value = false
    if (!editing.value && r.data.contact_pending) {
      pendingContactClientId.value = r.data.id
      selected.value = r.data
      editContact()
      contact.value.is_primary = true
      toast.success('Cliente cadastrado. Informe agora a pessoa responsável.')
    } else {
      toast.success('Cliente salvo.')
    }
    await load()
    if (selected.value?.id === r.data.id) await details(r.data.id)
  } catch (e) {
    if (e instanceof ApiError && Object.keys(e.errors).length) {
      validationState.fromApi(e.errors)
    } else {
      toast.error(e instanceof Error ? e.message : 'Erro ao salvar cliente.')
    }
  } finally {
    busy.value = false
  }
}
async function saveOperatorClassification(operatorId: number, classificationId: number) {
  if (!selected.value || busy.value) return
  busy.value = true
  try {
    const clientId = selected.value.id
    await clientsApi.setOperatorClassification(tenantId.value, clientId, operatorId, classificationId)
    selected.value = null
    toast.success('Classificação da operadora atualizada.')
  } catch (e) {
    toast.error(e instanceof Error ? e.message : 'Erro ao atualizar classificação.')
  } finally {
    busy.value = false
  }
}

async function openHistory(id: string) {
  await details(id)
  if (selected.value?.id === id) detailsInitialTab.value = 'history'
}
async function details(id: string) {
  try {
    selected.value = (await clientsApi.show(tenantId.value, id)).data
    detailsInitialTab.value = 'data'
  } catch (e) {
    toast.error(e instanceof Error ? e.message : 'Erro ao carregar cliente.')
  }
}
watch(
  tenantId,
  () => {
    selected.value = null
    modal.value = false
    resetLookup()
    pendingContactClientId.value = null
    contactModal.value = false
    cancelLookup()
    void load()
  },
  { immediate: true },
)

function onActivitySaved() {
  activityClient.value = null
  toast.success('Atividade criada para o cliente.')
}
return { transferDialogOpen, submitTransfer, onActivitySaved, tenantId, tenant, rows, operators, classes, sellers, canAssignSeller, currentSellerId, loading, busy, error, canManage, canCreate, activityClient, canCreateActivity, showSellerSelect, writable, canAdd, search, operatorFilter, filtered, applyFilters, clearFilters, page, total, lastPage, pageRows, changePage, blank, validationState, duplicate, checkingDocument, transferBusy, checkDocument, requestTransfer, form, editing, modal, selected, detailsInitialTab, contactBlank, contact, contactEditing, contactModal, pendingContactClientId, documentModel, phoneModel, contactPhoneModel, cepModel, cepBusy, cepMessage, lookupCep, cancelLookup, classesForOperator, sellerName, start, load, save, saveOperatorClassification, openHistory, details, editContact, saveContact }
}
