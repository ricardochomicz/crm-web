import { ref, type Ref } from 'vue'
import { toast } from '@/services/toast'
import { clientsApi, type Client } from '../api'

export function useClientDetails(tenantId: Readonly<Ref<string>>) {
  const selected = ref<Client | null>(null)
  const detailsInitialTab = ref<'data' | 'history'>('data')
  let requestVersion = 0

  function resetDetails() {
    ++requestVersion
    selected.value = null
    detailsInitialTab.value = 'data'
  }

  async function details(clientId: string): Promise<boolean> {
    const version = ++requestVersion
    const currentTenantId = tenantId.value

    try {
      const response = await clientsApi.show(currentTenantId, clientId)
      if (version !== requestVersion || currentTenantId !== tenantId.value) return false

      selected.value = response.data
      detailsInitialTab.value = 'data'
      return true
    } catch (error) {
      if (version === requestVersion && currentTenantId === tenantId.value) {
        toast.error(error instanceof Error ? error.message : 'Erro ao carregar cliente.')
      }
      return false
    }
  }

  async function openHistory(clientId: string) {
    if (await details(clientId)) {
      detailsInitialTab.value = 'history'
    }
  }

  return {
    selected,
    detailsInitialTab,
    details,
    openHistory,
    resetDetails,
  }
}
