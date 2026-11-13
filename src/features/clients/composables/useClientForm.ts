import { computed, ref, type Ref } from 'vue'
import { ApiError } from '@/lib/http'
import { useFormValidation } from '@/composables/useFormValidation'
import { toast } from '@/services/toast'
import { clientsApi, type Client, type ClientInput, type Classification } from '../api'
import { validateClient } from '../validation'
import { blankClient } from '../utils/clientFormDefaults'
import { useClientTransfer } from './useClientTransfer'

interface ClientFormDependencies {
  tenantId: Readonly<Ref<string>>
  busy: Ref<boolean>
  classes: Readonly<Ref<Classification[]>>
  currentSellerId: Readonly<Ref<string | null>>
  showSellerSelect: Readonly<Ref<boolean>>
  selected: Ref<Client | null>
  pendingContactClientId: Ref<string | null>
  openRequiredContact: () => void
  reloadClients: () => Promise<void>
  showDetails: (clientId: string) => Promise<void>
  cancelAddressLookup: () => void
}

export function useClientForm({
  tenantId,
  busy,
  classes,
  currentSellerId,
  showSellerSelect,
  selected,
  pendingContactClientId,
  openRequiredContact,
  reloadClients,
  showDetails,
  cancelAddressLookup,
}: ClientFormDependencies) {
  const blank = blankClient
  const form = ref<ClientInput>(blank())
  const editing = ref('')
  const modal = ref(false)
  const saving = ref(false)
  const validationState = useFormValidation<keyof ClientInput>()

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

  const classesForOperator = computed(() =>
    classes.value.filter(
      (classification) =>
        Number(classification.operator_id) === Number(form.value.operator_id)
        && classification.is_active,
    ),
  )

  function start(client?: Client) {
    resetLookup()
    validationState.clear()
    editing.value = client?.id ?? ''
    form.value = client
      ? {
          person_type: client.person_type,
          document: client.document,
          company_name: client.company_name,
          phone: client.phone,
          email: client.email,
          zip_code: client.zip_code,
          address: client.address,
          address_number: client.address_number,
          address_complement: client.address_complement,
          neighborhood: client.neighborhood,
          city: client.city,
          state: client.state,
          operator_id: client.operator_id,
          classification_id: client.classification_id,
          contract_started_on: client.contract_started_on,
          contract_ends_on: client.contract_ends_on,
          is_active: client.is_active,
          seller_membership_id: client.sellers?.find((seller) => !seller.ended_at)?.tenant_user_id ?? null,
          seller_reason: null,
        }
      : blank()

    if (!client && !showSellerSelect.value) {
      form.value.seller_membership_id = currentSellerId.value
    }

    cancelAddressLookup()
    modal.value = true
  }

  async function save() {
    if (busy.value || saving.value) return
    saving.value = true

    try {
      await persistClient()
    } finally {
      saving.value = false
    }
  }

  async function persistClient() {
    validationState.clear()
    const validation = validateClient(form.value)
    if (Object.keys(validation).length) {
      validationState.set(validation)
      return
    }

    if (!editing.value) {
      const documentChecked = await checkDocument()
      if (!documentChecked) return
      if (duplicate.value?.exists) {
        toast.error('Cliente já cadastrado. Utilize a transferência de carteira, quando disponível.')
        return
      }
    }

    const currentTenantId = tenantId.value
    const editingId = editing.value
    busy.value = true

    try {
      const data = {
        ...form.value,
        operator_id: form.value.operator_id || null,
        classification_id: form.value.classification_id || null,
        seller_membership_id: showSellerSelect.value
          ? form.value.seller_membership_id || null
          : editingId
            ? null
            : currentSellerId.value,
        contract_started_on: form.value.contract_started_on || null,
        contract_ends_on: form.value.contract_ends_on || null,
        document: form.value.document.replace(/\D/g, ''),
        zip_code: form.value.zip_code?.replace(/\D/g, '') || null,
        phone: form.value.phone?.replace(/\D/g, '') || null,
      }

      const response = await clientsApi.save(currentTenantId, data, editingId || undefined)
      if (currentTenantId !== tenantId.value) return

      modal.value = false

      if (!editingId && response.data.contact_pending) {
        pendingContactClientId.value = response.data.id
        selected.value = response.data
        openRequiredContact()
        toast.success('Cliente cadastrado. Informe agora a pessoa responsável.')
      } else {
        toast.success('Cliente salvo.')
      }

      await reloadClients()
      if (!pendingContactClientId.value && selected.value?.id === response.data.id) {
        await showDetails(response.data.id)
      }
    } catch (error) {
      if (currentTenantId !== tenantId.value) return

      if (error instanceof ApiError && Object.keys(error.errors).length) {
        validationState.fromApi(error.errors)
      } else {
        toast.error(error instanceof Error ? error.message : 'Erro ao salvar cliente.')
      }
    } finally {
      busy.value = false
    }
  }

  return {
    blank,
    form,
    editing,
    modal,
    saving,
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
  }
}
