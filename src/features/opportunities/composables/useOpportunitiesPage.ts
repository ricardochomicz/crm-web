import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { tenantApi } from '@/features/tenants/api'
import { can, type Tenant } from '@/features/tenants/types'
import { orderTypesApi, type OrderType } from '@/features/order-types/api'
import { productsApi, type Product } from '@/features/products/api'
import { clientsApi, type Client } from '@/features/clients/api'
import { opportunitiesApi, type Opportunity, type FunnelStage, type OpportunityFilters } from '../api'
import type OpportunityCommercialOverview from '../components/OpportunityCommercialOverview.vue'
import { errorMessage } from '@/lib/feedback'
import { toast } from '@/services/toast'

export function useOpportunitiesPage() {
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

    return {
        tenantId,
        tenant,
        clients,
        products,
        orderTypes,
        rows,
        stages,
        viewMode,
        section,
        recoveringId,
        recover,
        switchSection,
        kanbanRows,
        movingId,
        commercialOverview,
        kanbanLimitReached,
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
