<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import AsyncNotice from '@/components/ui/AsyncNotice.vue'
import ListFilters from '@/components/ui/ListFilters.vue'
import ListTable from '@/components/ui/ListTable.vue'
import PagePagination from '@/components/ui/PagePagination.vue'
import TableActionButton from '@/components/ui/TableActionButton.vue'
import { tenantApi } from '@/features/tenants/api'
import { can, type Tenant } from '@/features/tenants/types'
import { productsApi, type Product } from '@/features/products/api'
import { clientsApi, type Client } from '@/features/clients/api'
import { opportunitiesApi, type Opportunity } from '../api'
import OpportunityDialog from '../components/OpportunityDialog.vue'
import { errorMessage } from '@/lib/feedback'
import { toast } from '@/services/toast'

const tenantId = computed(() => String(useRoute().params.tenantId))
const tenant = ref<Tenant>()
const clients = ref<Client[]>([])
const products = ref<Product[]>([])
const rows = ref<Opportunity[]>([])
const search = ref('')
const status = ref('open')
const applied = ref({ search: '', status: 'open' })
const page = ref(1)
const total = ref(0)
const lastPage = ref(1)
const perPage = ref(20)
const loading = ref(true)
const error = ref('')
const dialogOpen = ref(false)
const editing = ref<Opportunity | null>(null)
const canCreate = computed(() => can(tenant.value, 'opportunities.create') && !!tenant.value?.access?.allows_operational_writes)
const canEdit = computed(() => can(tenant.value, 'opportunities.update') && !!tenant.value?.access?.allows_operational_writes)
let version = 0
async function load() {
  const current = ++version
  loading.value = true
  error.value = ''
  try {
    const result = await opportunitiesApi.list(tenantId.value, { ...applied.value, page: page.value })
    if (current !== version) return
    rows.value = result.data
    total.value = result.total
    lastPage.value = result.last_page
    perPage.value = result.per_page
  } catch (e) { if (current === version) error.value = errorMessage(e) }
  finally { if (current === version) loading.value = false }
}
async function setup() {
  const id = tenantId.value
  try {
    const t = await tenantApi.show(id)
    if (id !== tenantId.value) return
    tenant.value = t.data
    if (canCreate.value || canEdit.value) {
      const c = await clientsApi.list(id)
      if (id === tenantId.value) clients.value = c.data
      const p = await productsApi.list(id, 1, { search: '', operator_id: '', category: '', is_active: 'active' })
      if (id === tenantId.value) products.value = p.data
    }
  } catch (e) { error.value = errorMessage(e) }
}
function applyFilters() { page.value = 1; applied.value = { search: search.value.trim(), status: status.value }; void load() }
function clearFilters() { search.value = ''; status.value = 'open'; applyFilters() }
function changePage(next: number) { page.value = next; void load() }
async function open(item: Opportunity | null = null) {
  if (item) {
    try {
      const detail = await opportunitiesApi.show(tenantId.value, item.id)
      editing.value = detail.data
    } catch (e) { toast.error(errorMessage(e)); return }
  } else editing.value = null
  dialogOpen.value = true
}
function saved() { dialogOpen.value = false; toast.success('Oportunidade salva.'); void load() }
watch(tenantId, () => { tenant.value = undefined; clients.value = []; page.value = 1; void setup(); void load() }, { immediate: true })
const money = (value: string) => Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
</script>
<template>
  <AppShell :tenant="tenant" title="Oportunidades" subtitle="Negociações comerciais e acompanhamento">
    <header class="mb-7 flex flex-wrap items-center justify-between gap-4">
      <div><p class="eyebrow">COMERCIAL</p><h1 class="mt-3 text-3xl font-semibold">Oportunidades</h1><p class="mt-2 text-sm text-slate-500">Acompanhe negociações sem misturar pedidos e carteira.</p></div>
      <button v-if="canCreate" type="button" class="primary-button w-auto" @click="open()">+ Nova oportunidade</button>
    </header>
    <ListFilters :busy="loading" :columns="2" :count-label="`${total} oportunidade(s) encontrada(s)`" @search="applyFilters" @clear="clearFilters">
      <label class="text-xs font-semibold text-slate-600">Buscar
        <input v-model="search" class="field" type="search" placeholder="Código ou título" />
      </label>
      <label class="text-xs font-semibold text-slate-600">Situação
        <select v-model="status" class="field">
          <option value="open">Em aberto</option><option value="won">Ganhas</option><option value="lost">Perdidas</option><option value="cancelled">Canceladas</option>
        </select>
      </label>
    </ListFilters>
    <AsyncNotice :loading="loading" :error="error" @retry="load" />
    <section v-if="!loading && !error" class="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
      <ListTable min-width="750px">
        <thead class="bg-stone-50 text-xs font-semibold uppercase tracking-wide text-slate-500"><tr>
          <th class="p-4">Oportunidade</th><th class="p-4">Cliente</th><th class="p-4">Tipo</th><th class="p-4">Previsão</th><th class="p-4">Valor mensal</th><th class="p-4">Ações</th>
        </tr></thead>
        <tbody><tr v-for="item in rows" :key="item.id" class="border-t border-stone-100 hover:bg-stone-50/70">
          <td class="p-4"><p class="font-semibold text-slate-800">{{ item.title }}</p><p class="text-xs text-slate-500">{{ item.code }}</p></td>
          <td class="p-4">{{ item.client?.company_name ?? '—' }}</td>
          <td class="p-4">{{ item.order_type }}</td>
          <td class="p-4">{{ item.expected_close_at ? new Date(item.expected_close_at).toLocaleDateString('pt-BR') : '—' }}</td>
          <td class="p-4 font-semibold">{{ money(item.estimated_monthly_amount) }}</td>
          <td class="p-4"><TableActionButton v-if="canEdit && item.status === 'open'" icon="edit" :label="`Editar ${item.title}`" @click="open(item)" /></td>
        </tr></tbody>
      </ListTable>
      <p v-if="!rows.length" class="p-6 text-center text-sm text-slate-500">Nenhuma oportunidade encontrada.</p>
    </section>
    <PagePagination :page="page" :last-page="lastPage" :total="total" :per-page="perPage" :busy="loading" @change="changePage" />
    <OpportunityDialog :open="dialogOpen" :tenant-id="tenantId" :opportunity="editing" :clients="clients" :products="products" @close="dialogOpen = false" @saved="saved" />
  </AppShell>
</template>
