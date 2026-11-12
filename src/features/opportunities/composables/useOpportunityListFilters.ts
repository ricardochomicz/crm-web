import { ref, type Ref } from 'vue'
import { opportunitiesApi, type Opportunity, type OpportunityFilters } from '../api'
import { errorMessage } from '@/lib/feedback'
import { toast } from '@/services/toast'

type Section = 'open' | 'closed'

export function defaultOpportunityFilters(area: Section = 'open'): OpportunityFilters {
  return {
    search: '',
    status: area === 'closed' ? 'all' : 'open',
    period: area === 'closed' ? 'closed' : 'current',
    order_type_id: '',
    date_from: '',
    date_to: '',
  }
}

/** Manages the list view, applied filters, pagination, and stale responses. */
export function useOpportunityListFilters(
  tenantId: Readonly<Ref<string>>,
  section: Readonly<Ref<Section>>,
  onSearch: () => void,
) {
  const rows = ref<Opportunity[]>([])
  const filters = ref<OpportunityFilters>(defaultOpportunityFilters())
  const applied = ref<OpportunityFilters>(defaultOpportunityFilters())
  const page = ref(1)
  const total = ref(0)
  const lastPage = ref(1)
  const perPage = ref(20)
  const loading = ref(true)
  const error = ref('')
  let version = 0

  function invalidate() { return ++version }

  async function load() {
    const current = invalidate()
    const tenant = tenantId.value
    loading.value = true
    error.value = ''
    try {
      const result = await opportunitiesApi.list(tenant, { ...applied.value, page: page.value })
      if (current !== version || tenant !== tenantId.value) return
      rows.value = result.data
      total.value = result.total
      lastPage.value = result.last_page
      perPage.value = result.per_page
    } catch (e) {
      if (current === version && tenant === tenantId.value) error.value = errorMessage(e)
    } finally {
      if (current === version && tenant === tenantId.value) loading.value = false
    }
  }

  function applyFilters() {
    if (filters.value.min_amount !== undefined && filters.value.max_amount !== undefined &&
      Number(filters.value.min_amount) > Number(filters.value.max_amount)) {
      toast.error('O valor mínimo não pode ser maior que o máximo.')
      return
    }
    page.value = 1
    applied.value = {
      ...filters.value,
      search: filters.value.search?.trim(),
      status: section.value === 'open' ? 'open' : filters.value.status === 'open' ? 'all' : filters.value.status,
      period: section.value === 'closed' ? 'closed' : filters.value.period,
    }
    onSearch()
  }

  function clearFilters() {
    filters.value = defaultOpportunityFilters(section.value)
    applyFilters()
  }

  function resetSection(next: Section) {
    invalidate()
    rows.value = []
    total.value = 0
    lastPage.value = 1
    perPage.value = 20
    error.value = ''
    page.value = 1
    filters.value = defaultOpportunityFilters(next)
    applied.value = { ...filters.value }
  }

  function changePage(next: number) {
    if (!Number.isInteger(next) || next < 1 || next > lastPage.value || next === page.value) return
    page.value = next
    void load()
  }

  return {
    rows, filters, applied, page, total, lastPage, perPage, loading, error,
    load, invalidate, applyFilters, clearFilters, resetSection, changePage,
  }
}
