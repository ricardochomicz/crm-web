import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { tenantApi } from '@/features/tenants/api'
import { operatorsApi, type TenantOperator } from '@/features/operators/api'
import { toast } from '@/services/toast'
import { useClientContacts } from './useClientContacts'
import { useClientForm } from './useClientForm'
import { useClientDetails } from './useClientDetails'
import { useClientsList } from '../composables/useClientsList'
import { useClientMasks } from '../composables/useClientMasks'
import { useClientAddress } from '../composables/useClientAddress'
import { can } from '@/features/tenants/types'
import {
  clientsApi,
  type Client,
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
  const { selected, detailsInitialTab, details, openHistory, resetDetails } = useClientDetails(tenantId)
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

  const {
    blank,
    form,
    editing,
    modal,
    validationState,
    classesForOperator,
    duplicate,
    checkingDocument,
    transferBusy,
    transferDialogOpen,
    checkDocument,
    requestTransfer,
    submitTransfer,
    resetLookup,
    start,
    save,
  } = useClientForm({
    tenantId,
    busy,
    classes,
    currentSellerId,
    showSellerSelect,
    selected,
    pendingContactClientId,
    openRequiredContact: () => {
      editContact()
      contact.value.is_primary = true
    },
    reloadClients: load,
    showDetails: details,
    cancelAddressLookup: () => cancelLookup(),
  })

  const { documentModel, phoneModel, contactPhoneModel } = useClientMasks(form, contact)
  const { cepModel, cepBusy, cepMessage, lookupCep, cancelLookup } = useClientAddress(form)

  const activeSeller = (c: Client) => c.sellers?.find((s) => !s.ended_at)
  const sellerName = (client: Client): string => {
    const sellerId = activeSeller(client)?.tenant_user_id
    return sellers.value.find((seller) => seller.id === sellerId)?.name ?? '—'
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

  watch(
    tenantId,
    () => {
      resetDetails()
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
  return {
    transferDialogOpen,
    submitTransfer,
    onActivitySaved,
    tenantId,
    tenant,
    rows,
    operators,
    classes,
    sellers,
    canAssignSeller,
    currentSellerId,
    loading,
    busy,
    error,
    canManage,
    canCreate,
    activityClient,
    canCreateActivity,
    showSellerSelect,
    writable,
    canAdd,
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
    blank,
    validationState,
    duplicate,
    checkingDocument,
    transferBusy,
    checkDocument,
    requestTransfer,
    form,
    editing,
    modal,
    selected,
    detailsInitialTab,
    contactBlank,
    contact,
    contactEditing,
    contactModal,
    pendingContactClientId,
    documentModel,
    phoneModel,
    contactPhoneModel,
    cepModel,
    cepBusy,
    cepMessage,
    lookupCep,
    cancelLookup,
    classesForOperator,
    sellerName,
    start,
    load,
    save,
    saveOperatorClassification,
    openHistory,
    details,
    editContact,
    saveContact,
  }
}
