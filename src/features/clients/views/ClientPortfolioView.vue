<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from '@/services/toast'
import AppShell from '@/components/layout/AppShell.vue'
import AsyncNotice from '@/components/ui/AsyncNotice.vue'
import ListFilters from '@/components/ui/ListFilters.vue'
import ListTable from '@/components/ui/ListTable.vue'
import PagePagination from '@/components/ui/PagePagination.vue'
import SearchSelect from '@/components/ui/SearchSelect.vue'
import PortfolioDetailsDialog from '../components/PortfolioDetailsDialog.vue'
import { tenantApi } from '@/features/tenants/api'
import { operatorsApi } from '@/features/operators/api'
import type { Tenant } from '@/features/tenants/types'
import { clientsApi, type PortfolioContract } from '../api'

const route = useRoute()
const router = useRouter()
const renewing = ref<PortfolioContract | null>(null)
const selectedDetails = ref<PortfolioContract | null>(null)
const savingRenewal = ref(false)
const visibleRows = computed(() => rows.value)
function openRenewal(contract: PortfolioContract) {
  renewing.value = contract
}
async function confirmRenewal() {
  const contract = renewing.value
  if (!contract?.order_id || savingRenewal.value || !(contract.lines?.length)) return
  savingRenewal.value = true
  try {
    await clientsApi.renewHistoricalOrder(tenantId.value, contract.order_id, (contract.lines ?? []).map(line => line.id))
    renewing.value = null
    toast.success('Oportunidade de renovação criada com sucesso.')
    await load()
    await router.push('/empresas/' + tenantId.value + '/oportunidades')
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Não foi possível iniciar a renovação.')
  } finally { savingRenewal.value = false }
}
const tenantId = computed(() => String(route.params.tenantId))
const tenant = ref<Tenant>()
const operators = ref<{ id: number; name: string }[]>([])
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

    <ListFilters
      :columns="4"
      collapsible
      initially-collapsed
      :active-count="[appliedSearch, appliedOperator, appliedRenewalMonth, appliedRenewalYear].filter(Boolean).length"
      :count-label="`${total} contrato(s) encontrado(s)`"
      @search="applyFilters"
      @clear="clearFilters"
    >
      <label class="text-xs font-semibold text-slate-600">
        Buscar cliente
        <input v-model="search" class="field" type="search" placeholder="Nome, CPF ou CNPJ" />
      </label>
      <label class="text-xs font-semibold text-slate-600">
        Operadora
        <SearchSelect
          v-model="operatorFilter"
          :options="[
            { value: '', label: 'Todas as operadoras' },
            ...operators.map((operator) => ({ value: String(operator.id), label: operator.name })),
          ]"
        />
      </label>
      <label class="text-xs font-semibold text-slate-600">
        Mês da renovação
        <SearchSelect v-model="renewalMonth" :options="[{ value: '', label: 'Todos os meses' }, ...['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'].map((name, index) => ({ value: String(index + 1), label: name }))]" />
      </label>
      <label class="text-xs font-semibold text-slate-600">
        Ano da renovação
        <input v-model="renewalYear" class="field" type="number" min="2000" max="2200" placeholder="Ex.: 2028" />
      </label>
    </ListFilters>

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
    <div v-if="renewing" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <section role="dialog" aria-modal="true" aria-labelledby="renewal-title" class="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl">
        <h2 id="renewal-title" class="text-xl font-semibold">Renovar contrato</h2>
        <p class="mt-3 text-sm text-slate-600">
          Deseja iniciar a renovação do contrato de <strong>{{ renewing.client_name }}</strong>
          com <strong>{{ renewing.line_count }} {{ renewing.line_count === 1 ? 'linha' : 'linhas' }}</strong>?
        </p>
        <p class="mt-3 text-sm text-slate-500">
          Uma nova oportunidade será criada com todas as linhas e os dados comerciais do pedido original.
          As datas de ativação não serão copiadas.
        </p>
        <div class="mt-5 flex justify-end gap-2">
          <button type="button" class="secondary-button w-auto" :disabled="savingRenewal" @click="renewing = null">Cancelar</button>
          <button type="button" class="primary-button w-auto" :disabled="savingRenewal || !renewing.lines?.length" @click="confirmRenewal">{{ savingRenewal ? 'Criando...' : 'Criar oportunidade' }}</button>
        </div>
      </section>
    </div>
  </AppShell>
</template>
