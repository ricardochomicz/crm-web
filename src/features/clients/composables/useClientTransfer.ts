import { onScopeDispose, ref, watch, type Ref } from 'vue'
import { digits } from '@/lib/masks'
import { toast } from '@/services/toast'
import { clientsApi, type ClientInput, type ClientTransferLookup } from '../api'

interface ClientTransferDependencies {
  tenantId: Readonly<Ref<string>>
  form: Ref<ClientInput>
  editing: Ref<string>
  closeClientModal: () => void
}

export function useClientTransfer({
  tenantId,
  form,
  editing,
  closeClientModal,
}: ClientTransferDependencies) {
  const duplicate = ref<ClientTransferLookup | null>(null)
  const checkingDocument = ref(false)
  const transferBusy = ref(false)
  const transferDialogOpen = ref(false)
  let lookupVersion = 0

  function resetLookup() {
    ++lookupVersion
    duplicate.value = null
    checkingDocument.value = false
    transferDialogOpen.value = false
  }

  function requestTransfer() {
    if (duplicate.value?.client_id && !transferBusy.value) {
      transferDialogOpen.value = true
    }
  }

  async function checkDocument(): Promise<boolean> {
    const version = ++lookupVersion
    const currentTenantId = tenantId.value
    const document = digits(form.value.document, 14)
    duplicate.value = null

    if (editing.value || ![11, 14].includes(document.length)) {
      checkingDocument.value = false
      return true
    }

    checkingDocument.value = true

    try {
      const result = await clientsApi.transferLookup(currentTenantId, document)
      if (version !== lookupVersion || currentTenantId !== tenantId.value) return false
      if (digits(form.value.document, 14) !== document || editing.value) return false

      duplicate.value = result.data
      return true
    } catch (error) {
      if (version === lookupVersion && currentTenantId === tenantId.value) {
        toast.error(error instanceof Error ? error.message : 'Erro ao verificar cliente.')
      }
      return false
    } finally {
      if (version === lookupVersion) checkingDocument.value = false
    }
  }

  async function submitTransfer(reason: string) {
    if (!duplicate.value?.client_id || transferBusy.value) return

    const clientId = duplicate.value.client_id
    const currentTenantId = tenantId.value
    transferBusy.value = true

    try {
      await clientsApi.requestTransfer(currentTenantId, clientId, reason.trim())
      if (currentTenantId !== tenantId.value) return

      resetLookup()
      closeClientModal()
      toast.success('Solicitação enviada para aprovação do supervisor.')
    } catch (error) {
      if (currentTenantId === tenantId.value) {
        toast.error(
          error instanceof Error ? error.message : 'Não foi possível solicitar a transferência.',
        )
      }
    } finally {
      transferBusy.value = false
    }
  }

  watch([tenantId, () => form.value.document, editing], resetLookup)
  onScopeDispose(resetLookup)

  return {
    duplicate,
    checkingDocument,
    transferBusy,
    transferDialogOpen,
    checkDocument,
    requestTransfer,
    submitTransfer,
    resetLookup,
  }
}
