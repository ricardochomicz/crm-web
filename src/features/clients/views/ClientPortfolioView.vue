<script setup lang="ts">
import AppShell from '@/components/layout/AppShell.vue'
import AsyncNotice from '@/components/ui/AsyncNotice.vue'
import ListTable from '@/components/ui/ListTable.vue'
import PagePagination from '@/components/ui/PagePagination.vue'
import PortfolioDetailsDialog from '../components/PortfolioDetailsDialog.vue'
import PortfolioFilters from '../components/PortfolioFilters.vue'
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
      <section class="overflow-hidden rounded-2xl border border-stone-200 bg-white">
        <ListTable min-width="980px">
          <thead class="bg-stone-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th class="p-4">Cliente</th>
              <th class="p-4">Operadora</th>
              <th class="p-4 text-right">Linhas</th>
              <th class="p-4 text-right">Receita mensal</th>
              <th class="p-4">Ativação média</th>
              <th class="p-4">Prazo</th>
              <th class="p-4">Renovação</th>
              <th class="p-4">Situação</th>
              <th class="p-4">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-stone-100">
            <tr v-for="contract in visibleRows" :key="contract.contract_id ?? contract.order_id ?? contract.client_name" class="hover:bg-stone-50/70">
              <td class="p-4">
                <span class="font-semibold text-slate-800">{{ contract.client_name }}</span>

              </td>
              <td class="p-4">{{ contract.operator_name ?? '—' }}</td>
              <td class="p-4 text-right">{{ contract.line_count }}</td>
              <td class="p-4 text-right font-medium">{{ currency.format(Number(contract.monthly_revenue ?? 0)) }}</td>
              <td class="p-4">{{ formatDate(contract.average_activation_date) }}</td>
              <td class="p-4">{{ contract.renewal_months === null ? '—' : `${contract.renewal_months} meses` }}</td>
              <td class="p-4">{{ formatDate(contract.renewal_date) }}</td>
              <td class="p-4 text-sm">{{ viewMode === 'renewing' ? 'Em renovação' : statuses[contract.status] }}</td>
              <td class="p-4">
                <div class="flex flex-wrap items-center gap-2">
                <button type="button" class="rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-stone-50" @click="selectedDetails = contract">Ver detalhes</button>
                <button v-if="viewMode === 'orders' && contract.status === 'overdue' && contract.order_id && !contract.renewal_opportunity_id"
                  type="button" class="primary-button w-auto whitespace-nowrap" @click="openRenewal(contract)">Renovar</button>
                <button v-else-if="viewMode === 'renewing' && contract.renewal_opportunity_id" type="button" class="rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold" @click="router.push('/empresas/' + tenantId + '/oportunidades')">Ver oportunidade</button>
                </div>
              </td>
            </tr>
          </tbody>
        </ListTable>
        <p v-if="!rows.length" class="p-8 text-center text-sm text-slate-500">
          {{ viewMode === 'contracts' ? 'Nenhum contrato consolidado encontrado. Consulte Pedidos históricos para vincular os registros antigos.' : viewMode === 'renewing' ? 'Nenhum pedido com renovação em andamento.' : 'Nenhum pedido concluído encontrado para os filtros informados.' }}
        </p>
      </section>
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
