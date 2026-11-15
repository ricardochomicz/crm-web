import { computed, ref, watch, type Ref } from 'vue'
import { clientsApi, type Client, type ClientTransferLookup } from '@/features/clients/api'
import { toast } from '@/services/toast'

/** Portfolio ownership feedback for the opportunity form; backend remains authoritative. */
export function useOpportunityPortfolioGuard(
  open: Readonly<Ref<boolean>>,
  tenantId: Readonly<Ref<string>>,
  clientId: Readonly<Ref<string>>,
  clients: Readonly<Ref<Client[]>>,
  isNew: Readonly<Ref<boolean>>,
  isConsultant: Readonly<Ref<boolean>>,
) {
  const lookup = ref<ClientTransferLookup | null>(null)
  const checking = ref(false)
  const transferOpen = ref(false)
  const transferBusy = ref(false)
  let version = 0

  watch([open, tenantId, clientId, clients, isNew, isConsultant], async () => {
    const current = ++version
    lookup.value = null
    transferOpen.value = false
    checking.value = false
    if (!open.value || !isNew.value || !isConsultant.value || !clientId.value) return
    const client = clients.value.find(item => item.id === clientId.value)
    if (!client?.document) return
    checking.value = true
    try {
      const response = await clientsApi.transferLookup(tenantId.value, client.document.replace(/\D/g, ''))
      if (current === version) lookup.value = response.data
    } catch {
      if (current === version) toast.error('Não foi possível verificar a carteira deste cliente.')
    } finally {
      if (current === version) checking.value = false
    }
  }, { immediate: true })

  const blocked = computed(() => isNew.value && isConsultant.value && (
    checking.value || !clientId.value ? false : lookup.value === null || (lookup.value.exists && !lookup.value.assigned_to_me)
  ))
  const belongsToOther = computed(() => lookup.value?.exists === true && !lookup.value.assigned_to_me)
  async function requestTransfer(reason: string) {
    if (!lookup.value?.client_id || transferBusy.value) return
    transferBusy.value = true
    try {
      await clientsApi.requestTransfer(tenantId.value, lookup.value.client_id, reason.trim())
      transferOpen.value = false
      toast.success('Solicitação enviada para avaliação da transferência de carteira.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível solicitar a transferência.')
    } finally {
      transferBusy.value = false
    }
  }
  return { lookup, checking, blocked, belongsToOther, transferOpen, transferBusy, requestTransfer }
}
