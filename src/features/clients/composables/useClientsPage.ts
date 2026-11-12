import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { toast } from '@/services/toast'
import { useClientContacts } from './useClientContacts'
import { useClientForm } from './useClientForm'
import { useClientDetails } from './useClientDetails'
import { useClientsData } from './useClientsData'
import { useClientsList } from '../composables/useClientsList'
import { useClientMasks } from '../composables/useClientMasks'
import { useClientAddress } from '../composables/useClientAddress'
import { can } from '@/features/tenants/types'
import { clientsApi, type Client } from '../api'

export function useClientsPage() {
  const route = useRoute(),
    tenantId = computed(() => String(route.params.tenantId))
  const {
    tenant,
    rows,
    operators,
    classes,
    sellers,
    canAssignSeller,
    currentSellerId,
    loading,
    error,
    canManage,
    canCreate,
    load,
    invalidate,
  } = useClientsData({
    tenantId,
    hasPendingContact: () => !!pendingContactClientId.value || contactModal.value,
    onPendingContact: async (client) => {
      const currentTenantId = tenantId.value
      const loaded = await details(client.id)
      if (!loaded || currentTenantId !== tenantId.value) return
      pendingContactClientId.value = client.id
      editContact()
      contact.value.is_primary = true
    },
  })
  const busy = ref(false)
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
      invalidate()
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
