import { computed, ref, watch, type Ref } from 'vue'
import { calendarApi } from '../api'
import { clientsApi, type Client } from '@/features/clients/api'
import { opportunitiesApi, type Opportunity } from '@/features/opportunities/api'
import { errorMessage } from '@/lib/feedback'

interface Dependencies {
  open: Readonly<Ref<boolean>>
  tenantId: Readonly<Ref<string>>
  clientId: Readonly<Ref<string | null | undefined>>
}

export function useCalendarEventOptions({ open, tenantId, clientId }: Dependencies) {
  const clients = ref<Client[]>([])
  const assignees = ref<{ id: string; name: string }[]>([])
  const opportunities = ref<Opportunity[]>([])
  const clientsLoading = ref(false)
  const assigneesLoading = ref(false)
  const opportunitiesLoading = ref(false)
  const optionsError = ref('')

  const clientOptions = computed(() =>
    clients.value.map((client) => ({ value: client.id, label: client.company_name })),
  )
  const opportunityOptions = computed(() =>
    opportunities.value.map((item) => ({ value: item.id, label: item.code + ' · ' + item.title })),
  )

  let clientsRequest = 0
  let assigneesRequest = 0
  let opportunitiesRequest = 0

  watch([open, tenantId], async ([isOpen, tenant]) => {
    const version = ++clientsRequest
    clients.value = []
    clientsLoading.value = !!(isOpen && tenant)
    if (!isOpen || !tenant) return
    try {
      const response = await clientsApi.list(tenant)
      if (version === clientsRequest) clients.value = response.data
    } catch (cause) {
      if (version === clientsRequest) {
        optionsError.value = 'Não foi possível carregar os clientes: ' + errorMessage(cause)
      }
    } finally {
      if (version === clientsRequest) clientsLoading.value = false
    }
  }, { immediate: true })

  watch([open, tenantId], async ([isOpen, tenant]) => {
    const version = ++assigneesRequest
    assignees.value = []
    assigneesLoading.value = !!(isOpen && tenant)
    if (!isOpen || !tenant) return
    try {
      const response = await calendarApi.assignees(tenant)
      if (version === assigneesRequest) assignees.value = response.data
    } catch (cause) {
      if (version === assigneesRequest) {
        optionsError.value = 'Não foi possível carregar os responsáveis: ' + errorMessage(cause)
      }
    } finally {
      if (version === assigneesRequest) assigneesLoading.value = false
    }
  }, { immediate: true })

  watch([open, tenantId, clientId], async ([isOpen, tenant, client]) => {
    const version = ++opportunitiesRequest
    opportunities.value = []
    opportunitiesLoading.value = !!(isOpen && tenant && client)
    if (!isOpen || !tenant || !client) return

    try {
      const results: Opportunity[] = []
      let page = 1
      let lastPage = 1
      do {
        const response = await opportunitiesApi.list(tenant, { client_id: client, page })
        if (version !== opportunitiesRequest) return
        results.push(...response.data)
        lastPage = response.last_page
        page++
      } while (page <= lastPage && page <= 50)

      if (version !== opportunitiesRequest) return
      opportunities.value = results
      if (page <= lastPage) {
        optionsError.value = 'Limite de oportunidades exibidas. Utilize o cadastro da oportunidade para vincular diretamente.'
      }
    } catch (cause) {
      if (version === opportunitiesRequest) {
        optionsError.value = 'Não foi possível carregar as oportunidades: ' + errorMessage(cause)
      }
    } finally {
      if (version === opportunitiesRequest) opportunitiesLoading.value = false
    }
  }, { immediate: true })

  function clearOptionsError() {
    optionsError.value = ''
  }

  return {
    clients, assignees, opportunities,
    clientsLoading, assigneesLoading, opportunitiesLoading,
    clientOptions, opportunityOptions, optionsError, clearOptionsError,
  }
}
