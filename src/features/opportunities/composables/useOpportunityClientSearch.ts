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
  const activeIndex = ref(0)
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
    activeIndex.value = 0
  }

  function onSearchInput() {
    onSelect('')
    clientMenuOpen.value = true
    activeIndex.value = 0
  }

  function openMenu() {
    if (clientMenuOpen.value) return
    // A selected label is not a search term: open with all clients visible.
    if (selectedId.value) clientSearch.value = ''
    clientMenuOpen.value = true
    activeIndex.value = 0
  }

  function closeMenu() {
    clientMenuOpen.value = false
    const selected = clients.value.find(client => client.id === selectedId.value)
    clientSearch.value = selected ? selected.company_name + ' · ' + selected.document : ''
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      if (clientMenuOpen.value) event.preventDefault()
      closeMenu()
      return
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (!clientMenuOpen.value) {
        openMenu()
        return
      }
      const length = filteredClients.value.length
      if (!length) return
      activeIndex.value = (activeIndex.value + (event.key === 'ArrowDown' ? 1 : -1) + length) % length
      return
    }
    if (event.key === 'Enter' && clientMenuOpen.value) {
      event.preventDefault()
      const client = filteredClients.value[activeIndex.value]
      if (client) selectClient(client)
    }
  }

  watch([selectedId, clients], ([id, available]) => {
    if (clientMenuOpen.value) return
    const selected = available.find(client => client.id === id)
    clientSearch.value = selected ? selected.company_name + ' · ' + selected.document : ''
  }, { immediate: true })

  return { clientSearch, clientMenuOpen, activeIndex, filteredClients, selectClient, onSearchInput, onKeydown, openMenu, closeMenu }
}
