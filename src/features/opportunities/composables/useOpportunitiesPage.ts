import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import type { Opportunity } from '../api'
import { useOpportunityStagePagination } from './useOpportunityStagePagination'
import type OpportunityCommercialOverview from '../components/OpportunityCommercialOverview.vue'
import { useOpportunityRealtimeSync } from './useOpportunityRealtimeSync'
import { useOpportunityReferenceData } from './useOpportunityReferenceData'
import { useOpportunityCommercialActions } from './useOpportunityCommercialActions'
import { useOpportunityStageMovement } from './useOpportunityStageMovement'
import { useOpportunityListFilters } from './useOpportunityListFilters'
import { useOpportunityDialogState } from './useOpportunityDialogState'
import { useOpportunityPageLifecycle } from './useOpportunityPageLifecycle'
import { useOpportunityViewNavigation } from './useOpportunityViewNavigation'
import { useOpportunitySilentRefresh } from './useOpportunitySilentRefresh'
import { useOpportunityDataLoading } from './useOpportunityDataLoading'
import { displayOpportunityOrderType, formatOpportunityMoney } from '../utils/opportunityDisplay'

export function useOpportunitiesPage() {
    const tenantId = computed(() => String(useRoute().params.tenantId))
const referenceData = useOpportunityReferenceData(tenantId)
const { tenant, clients, products, operators, orderTypes, stages, canCreate, canEdit } = referenceData
const viewMode = ref<'list' | 'kanban'>('kanban')
const section = ref<'open' | 'closed'>('open')
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
const { reload, getVersion, invalidateRefresh } = useOpportunityDataLoading({
  viewMode, loading, error, total,
  invalidateList: list.invalidate,
  loadList: list.load,
  resetKanban: stagePagination.reset,
  kanbanTotal: stagePagination.total,
})
function loadMoreKanban(stageId: string) {
  stagePagination.loadMore(stageId)
}
const { switchSection, changeView } = useOpportunityViewNavigation({
  tenantId, section, viewMode, stages,
  resetSection: list.resetSection,
  reload,
})
const { dialogTab, dialogOpen, editing, open, saved } = useOpportunityDialogState({
  tenantId,
  reload: () => reload(),
  refreshOverview: () => { void commercialOverview.value?.refresh() },
})
const { refreshRows: refreshRowsSilently } = useOpportunitySilentRefresh({
  tenantId, viewMode,
  dragging: draggingOpportunity, movingId, dialogOpen,
  version: getVersion,
  refreshList: list.refreshSilently,
  refreshKanban: canApply => stagePagination.refresh(undefined, canApply),
  syncKanbanTotal: () => { total.value = stagePagination.total.value },
})
useOpportunityRealtimeSync({
  tenantId, stages, loading, movingId, draggingOpportunity, dialogOpen,
  version: getVersion,
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
  invalidateRefresh,
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
