import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { opportunitiesApi, type Opportunity } from '../api'
import { useOpportunityStagePagination } from './useOpportunityStagePagination'
import type OpportunityCommercialOverview from '../components/OpportunityCommercialOverview.vue'
import { errorMessage } from '@/lib/feedback'
import { toast } from '@/services/toast'
import { useOpportunityRealtimeSync } from './useOpportunityRealtimeSync'
import { useOpportunityReferenceData } from './useOpportunityReferenceData'
import { useOpportunityCommercialActions } from './useOpportunityCommercialActions'
import { useOpportunityStageMovement } from './useOpportunityStageMovement'
import { useOpportunityListFilters } from './useOpportunityListFilters'
import { useOpportunityDialogState } from './useOpportunityDialogState'
import { useOpportunityPageLifecycle } from './useOpportunityPageLifecycle'
import { displayOpportunityOrderType, formatOpportunityMoney } from '../utils/opportunityDisplay'

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
let version = 0
async function load() {
  ++version
  await list.load()
}
async function loadKanban() {
  list.invalidate()
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
const { dialogTab, dialogOpen, editing, open, saved } = useOpportunityDialogState({
  tenantId,
  reload: () => reload(),
  refreshOverview: () => { void commercialOverview.value?.refresh() },
})
async function refreshRowsSilently(id: string, current: number) {
  const params = { ...applied.value, page: page.value }
  if (viewMode.value === 'list') {
    const result = await opportunitiesApi.list(id, params)
    if (id !== tenantId.value || current !== version || viewMode.value !== 'list' ||
      draggingOpportunity.value || movingId.value || dialogOpen.value) return
    rows.value = result.data
    total.value = result.total
    lastPage.value = result.last_page
    perPage.value = result.per_page
    return
  }
  // Reuse the stage-scoped API and preserve the same visibility rules.
  await stagePagination.refresh(undefined, () => id === tenantId.value && viewMode.value === 'kanban' &&
    !draggingOpportunity.value && !movingId.value && !dialogOpen.value && current === version)
  if (id !== tenantId.value || current !== version || viewMode.value !== 'kanban' ||
    draggingOpportunity.value || movingId.value || dialogOpen.value) return
  total.value = stagePagination.total.value
}
useOpportunityRealtimeSync({
  tenantId, stages, loading, movingId, draggingOpportunity, dialogOpen,
  version: () => version,
  refreshRows: refreshRowsSilently,
  refreshOverview: () => { void commercialOverview.value?.refresh() },
})
useOpportunityPageLifecycle({
  tenantId,
  section,
  viewMode,
  page,
  error,
  invalidate: list.invalidate,
  resetSection: list.resetSection,
  clearReferenceData: referenceData.clear,
  loadReferenceData: referenceData.load,
  invalidateRefresh: () => { ++version },
  reload,
})
watch(stages, (next, previous) => {
  if (viewMode.value === 'kanban' && next.length > 0 && previous.length === 0) reload()
})

const displayOrderType = (item: Opportunity) => displayOpportunityOrderType(item, orderTypes.value)
const money = formatOpportunityMoney

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
