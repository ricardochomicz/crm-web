import { ref, watch, type Ref } from 'vue'
import { clientsApi, type Client, type Contact } from '@/features/clients/api'
import type { OpportunityInput } from '../api'

/** Owns client selection, quick onboarding and tenant-scoped contact lookups for the dialog. */
export function useOpportunityDialogClients(
  open: Readonly<Ref<boolean>>,
  tenantId: Readonly<Ref<string>>,
  clients: Readonly<Ref<Client[]>>,
  form: Ref<OpportunityInput>,
) {
  const availableClients = ref<Client[]>([])
  const clientContacts = ref<Contact[]>([])
  const loadingClientContacts = ref(false)
  const quickClientOpen = ref(false)
  let requestVersion = 0

  watch([open, clients, tenantId], ([isOpen, currentClients]) => {
    availableClients.value = isOpen ? [...currentClients] : []
    if (!isOpen) quickClientOpen.value = false
  }, { immediate: true })

  watch([open, tenantId, () => form.value.client_id], async ([isOpen, tenant, clientId]) => {
    const current = ++requestVersion
    clientContacts.value = []
    loadingClientContacts.value = false
    if (!isOpen || !clientId) return
    loadingClientContacts.value = true
    try {
      const result = await clientsApi.show(tenant, clientId)
      if (current === requestVersion) clientContacts.value = result.data.contacts ?? []
    } catch {
      if (current === requestVersion) clientContacts.value = []
    } finally {
      if (current === requestVersion) loadingClientContacts.value = false
    }
  }, { immediate: true })

  function onClientCreated(client: Client) {
    availableClients.value = [...availableClients.value.filter(item => item.id !== client.id), client]
    form.value.client_id = client.id
    quickClientOpen.value = false
  }

  return { availableClients, clientContacts, loadingClientContacts, quickClientOpen, onClientCreated }
}
