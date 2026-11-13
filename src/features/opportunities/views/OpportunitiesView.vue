<script setup lang="ts">
import { ref } from 'vue'
import { toast } from '@/services/toast'
import AppIcon from '@/components/ui/AppIcon.vue'
import AppTabs from '@/components/ui/AppTabs.vue'
import CalendarEventDialog from '@/features/calendar/components/CalendarEventDialog.vue'
import AppShell from '@/components/layout/AppShell.vue'
import AsyncNotice from '@/components/ui/AsyncNotice.vue'
import OpportunityFiltersPanel from '../components/OpportunityFilters.vue'
import PagePagination from '@/components/ui/PagePagination.vue'
import OpportunityDialog from '../components/OpportunityDialog.vue'
import OpportunityCommercialDialogs from '../components/OpportunityCommercialDialogs.vue'
import OpportunityKanban from '../components/OpportunityKanban.vue'
import OpportunityListTable from '../components/OpportunityListTable.vue'
import OpportunityCommercialOverview from '../components/OpportunityCommercialOverview.vue'
import { useOpportunitiesPage } from '../composables/useOpportunitiesPage'
import { useOpportunityDeepLink } from '../composables/useOpportunityDeepLink'
import { useOpportunityHighlights } from '../composables/useOpportunityHighlights'

const sectionOptions = [
  { id: 'open', label: 'Em aberto' },
  { id: 'closed', label: 'Encerradas' },
]
const viewOptions = [
  { id: 'list', label: '☷ Lista' },
  { id: 'kanban', label: '▦ Kanban' },
]
function selectSection(value: string) {
  if (value === 'open' || value === 'closed') switchSection(value)
}
function selectView(value: string) {
  if (value === 'list' || value === 'kanban') void changeView(value)
}

