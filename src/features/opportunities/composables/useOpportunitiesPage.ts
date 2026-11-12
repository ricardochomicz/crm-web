import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { opportunitiesApi, type Opportunity, type FunnelStage, type OpportunityFilters } from '../api'
import { useOpportunityStagePagination } from './useOpportunityStagePagination'
import type OpportunityCommercialOverview from '../components/OpportunityCommercialOverview.vue'
import { errorMessage } from '@/lib/feedback'
import { toast } from '@/services/toast'
import { useOpportunityRealtimeSync } from './useOpportunityRealtimeSync'
import { useOpportunityReferenceData } from './useOpportunityReferenceData'
import { useOpportunityCommercialActions } from './useOpportunityCommercialActions'
import { useOpportunityStageMovement } from './useOpportunityStageMovement'
import { useOpportunityListFilters } from './useOpportunityListFilters'

export function useOpportunitiesPage() {
    const tenantId = computed(() => String(useRoute().params.tenantId))
const referenceData = useOpportunityReferenceData(tenantId)
const { tenant, clients, products, operators, orderTypes, stages, canCreate, canEdit } = referenceData
const viewMode = ref<'list' | 'kanban'>('kanban')
const section = ref<'open' | 'closed'>('open')
function switchSection(next: 'open' | 'closed') {
    section.value = next
    list.resetSection(next)
    viewMode.value = next === 'closed' ? 'list' : 'kanban'
    if (next === 'open' && stages.value.length === 0) {
        void opportunitiesApi.stages(tenantId.value).then(result => {
            stages.value = result.data
        }).catch(e => toast.error(errorMessage(e)))
    }
    reload()
}
const draggingOpportunity = ref(false)
const commercialOverview = ref<InstanceType<typeof OpportunityCommercialOverview> | null>(null)
const list = useOpportunityListFilters(tenantId, section, () => reload())
const { rows, filters, applied, page, total, lastPage, perPage, loading, error,
  applyFilters, clearFilters, changePage } = list
const stagePagination = useOpportunityStagePagination(tenantId, stages, applied)
const kanbanRows = stagePagination.items
const stageStates = stagePagination.states
const { movingId, moveStage } = useOpportunityStageMovement({
  tenantId, canEdit, stages, items: kanbanRows, pagination: stagePagination,
  updateTotal: value => { total.value = value },
})
const dialogTab = ref<'details' | 'history'>('details')
const dialogOpen = ref(false)
const {
  recoveringId, recoverCandidate, askRecover, recover, resendCandidate, askResendToBackoffice, resendToBackoffice,
  confirmingSale, saleCandidate, askConfirmSale, confirmSale,
  lostCandidate, lostReason, markingLost, askMarkLost, markLost,
} = useOpportunityCommercialActions({
  tenantId, canEdit, stages, movingId,
  reload: () => reload(),
  refreshOverview: () => { void commercialOverview.value?.refresh() },
  switchToOpen: () => switchSection('open'),
})
const editing = ref<Opportunity | null>(null)
let version = 0
async function load() {
  ++version
  await list.load()
}
async function loadKanban() {
  const current = ++version
  loading.value = true
  error.value = ''
  try {
    await stagePagination.reset()
    if (current !== version) return
    total.value = stagePagination.total.value
  } catch (e) {
    if (current === version) error.value = errorMessage(e)
  } finally {
    if (current === version) loading.value = false
  }
}
function loadMoreKanban(stageId: string) {
  stagePagination.loadMore(stageId)
}
function reload() { if (viewMode.value === 'kanban') void loadKanban(); else void load() }
async function changeView(mode: 'list' | 'kanban') {
  viewMode.value = mode
  if (mode === 'kanban') {
    try { stages.value = (await opportunitiesApi.stages(tenantId.value)).data } catch (e) { toast.error(errorMessage(e)) }
  }
  reload()
}
async function setup() {
  try {
    await referenceData.load()
  } catch (e) {
    error.value = errorMessage(e)
  }
}
async function open(item: Opportunity | null = null, tab: 'details' | 'history' = 'details') {
  dialogTab.value = tab
  if (item) {
    try {
      const detail = await opportunitiesApi.show(tenantId.value, item.id)
      editing.value = detail.data
    } catch (e) { toast.error(errorMessage(e)); return }
  } else editing.value = null
  dialogOpen.value = true
}
function saved() { dialogOpen.value = false; toast.success('Oportunidade salva.'); reload(); void commercialOverview.value?.refresh() }
async function refreshRowsSilently(id: string, current: number) {
  const params = { ...applied.value, page: page.value }
  if (viewMode.value === 'list') {
    const result = await opportunitiesApi.list(id, params)
    if (id !== tenantId.value || current !== version || viewMode.value !== 'list') return
    rows.value = result.data
    total.value = result.total
    lastPage.value = result.last_page
    perPage.value = result.per_page
    return
  }
  // Reuse the stage-scoped API and preserve the same visibility rules.
  await stagePagination.refresh(undefined, () => !draggingOpportunity.value && !movingId.value && current === version)
  if (id !== tenantId.value || current !== version || viewMode.value !== 'kanban') return
  total.value = stagePagination.total.value
}
useOpportunityRealtimeSync({
  tenantId, stages, loading, movingId, draggingOpportunity, dialogOpen,
  version: () => version,
  refreshRows: refreshRowsSilently,
  refreshOverview: () => { void commercialOverview.value?.refresh() },
})
watch(tenantId, () => { section.value = 'open'; list.resetSection('open'); viewMode.value = 'kanban'; referenceData.clear(); page.value = 1; void setup(); reload() }, { immediate: true })
watch(stages, (next, previous) => {
  if (viewMode.value === 'kanban' && next.length > 0 && previous.length === 0) reload()
})

function displayOrderType(item: Opportunity): string {
  const value: unknown = item.order_type
  if (value && typeof value === 'object') {
    const type = value as { name?: unknown }
    return typeof type.name === 'string' ? type.name : '—'
  }
  if (item.order_type_id) {
    const type = orderTypes.value.find(type => type.id === item.order_type_id)
    if (type) return type.name
  }
  if (typeof value === 'string') {
    if (value.startsWith('{')) {
      try {
        const parsed: unknown = JSON.parse(value)
        if (parsed && typeof parsed === 'object' && 'name' in parsed && typeof parsed.name === 'string') return parsed.name
      } catch { /* Legacy text type */ }
    }
    return value
  }
  return '—'
}
const money = (value: string) => Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

    return {
        tenantId,
        tenant,
        clients,
        products,
        operators,
        orderTypes,
        rows,
        stages,
        viewMode,
        section,
        recoveringId,
        recoverCandidate,
        askRecover,
        recover,
        switchSection,
        kanbanRows,
        movingId,
        draggingOpportunity,
        resendToBackoffice,
        askResendToBackoffice,
        resendCandidate,
        commercialOverview,
        stageStates,
        loadMoreKanban,
        filters,
        applied,
        page,
        total,
        lastPage,
        perPage,
        loading,
        error,
        dialogTab,
        dialogOpen,
        confirmingSale,
        lostCandidate,
        lostReason,
        markingLost,
        askMarkLost,
        markLost,
        saleCandidate,
        askConfirmSale,
        confirmSale,
        editing,
        canCreate,
        canEdit,
        reload,
        changeView,
        moveStage,
        applyFilters,
        clearFilters,
        changePage,
        open,
        saved,
        displayOrderType,
        money,
    }
}
