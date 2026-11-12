import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { tenantApi } from '@/features/tenants/api'
import { operatorsApi } from '@/features/operators/api'
import type { Tenant } from '@/features/tenants/types'
import { clientsApi, type PortfolioContract } from '../api'
import { usePortfolioRenewal } from './usePortfolioRenewal'

export function useClientPortfolioPage() {
  const route = useRoute()
  const router = useRouter()
  const selectedDetails = ref<PortfolioContract | null>(null)

  const tenantId = computed(() => String(route.params.tenantId))
  const tenant = ref<Tenant>()
  const operators = ref<{ id: number; name: string }[]>([])
  const { renewing, savingRenewal, openRenewal, closeRenewal, confirmRenewal } =
    usePortfolioRenewal(tenantId, load)

  const visibleRows = computed(() => rows.value)
  const rows = ref<PortfolioContract[]>([])
  const viewMode = ref<'contracts' | 'orders' | 'renewing'>('contracts')
  const ungroupedCount = ref(0)
  const hasCheckedLegacy = ref(false)
  const search = ref('')
  const operatorFilter = ref('')
  const renewalMonth = ref('')
  const renewalYear = ref('')
  const appliedSearch = ref('')
  const appliedOperator = ref('')
  const appliedRenewalMonth = ref('')
  const appliedRenewalYear = ref('')
  const page = ref(1)
  const lastPage = ref(1)
  const total = ref(0)
  const perPage = 20
  const loading = ref(true)
  const error = ref('')

  const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
  const statuses: Record<PortfolioContract['status'], string> = {
    classification_required: 'Sem classificação',
    rule_required: 'Prazo não definido',
    activation_data_required: 'Verificar ativações',
    overdue: 'Prazo vencido',
    upcoming: 'Renovação próxima',
    waiting: 'Em vigência',
    policy_pending: 'Regra pendente',
  }

  function formatDate(value: string | null): string {
    if (!value) return '—'
    const [year, month, day] = value.split('-')
    return `${day}/${month}/${year}`
  }

  let requestVersion = 0

  async function load() {
    const version = ++requestVersion
    const id = tenantId.value
    loading.value = true
    error.value = ''

    try {
      const params = {
        search: appliedSearch.value || undefined,
        operator_id: appliedOperator.value ? Number(appliedOperator.value) : undefined,
        renewal_month: appliedRenewalMonth.value ? Number(appliedRenewalMonth.value) : undefined,
        renewal_year: appliedRenewalYear.value ? Number(appliedRenewalYear.value) : undefined,
        page: page.value,
        per_page: perPage,
        ...(viewMode.value !== 'contracts' ? { renewal_state: viewMode.value === 'renewing' ? 'in_progress' as const : 'available' as const } : {}),
      }
      let response = viewMode.value === 'contracts'
        ? await clientsApi.consolidatedPortfolio(id, params)
        : await clientsApi.portfolio(id, params)

      if (version !== requestVersion) return
      if (viewMode.value === 'contracts' && response.meta.total === 0 && !hasCheckedLegacy.value) {
        const legacy = await clientsApi.portfolio(id, params)
        if (version !== requestVersion) return
        hasCheckedLegacy.value = true
        ungroupedCount.value = legacy.meta.total
        if (legacy.meta.total > 0) {
          viewMode.value = 'orders'
          response = legacy
        }
      }
      rows.value = response.data
      total.value = response.meta.total
      lastPage.value = response.meta.last_page
    } catch (failure) {
      if (version !== requestVersion) return
      error.value = failure instanceof Error ? failure.message : 'Não foi possível carregar a carteira.'
    } finally {
      if (version === requestVersion) loading.value = false
    }
  }

  async function initialize() {
    ++requestVersion
    rows.value = []
    page.value = 1
    total.value = 0
    lastPage.value = 1
    search.value = ''
    operatorFilter.value = ''
    renewalMonth.value = ''
    renewalYear.value = ''
    appliedRenewalMonth.value = ''
    appliedRenewalYear.value = ''
    appliedSearch.value = ''
    appliedOperator.value = ''
    viewMode.value = 'contracts'
    hasCheckedLegacy.value = false
    ungroupedCount.value = 0

    try {
      const id = tenantId.value
      const [tenantResponse, operatorsResponse] = await Promise.all([
        tenantApi.show(id),
        operatorsApi.available(),
      ])
      if (id !== tenantId.value) return
      tenant.value = tenantResponse.data
      operators.value = operatorsResponse.data
    } catch (failure) {
      error.value = failure instanceof Error ? failure.message : 'Erro ao carregar dados da empresa.'
      loading.value = false
      return
    }

    await load()
  }

  function applyFilters() {
    appliedSearch.value = search.value.trim()
    appliedOperator.value = operatorFilter.value
    appliedRenewalMonth.value = renewalMonth.value
    appliedRenewalYear.value = renewalYear.value
    page.value = 1
    void load()
  }

  function clearFilters() {
    search.value = ''
    operatorFilter.value = ''
    renewalMonth.value = ''
    renewalYear.value = ''
    applyFilters()
  }

  function changeMode(mode: 'contracts' | 'orders' | 'renewing') {
    if (viewMode.value === mode) return
    viewMode.value = mode
    page.value = 1
    void load()
  }

  function changePage(value: number) {
    page.value = value
    void load()
  }

  watch(tenantId, () => void initialize(), { immediate: true })

  return {
    tenant,
    tenantId,
    operators,
    rows,
    visibleRows,
    viewMode,
    search,
    operatorFilter,
    renewalMonth,
    renewalYear,
    appliedSearch,
    appliedOperator,
    appliedRenewalMonth,
    appliedRenewalYear,
    page,
    lastPage,
    total,
    perPage,
    loading,
    error,
    currency,
    statuses,
    formatDate,
    load,
    applyFilters,
    clearFilters,
    changeMode,
    changePage,
    renewing,
    selectedDetails,
    savingRenewal,
    openRenewal,
    closeRenewal,
    confirmRenewal,
    router,
  }
}