const scheduling = ref<{ id: string; client_id?: string | null; title: string } | null>(null)
function onScheduleSaved() {
  scheduling.value = null
  toast.success('Compromisso agendado na oportunidade.')
}
const { tenantId, tenant, clients, products, operators, orderTypes, rows, stages, viewMode, section, recoveringId, recoverCandidate, askRecover, recover, switchSection, kanbanRows, movingId, draggingOpportunity, resendToBackoffice, askResendToBackoffice, resendCandidate, commercialOverview, stageStates, loadMoreKanban, filters, page, total, lastPage, perPage, loading, error, dialogTab, dialogOpen, confirmingSale, lostCandidate, lostReason, markingLost, askMarkLost, markLost, saleCandidate, askConfirmSale, confirmSale, editing, canCreate, canEdit, reload, changeView, moveStage, applyFilters, clearFilters, changePage, open, saved, displayOrderType, money } = useOpportunitiesPage()
useOpportunityDeepLink(tenantId, dialogOpen, open)
const { showHighlightsOnly, highlightedIds, highlightingId, toggleHighlight } = useOpportunityHighlights(tenantId)
</script>
<template>
  <AppShell :tenant="tenant" title="Oportunidades" subtitle="Negociações comerciais e acompanhamento">
    <header class="mb-7 flex flex-wrap items-center justify-between gap-4">
      <div><p class="eyebrow">COMERCIAL</p><h1 class="mt-3 text-3xl font-semibold">Oportunidades</h1><p class="mt-2 text-sm text-slate-500">Acompanhe negociações sem misturar pedidos e carteira.</p></div>
      <button v-if="canCreate" type="button" class="primary-button w-auto" @click="open()">+ Nova oportunidade</button>
    </header>
    <div class="mb-5">
      <AppTabs
        :model-value="section"
        :options="sectionOptions"
        aria-label="Situação das oportunidades"
        @update:model-value="selectSection"
      />
    </div>
    <OpportunityCommercialOverview ref="commercialOverview" :tenant-id="tenantId" />
    <div v-if="section === 'closed'" class="mb-3 text-xs text-slate-500">Histórico de oportunidades ganhas e perdidas. Utilize os filtros para pesquisar por cliente, período e situação.</div>
    <OpportunityFiltersPanel v-model="filters" :section="section" :types="orderTypes" :busy="loading" :count="total" @search="applyFilters" @clear="clearFilters" />
    <div v-if="section === 'open'" class="mb-4 flex flex-wrap items-center justify-end gap-2">
      <button v-if="viewMode === 'kanban'" type="button" class="inline-flex h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-stone-200 bg-white px-4 text-sm font-semibold leading-none shadow-sm transition hover:bg-stone-50" :class="showHighlightsOnly ? 'border-amber-300 bg-amber-50 text-amber-800' : 'text-slate-600'" :aria-pressed="showHighlightsOnly" @click="showHighlightsOnly = !showHighlightsOnly"><AppIcon name="star" class="h-4 w-4 shrink-0" /> <span>{{ showHighlightsOnly ? 'Mostrar todas' : 'Somente destaques' }}</span></button>
      <AppTabs
        :model-value="viewMode"
        :options="viewOptions"
        aria-label="Visualização das oportunidades"
        @update:model-value="selectView"
      />
    </div>
    <AsyncNotice :error="error" @retry="reload" />
    <div v-if="section === 'open' && viewMode === 'kanban' && !loading && !error">
      <OpportunityKanban @dragging="draggingOpportunity = $event" :stage-states="stageStates" @load-more="loadMoreKanban" :highlights-only="showHighlightsOnly" :highlighted-ids="highlightedIds" :highlighting-id="highlightingId" @highlight="toggleHighlight" :stages="stages" :items="kanbanRows" :can-edit="canEdit" :busy-id="movingId" @move="moveStage" @edit="item => open(item)" @history="item => open(item, 'history')" @schedule="item => scheduling = item" @won="askConfirmSale" @lost="askMarkLost" @resend="askResendToBackoffice" />

    </div>
    <OpportunityListTable
      v-if="(section === 'closed' || viewMode === 'list') && !loading && !error"
      :rows="rows"
      :section="section"
      :can-edit="canEdit"
      :recovering-id="recoveringId"
      :display-order-type="displayOrderType"
      :money="money"
      @schedule="scheduling = $event"
      @history="item => open(item, 'history')"
      @edit="item => open(item)"
      @recover="askRecover"
      @confirm-sale="askConfirmSale"
      @mark-lost="askMarkLost"
    />
    <PagePagination v-if="section === 'closed' || viewMode === 'list'" :page="page" :last-page="lastPage" :total="total" :per-page="perPage" :busy="loading" @change="changePage" />
    <CalendarEventDialog
      :open="!!scheduling"
      :tenant-id="tenantId"
      :event="null"
      date=""
      :opportunity-id="scheduling?.id"
      :client-id="scheduling?.client_id ?? undefined"
      :opportunity-title="scheduling?.title"
      :can-write="canEdit"
      :can-delete="false"
      @close="scheduling = null"
      @saved="onScheduleSaved"
    />
    <OpportunityCommercialDialogs
      :recover-candidate="recoverCandidate"
      :recovering-id="recoveringId"
      :resend-candidate="resendCandidate"
      :moving-id="movingId"
      :lost-candidate="lostCandidate"
      :lost-reason="lostReason"
      :marking-lost="markingLost"
      :sale-candidate="saleCandidate"
      :confirming-sale="confirmingSale"
      :money="money"
      @close-recover="recoverCandidate = null"
      @recover="recover"
      @close-resend="resendCandidate = null"
      @resend="resendToBackoffice"
      @close-lost="lostCandidate = null"
      @update:lost-reason="lostReason = $event"
      @mark-lost="markLost"
      @close-sale="saleCandidate = null"
      @confirm-sale="confirmSale"
    />
    <OpportunityDialog :initial-tab="dialogTab" :open="dialogOpen" :tenant-id="tenantId" :opportunity="editing" :clients="clients" :products="products" :operators="operators" :order-types="orderTypes" @close="dialogOpen = false" @saved="saved" />
  </AppShell>
</template>
