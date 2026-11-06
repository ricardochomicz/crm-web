import { computed, ref, type Ref } from 'vue'
import { useListFilters } from '@/composables/useListFilters'
import { useListPagination } from '@/composables/useListPagination'
import type { Client } from '../api'

/** Filtros aplicados somente ao clicar Buscar e paginação da carteira carregada. */
export function useClientsList(rows: Ref<Client[]>) {
  const search = ref('')
  const operatorFilter = ref('')
  const { applied, apply: applyFilters, clear: clearFilters } = useListFilters({ search, operatorFilter })
  const filtered = computed(() => rows.value.filter(client => {
    const operatorMatches = !applied.value.operatorFilter ||
      String(client.operator_id) === applied.value.operatorFilter
    const query = applied.value.search.toLocaleLowerCase('pt-BR')
    const searchMatches = !query ||
      [client.company_name, client.document, client.email ?? '']
        .join(' ').toLocaleLowerCase('pt-BR').includes(query)
    return operatorMatches && searchMatches
  }))
  const { page, total, lastPage, pageRows, changePage } = useListPagination(filtered)
  return { search, operatorFilter, filtered, applyFilters, clearFilters, page, total, lastPage, pageRows, changePage }
}
