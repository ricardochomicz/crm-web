<script setup lang="ts">
import AppShell from '@/components/layout/AppShell.vue'
import AsyncNotice from '@/components/ui/AsyncNotice.vue'
import PagePagination from '@/components/ui/PagePagination.vue'
import PortfolioDetailsDialog from '../components/PortfolioDetailsDialog.vue'
import PortfolioFilters from '../components/PortfolioFilters.vue'
import PortfolioContractsTable from '../components/PortfolioContractsTable.vue'
import PortfolioRenewalDialog from '../components/PortfolioRenewalDialog.vue'
import { useClientPortfolioPage } from '../composables/useClientPortfolioPage'

const {
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
  confirmRenewal,
  router,
} = useClientPortfolioPage()
</script>

<template>
  <AppShell :tenant="tenant" title="Carteira de contratos" subtitle="Base comercial">
    <header class="mb-7">
      <p class="eyebrow">COMERCIAL</p>
      <h1 class="mt-3 text-3xl font-semibold">Carteira de contratos</h1>
      <p class="mt-2 text-sm text-slate-500">
        Contratos consolidados e pedidos históricos aguardando vinculação.
      </p>
    </header>

    <PortfolioFilters
      v-model:search="search"
      v-model:operator-filter="operatorFilter"
      v-model:renewal-month="renewalMonth"
      v-model:renewal-year="renewalYear"
      :operators="operators"
      :total="total"
      :active-count="[appliedSearch, appliedOperator, appliedRenewalMonth, appliedRenewalYear].filter(Boolean).length"
      :busy="loading"
      @search="applyFilters"
      @clear="clearFilters"
    />

    <div class="mb-4 flex flex-wrap items-center gap-2">
      <button type="button" class="rounded-lg border px-4 py-2 text-sm font-medium" :class="viewMode === 'contracts' ? 'border-slate-900 bg-slate-900 text-white' : 'border-stone-200 bg-white text-slate-700'" @click="changeMode('contracts')">Contratos consolidados</button>
      <button type="button" class="rounded-lg border px-4 py-2 text-sm font-medium" :class="viewMode === 'orders' ? 'border-slate-900 bg-slate-900 text-white' : 'border-stone-200 bg-white text-slate-700'" @click="changeMode('orders')">Pedidos históricos</button>
      <button type="button" class="rounded-lg border px-4 py-2 text-sm font-medium" :class="viewMode === 'renewing' ? 'border-slate-900 bg-slate-900 text-white' : 'border-stone-200 bg-white text-slate-700'" @click="changeMode('renewing')">Em renovação</button>
    </div>
    <p v-if="viewMode === 'orders'" class="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Estes pedidos ainda são exibidos individualmente. Vincule-os aos contratos pelo cadastro do cliente para que apareçam na carteira consolidada. A renovação integral deve ser calculada somente após a consolidação.</p>
    <AsyncNotice :loading="loading" :error="error" @retry="load" />

    <template v-if="!loading && !error">
      <PortfolioContractsTable
        :rows="visibleRows"
        :view-mode="viewMode"
        @details="selectedDetails = $event"
        @renew="openRenewal"
        @opportunity="router.push('/empresas/' + tenantId + '/oportunidades')"
      />
      <PagePagination
        :page="page"
        :last-page="lastPage"
        :total="total"
        :per-page="perPage"
        :busy="loading"
        @change="changePage"
      />
    </template>
    <PortfolioDetailsDialog :open="!!selectedDetails" :record="selectedDetails" :mode="viewMode" @close="selectedDetails = null" />
    <PortfolioRenewalDialog
      :contract="renewing"
      :busy="savingRenewal"
      @close="renewing = null"
      @confirm="confirmRenewal"
    />
  </AppShell>
</template>
