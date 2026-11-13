import { computed, ref, watch, type Ref } from 'vue'
import type { Client } from '@/features/clients/api'

/** Search and selection state for the opportunity client picker. */
export function useOpportunityClientSearch(
  clients: Readonly<Ref<Client[]>>,
  selectedId: Readonly<Ref<string>>,
  onSelect: (id: string) => void,
) {
  const clientSearch = ref('')
  const clientMenuOpen = ref(false)
  const filteredClients = computed(() => {
    const term = clientSearch.value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
    const digits = term.replace(/\D/g, '')
    return clients.value.filter(client => {
      const name = client.company_name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
      return !term || name.includes(term) || (digits.length >= 2 && client.document.replace(/\D/g, '').includes(digits))
    }).slice(0, 30)
  })

  function selectClient(client: Client) {
    onSelect(client.id)
    clientSearch.value = client.company_name + ' · ' + client.document
    clientMenuOpen.value = false
  }

  function onSearchInput() {
    onSelect('')
    clientMenuOpen.value = true
  }

  watch([selectedId, clients], ([id, available]) => {
    if (clientMenuOpen.value) return
    const selected = available.find(client => client.id === id)
    clientSearch.value = selected ? selected.company_name + ' · ' + selected.document : ''
  }, { immediate: true })

  return { clientSearch, clientMenuOpen, filteredClients, selectClient, onSearchInput }
}
