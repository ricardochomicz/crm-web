<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import AsyncNotice from '@/components/ui/AsyncNotice.vue'
import OpportunityFiltersPanel from '../components/OpportunityFilters.vue'
import ListTable from '@/components/ui/ListTable.vue'
import PagePagination from '@/components/ui/PagePagination.vue'
import TableActionButton from '@/components/ui/TableActionButton.vue'
import { tenantApi } from '@/features/tenants/api'
import { can, type Tenant } from '@/features/tenants/types'
import { orderTypesApi, type OrderType } from '@/features/order-types/api'
import { productsApi, type Product } from '@/features/products/api'
import { clientsApi, type Client } from '@/features/clients/api'
import { opportunitiesApi, type Opportunity, type FunnelStage, type OpportunityFilters } from '../api'
import OpportunityDialog from '../components/OpportunityDialog.vue'
import OpportunityKanban from '../components/OpportunityKanban.vue'
import OpportunityCommercialOverview from '../components/OpportunityCommercialOverview.vue'
import { errorMessage } from '@/lib/feedback'
import { toast } from '@/services/toast'

const tenantId = computed(() => String(useRoute().params.tenantId))
const tenant = ref<Tenant>()
const clients = ref<Client[]>([])
const products = ref<Product[]>([])
const orderTypes = ref<OrderType[]>([])
const rows = ref<Opportunity[]>([])
const stages = ref<FunnelStage[]>([])
const viewMode = ref<'list' | 'kanban'>('kanban')
const section = ref<'open' | 'closed'>('open')
const recoveringId = ref<string | null>(null)
async function recover(item: Opportunity) {
    if (!canEdit.value || item.status !== 'lost' || recoveringId.value) return
    if (!window.confirm(`Recuperar "${item.title}"? Uma nova oportunidade será criada com os mesmos itens e valores.`)) return
    recoveringId.value = item.id
    try {
        const result = await opportunitiesApi.recover(tenantId.value, item.id)
        toast.success(`Negociação recuperada: ${result.data.code}`)
        switchSection('open')
        void commercialOverview.value?.refresh()
    } catch (exception) {
        toast.error(errorMessage(exception))
    } finally {
        recoveringId.value = null
    }
}
function switchSection(next: 'open' | 'closed') {
    section.value = next
    page.value = 1
    filters.value = defaultFilters(next)
    applied.value = { ...filters.value }
    viewMode.value = next === 'closed' ? 'list' : 'kanban'
    if (next === 'open' && stages.value.length === 0) {
        void opportunitiesApi.stages(tenantId.value).then(result => {
            stages.value = result.data
        }).catch(e => toast.error(errorMessage(e)))
    }
    reload()
}
const kanbanRows = ref<Opportunity[]>([])
const movingId = ref<string | null>(null)
const commercialOverview = ref<InstanceType<typeof OpportunityCommercialOverview> | null>(null)
const kanbanLimitReached = ref(false)
const defaultFilters = (area: 'open' | 'closed' = 'open'): OpportunityFilters => ({
    search: '',
    status: area === 'closed' ? 'all' : 'open',
    period: area === 'closed' ? 'closed' : 'current',
    order_type_id: '',
    date_from: '',
    date_to: '',
})
const filters = ref<OpportunityFilters>(defaultFilters())
const applied = ref<OpportunityFilters>(defaultFilters())
const page = ref(1)
const total = ref(0)
const lastPage = ref(1)
const perPage = ref(20)
const loading = ref(true)
const error = ref('')
const dialogTab = ref<'details' | 'history'>('details')
const dialogOpen = ref(false)
const confirmingSale = ref(false)
const lostCandidate = ref<Opportunity | null>(null)
const lostReason = ref('')
const markingLost = ref(false)
function askMarkLost(item: Opportunity) {
    if (!canEdit.value || item.status !== 'open') return
    lostReason.value = ''
    lostCandidate.value = item
}
async function markLost() {
    const item = lostCandidate.value
    const reason = lostReason.value.trim()
    if (!item || markingLost.value) return
    if (reason.length < 3) {
        toast.error('Informe o motivo da perda (mínimo de 3 caracteres).')
        return
    }
    markingLost.value = true
    try {
        await opportunitiesApi.markLost(tenantId.value, item.id, reason)
        lostCandidate.value = null
        toast.success('Oportunidade marcada como perdida.')
        reload()
        void commercialOverview.value?.refresh()
    } catch (error) {
        toast.error(errorMessage(error))
    } finally {
        markingLost.value = false
    }
}
const saleCandidate = ref<Opportunity | null>(null)
function askConfirmSale(item: Opportunity) {
    if (!canEdit.value || item.status !== 'open') return
    saleCandidate.value = item
}
async function confirmSale() {
    const item = saleCandidate.value
    if (!item || confirmingSale.value) return
    confirmingSale.value = true
    try {
        await opportunitiesApi.confirmSale(tenantId.value, item.id)
        saleCandidate.value = null
        toast.success('Venda confirmada. Pedido comercial criado.')
        reload()
        void commercialOverview.value?.refresh()
    } catch (error) {
        toast.error(errorMessage(error))
    } finally {
        confirmingSale.value = false
    }
}
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
async function loadKanban() {
  const current = ++version
  loading.value = true; error.value = ''
  try {
    const items: Opportunity[] = []
    let next = 1; let pages = 1
    do {
      const result = await opportunitiesApi.list(tenantId.value, { ...applied.value, page: next })
      if (current !== version) return
      items.push(...result.data); pages = result.last_page; next++
    } while (next <= pages && next <= 20)
    kanbanLimitReached.value = next <= pages
    kanbanRows.value = items
    total.value = items.length
  } catch (e) { if (current === version) error.value = errorMessage(e) }
  finally { if (current === version) loading.value = false }
}
function reload() { if (viewMode.value === 'kanban') void loadKanban(); else void load() }
async function changeView(mode: 'list' | 'kanban') {
  viewMode.value = mode
  if (mode === 'kanban') {
    try { stages.value = (await opportunitiesApi.stages(tenantId.value)).data } catch (e) { toast.error(errorMessage(e)) }
  }
  reload()
}
async function moveStage(id: string, stageId: string) {
  if (!canEdit.value || movingId.value || !stageId) return
  const item = kanbanRows.value.find(i => i.id === id)
  if (!item || item.funnel_stage_id === stageId) return
  movingId.value = id
  const previous = item.funnel_stage_id
  item.funnel_stage_id = stageId
  try {
    await opportunitiesApi.moveStage(tenantId.value, id, stageId)
    toast.success('Etapa atualizada.')
  } catch (e) {
    item.funnel_stage_id = previous
    toast.error(errorMessage(e))
  } finally { movingId.value = null }
}
async function setup() {
  const id = tenantId.value
  try {
    const t = await tenantApi.show(id)
    if (id !== tenantId.value) return
    tenant.value = t.data
    const types = await orderTypesApi.active()
    if (id === tenantId.value) orderTypes.value = types.data
    const stageResult = await opportunitiesApi.stages(id)
    if (id === tenantId.value) stages.value = stageResult.data
    if (canCreate.value || canEdit.value) {
      const c = await clientsApi.list(id)
      if (id === tenantId.value) clients.value = c.data
      const p = await productsApi.list(id, 1, { search: '', operator_id: '', category: '', is_active: 'active' })
      if (id === tenantId.value) products.value = p.data
    }
  } catch (e) { error.value = errorMessage(e) }
}
function applyFilters() {
    if (filters.value.min_amount !== undefined && filters.value.max_amount !== undefined && Number(filters.value.min_amount) > Number(filters.value.max_amount)) {
        toast.error('O valor mínimo não pode ser maior que o máximo.')
        return
    }
    page.value = 1
    applied.value = {
        ...filters.value,
        search: filters.value.search?.trim(),
        status: section.value === 'open' ? 'open' : filters.value.status === 'open' ? 'all' : filters.value.status,
        period: section.value === 'closed' ? 'closed' : filters.value.period,
    }
    reload()
}
function clearFilters() {
    filters.value = defaultFilters(section.value)
    applyFilters()
}
function changePage(next: number) { page.value = next; void load() }
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
watch(tenantId, () => { section.value = 'open'; filters.value = defaultFilters(); applied.value = defaultFilters(); viewMode.value = 'kanban'; stages.value = []; tenant.value = undefined; clients.value = []; orderTypes.value = []; page.value = 1; void setup(); reload() }, { immediate: true })
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
</script>
<template>
  <AppShell :tenant="tenant" title="Oportunidades" subtitle="Negociações comerciais e acompanhamento">
    <header class="mb-7 flex flex-wrap items-center justify-between gap-4">
      <div><p class="eyebrow">COMERCIAL</p><h1 class="mt-3 text-3xl font-semibold">Oportunidades</h1><p class="mt-2 text-sm text-slate-500">Acompanhe negociações sem misturar pedidos e carteira.</p></div>
      <button v-if="canCreate" type="button" class="primary-button w-auto" @click="open()">+ Nova oportunidade</button>
    </header>
    <div class="mb-5 inline-flex rounded-xl border border-stone-200 bg-white p-1 shadow-sm" role="group" aria-label="Situação das oportunidades">
      <button type="button" class="rounded-lg px-4 py-2 text-sm font-semibold" :class="section === 'open' ? 'bg-orange-50 text-orange-700' : 'text-slate-600 hover:bg-stone-50'" @click="switchSection('open')">Em aberto</button>
      <button type="button" class="rounded-lg px-4 py-2 text-sm font-semibold" :class="section === 'closed' ? 'bg-orange-50 text-orange-700' : 'text-slate-600 hover:bg-stone-50'" @click="switchSection('closed')">Encerradas</button>
    </div>
    <OpportunityCommercialOverview ref="commercialOverview" :tenant-id="tenantId" />
    <div v-if="section === 'closed'" class="mb-3 text-xs text-slate-500">Histórico de oportunidades ganhas e perdidas. Utilize os filtros para pesquisar por cliente, período e situação.</div>
    <OpportunityFiltersPanel v-model="filters" :section="section" :types="orderTypes" :busy="loading" :count="total" @search="applyFilters" @clear="clearFilters" />
    <div v-if="section === 'open'" class="mb-4 flex justify-end">
      <div class="inline-flex rounded-xl border border-stone-200 bg-white p-1 shadow-sm" role="group" aria-label="Visualização das oportunidades">
        <button type="button" class="rounded-lg px-4 py-2 text-sm font-semibold" :class="viewMode === 'list' ? 'bg-orange-50 text-orange-700' : 'text-slate-600 hover:bg-stone-50'" @click="changeView('list')">☷ Lista</button>
        <button type="button" class="rounded-lg px-4 py-2 text-sm font-semibold" :class="viewMode === 'kanban' ? 'bg-orange-50 text-orange-700' : 'text-slate-600 hover:bg-stone-50'" @click="changeView('kanban')">▦ Kanban</button>
      </div>
    </div>
    <AsyncNotice :loading="loading" :error="error" @retry="reload" />
    <div v-if="section === 'open' && viewMode === 'kanban' && !loading && !error">
      <p v-if="kanbanLimitReached" class="mb-3 text-sm text-amber-700">Há mais oportunidades do que o limite de carregamento do quadro. Refine os filtros para visualizar todas.</p>
      <OpportunityKanban :stages="stages" :items="kanbanRows" :can-edit="canEdit" :busy-id="movingId" @move="moveStage" @edit="item => open(item)" @history="item => open(item, 'history')" @won="askConfirmSale" @lost="askMarkLost" />
    </div>
    <section v-if="(section === 'closed' || viewMode === 'list') && !loading && !error" class="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
      <ListTable min-width="750px">
        <thead class="bg-stone-50 text-xs font-semibold uppercase tracking-wide text-slate-500"><tr>
          <th class="p-4">Oportunidade</th><th class="p-4">Cliente</th><th class="p-4">Tipo</th><th class="p-4">Previsão</th><th class="p-4">Valor mensal</th><th v-if="section === 'closed'" class="p-4">Encerramento / motivo</th><th class="p-4">Ações</th>
        </tr></thead>
        <tbody><tr v-for="item in rows" :key="item.id" class="border-t border-stone-100 hover:bg-stone-50/70">
          <td class="p-4"><p class="font-semibold text-slate-800">{{ item.title }}</p><p class="text-xs text-slate-500">{{ item.code }}</p></td>
          <td class="p-4">{{ item.client?.company_name ?? '—' }}</td>
          <td class="p-4">{{ displayOrderType(item) }}</td>
          <td class="p-4">
              <span>{{ item.expected_close_at ? item.expected_close_at.slice(0, 10).split('-').reverse().join('/') : '—' }}</span>
              <span v-if="item.status === 'open' && item.expected_close_at && item.expected_close_at.slice(0, 10) < new Date().toISOString().slice(0, 10)" class="ml-2 rounded-md bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700">Atrasada</span>
            </td>
          <td class="p-4 font-semibold">{{ money(item.estimated_monthly_amount) }}</td>
          <td v-if="section === 'closed'" class="p-4 text-sm">
            <span class="rounded-md px-2 py-1 text-xs font-semibold" :class="item.status === 'won' ? 'bg-emerald-50 text-emerald-700' : item.status === 'lost' ? 'bg-rose-50 text-rose-700' : 'bg-stone-100 text-slate-600'">{{ item.status === 'won' ? 'Ganha' : item.status === 'lost' ? 'Perdida' : 'Cancelada' }}</span>
            <p class="mt-2 text-xs text-slate-500">{{ item.closed_at ? item.closed_at.slice(0, 10).split('-').reverse().join('/') : '—' }}</p>
            <p v-if="item.lost_reason" class="mt-1 max-w-64 text-xs text-slate-600">{{ item.lost_reason }}</p>
          </td>
          <td class="p-4">
            <div class="flex items-center gap-2">
              <TableActionButton icon="message-square" :label="`Histórico de ${item.title}`" @click="open(item, 'history')" />
              <TableActionButton v-if="section === 'open' && canEdit && item.status === 'open'" icon="edit" :label="`Editar ${item.title}`" @click="open(item)" />
              <button v-if="canEdit && section === 'closed' && item.status === 'lost'" type="button" class="rounded-lg border border-amber-200 bg-amber-50 px-2 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100" :disabled="!!recoveringId" @click="recover(item)">{{ recoveringId === item.id ? 'Recuperando…' : 'Recuperar negociação' }}</button>
              <button v-if="section === 'open' && canEdit && item.status === 'open'" type="button" class="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100" @click="askConfirmSale(item)">Confirmar venda</button>
              <button v-if="section === 'open' && canEdit && item.status === 'open'" type="button" class="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1.5 text-xs font-semibold text-rose-800 hover:bg-rose-100" @click="askMarkLost(item)">Venda perdida</button>
            </div>
          </td>
        </tr></tbody>
      </ListTable>
      <p v-if="!rows.length" class="p-6 text-center text-sm text-slate-500">Nenhuma oportunidade encontrada.</p>
    </section>
    <PagePagination v-if="section === 'closed' || viewMode === 'list'" :page="page" :last-page="lastPage" :total="total" :per-page="perPage" :busy="loading" @change="changePage" />
    <div v-if="lostCandidate" class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4" role="presentation" @click.self="!markingLost && (lostCandidate = null)">
      <form role="dialog" aria-modal="true" aria-labelledby="mark-lost-title" class="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl" @submit.prevent="markLost">
        <h2 id="mark-lost-title" class="text-lg font-semibold text-slate-900">Registrar venda perdida</h2>
        <p class="mt-2 text-sm text-slate-600">Oportunidade: <strong>{{ lostCandidate.title }}</strong>. O registro permanecerá no histórico comercial.</p>
        <label class="mt-4 block text-sm font-semibold text-slate-700" for="lost-reason">Motivo da perda *</label>
        <textarea id="lost-reason" v-model="lostReason" class="field mt-2 min-h-24 w-full" required minlength="3" maxlength="200" placeholder="Ex.: cliente optou pela concorrência" />
        <div class="mt-6 flex justify-end gap-2">
          <button type="button" class="secondary-button w-auto" :disabled="markingLost" @click="lostCandidate = null">Cancelar</button>
          <button type="submit" class="primary-button w-auto" :disabled="markingLost || lostReason.trim().length < 3">{{ markingLost ? 'Registrando…' : 'Confirmar perda' }}</button>
        </div>
      </form>
    </div>
    <div v-if="saleCandidate" class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4" role="presentation" @click.self="!confirmingSale && (saleCandidate = null)">
      <section role="dialog" aria-modal="true" aria-labelledby="confirm-sale-title" class="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <h2 id="confirm-sale-title" class="text-lg font-semibold text-slate-900">Confirmar venda</h2>
        <p class="mt-2 text-sm text-slate-600">Deseja converter a oportunidade <strong>{{ saleCandidate.title }}</strong> em pedido comercial?</p>
        <div class="mt-4 rounded-xl bg-stone-50 p-4 text-sm">
          <p><strong>Cliente:</strong> {{ saleCandidate.client?.company_name ?? '—' }}</p>
          <p class="mt-2"><strong>Valor mensal:</strong> {{ money(saleCandidate.estimated_monthly_amount) }}</p>
          <p class="mt-2 text-xs text-slate-500">Os itens serão copiados para um pedido em rascunho. A oportunidade será marcada como ganha e sairá da visualização padrão.</p>
        </div>
        <div class="mt-6 flex justify-end gap-2">
          <button type="button" class="secondary-button w-auto" :disabled="confirmingSale" @click="saleCandidate = null">Cancelar</button>
          <button type="button" class="primary-button w-auto" :disabled="confirmingSale" @click="confirmSale">{{ confirmingSale ? 'Confirmando…' : 'Confirmar e gerar pedido' }}</button>
        </div>
      </section>
    </div>
    <OpportunityDialog :initial-tab="dialogTab" :open="dialogOpen" :tenant-id="tenantId" :opportunity="editing" :clients="clients" :products="products" :order-types="orderTypes" @close="dialogOpen = false" @saved="saved" />
  </AppShell>
</template>
