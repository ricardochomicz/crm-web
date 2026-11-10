import { computed, ref, watch, type Ref } from 'vue'
import { useListPagination } from '@/composables/useListPagination'
import { useListFilters } from '@/composables/useListFilters'
import { toast } from '@/services/toast'
import { tenantApi } from '@/features/tenants/api'
import { operatorsApi, type TenantOperator } from '@/features/operators/api'
import { orderTypesApi } from '@/features/order-types/api'
import { teamCommissionsApi, type CommissionOption } from '@/features/team-commissions/api'
import type { Tenant } from '@/features/tenants/types'
import { commercialGoalsApi, type CommercialGoal, type GoalInput } from '../api'

export function useCommercialGoalsPage(tenantId: Ref<string>) {
const tenant = ref<Tenant>()
const rows = ref<CommercialGoal[]>([])
const operators = ref<TenantOperator[]>([])
const orderTypes = ref<CommissionOption[]>([])
const roles = ref<CommissionOption[]>([])
const loading = ref(true)
const busy = ref(false)
const error = ref('')
const canManage = ref(false)
const writable = computed(() => canManage.value && !!tenant.value?.access?.allows_operational_writes)
const modalOpen = ref(false)
const editingId = ref<string | null>(null)
const initial = (): GoalInput => ({
 operator_id: 0,
 order_type: '',
 commercial_role: '',
 metric: 'QUANTITY', starts_on: new Date().toISOString().slice(0,10),
 ends_on: null, is_active: true, tiers: [{minimum:0, percentage:50}],
})
const form = ref<GoalInput>(initial())
const label = (options: CommissionOption[], value: string) => options.find(o => o.value === value)?.label ?? value
const metricLabel = (metric: string) => metric === 'QUANTITY' ? 'Linhas' : 'Receita'
const filterOperator = ref('')
const filterType = ref('')
const filterRole = ref('')
const { applied, apply: applyFilters, clear: clearFilters } = useListFilters({ filterOperator, filterType, filterRole })
const filtered = computed(() => rows.value.filter(r =>
 (!applied.value.filterOperator || String(r.operator_id) === applied.value.filterOperator) &&
 (!applied.value.filterType || r.order_type === applied.value.filterType) &&
 (!applied.value.filterRole || r.commercial_role === applied.value.filterRole)))
async function load() {
 const id = tenantId.value
 loading.value = true; error.value = ''
 try {
  const [t, g, o, options, catalog] = await Promise.all([
   tenantApi.show(id),
   commercialGoalsApi.list(id),
   operatorsApi.tenantList(id),
   teamCommissionsApi.options(id),
   orderTypesApi.active(),
  ])
  if (id !== tenantId.value) return
  tenant.value = t.data; rows.value = g.data; canManage.value = g.meta.can_manage
  operators.value = o.data.filter(item => item.selected)
  // The goal API persists legacy enum codes; only offer order types present in the active catalog.
  const normalize = (name: string) => name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').trim()
  const activeNames = new Set(catalog.data.filter(type => type.is_active).map(type => normalize(type.name)))
  orderTypes.value = options.data.order_types.filter(type => activeNames.has(normalize(type.label)))
  roles.value = options.data.roles
 } catch (e) { if (id === tenantId.value) error.value = e instanceof Error ? e.message : 'Não foi possível carregar as metas.' }
 finally { if (id === tenantId.value) loading.value = false }
}
function edit(goal?: CommercialGoal) {
 editingId.value = goal?.id ?? null
 form.value = goal ? {operator_id:goal.operator_id,order_type:goal.order_type,commercial_role:goal.commercial_role,metric:goal.metric,starts_on:goal.starts_on,ends_on:goal.ends_on,is_active:goal.is_active,tiers:goal.tiers.map(t=>({minimum:Number(t.minimum),percentage:Number(t.percentage)}))} : initial()
 modalOpen.value = true
}
async function save() {
 if (!form.value.operator_id || !form.value.order_type || !form.value.commercial_role) {
  toast.error('Selecione operadora, tipo de pedido e perfil antes de salvar.')
  return
 }
 busy.value = true
 try {
  await commercialGoalsApi.save(tenantId.value, form.value, editingId.value ?? undefined)
  modalOpen.value = false
  toast.success('Meta comercial salva.')
  await load()
 } catch(e) { toast.error(e instanceof Error ? e.message : 'Erro ao salvar meta.') }
 finally { busy.value = false }
}
watch(tenantId, () => { modalOpen.value = false; void load() }, { immediate: true })
const { page, total, lastPage, pageRows, changePage } = useListPagination(filtered)

return { tenant, rows, operators, orderTypes, roles, loading, busy, error, canManage, writable, modalOpen, editingId, form, label, metricLabel, filterOperator, filterType, filterRole, applyFilters, clearFilters, filtered, load, edit, save, page, total, lastPage, pageRows, changePage }
}
