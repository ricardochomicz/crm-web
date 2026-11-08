<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import AsyncNotice from '@/components/ui/AsyncNotice.vue'
import ListFilters from '@/components/ui/ListFilters.vue'
import ListTable from '@/components/ui/ListTable.vue'
import PagePagination from '@/components/ui/PagePagination.vue'
import SearchSelect from '@/components/ui/SearchSelect.vue'
import { tenantApi } from '@/features/tenants/api'
import { operatorsApi } from '@/features/operators/api'
import type { Tenant } from '@/features/tenants/types'
import { clientsApi, type PortfolioContract } from '../api'

const route = useRoute()
const tenantId = computed(() => String(route.params.tenantId))
const tenant = ref<Tenant>()
const operators = ref<{ id: number; name: string }[]>([])
const rows = ref<PortfolioContract[]>([])
const search = ref('')
const operatorFilter = ref('')
const appliedSearch = ref('')
const appliedOperator = ref('')
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
    const response = await clientsApi.portfolio(id, {
      search: appliedSearch.value || undefined,
      operator_id: appliedOperator.value ? Number(appliedOperator.value) : undefined,
      page: page.value,
      per_page: perPage,
    })

    if (version !== requestVersion) return
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
  appliedSearch.value = ''
  appliedOperator.value = ''

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
  page.value = 1
  void load()
}

function clearFilters() {
  search.value = ''
  operatorFilter.value = ''
  applyFilters()
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
        Pedidos concluídos, receita recorrente e previsão de renovação integral.
      </p>
    </header>

    <ListFilters
      :columns="2"
      :count-label="`${total} contrato(s) encontrado(s)`"
      @search="applyFilters"
      @clear="clearFilters"
    >
      <label class="text-xs font-semibold text-slate-600">
        Buscar cliente
        <input v-model="search" class="field" type="search" placeholder="Nome ou documento" />
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
    </ListFilters>

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
            </tr>
          </thead>
          <tbody class="divide-y divide-stone-100">
            <tr v-for="contract in rows" :key="contract.order_id" class="hover:bg-stone-50/70">
              <td class="p-4">
                <span class="font-semibold text-slate-800">{{ contract.client_name }}</span>
                <p class="mt-1 text-xs text-slate-400">{{ contract.order_code ?? 'Pedido sem código' }}</p>
              </td>
              <td class="p-4">{{ contract.operator_name ?? '—' }}</td>
              <td class="p-4 text-right">{{ contract.line_count }}</td>
              <td class="p-4 text-right font-medium">{{ currency.format(Number(contract.monthly_revenue ?? 0)) }}</td>
              <td class="p-4">{{ formatDate(contract.average_activation_date) }}</td>
              <td class="p-4">{{ contract.renewal_months === null ? '—' : `${contract.renewal_months} meses` }}</td>
              <td class="p-4">{{ formatDate(contract.renewal_date) }}</td>
              <td class="p-4 text-sm">{{ statuses[contract.status] }}</td>
            </tr>
          </tbody>
        </ListTable>
        <p v-if="!rows.length" class="p-8 text-center text-sm text-slate-500">
          Nenhum contrato concluído encontrado para os filtros informados.
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
  </AppShell>
</template>
