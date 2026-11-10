import { computed, ref, watch, type Ref } from 'vue'
import { useListPagination } from '@/composables/useListPagination'
import { useListFilters } from '@/composables/useListFilters'
import { toast } from '@/services/toast'
import { tenantApi } from '@/features/tenants/api'
import { operatorsApi, type TenantOperator } from '@/features/operators/api'
import { teamApi } from '@/features/members/api'
import type { Member } from '@/features/members/types'
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
const members = ref<Member[]>([])
const loading = ref(true)
const busy = ref(false)
const error = ref('')
const canManage = ref(false)
const writable = computed(() => canManage.value && !!tenant.value?.access?.allows_operational_writes)
const modalOpen = ref(false)
const editingId = ref<string | null>(null)
const bulkMode = ref(false)
const selectedMemberIds = ref<string[]>([])
const bulkResult = ref<{created_count: number; skipped_count: number; skipped: {responsible_membership_id: string; reason: string}[]} | null>(null)
const initial = (): GoalInput => ({
 operator_id: 0,
 order_type: '', category: null, negotiation_type_ids: [], target_scope: 'COMPANY', responsible_membership_id: null,
 commercial_role: '',
 metric: '' as GoalInput['metric'], starts_on: new Date().toISOString().slice(0,10),
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
  const [t, g, o, options, catalog, memberPage] = await Promise.all([
   tenantApi.show(id),
   commercialGoalsApi.list(id),
   operatorsApi.tenantList(id),
   teamCommissionsApi.options(id),
   orderTypesApi.active(),
   teamApi.members(id),
  ])
  if (id !== tenantId.value) return
  tenant.value = t.data; rows.value = g.data; canManage.value = g.meta.can_manage
  operators.value = o.data.filter(item => item.selected)
  // Share the exact same active negotiation types and identifiers used by opportunities.
  orderTypes.value = catalog.data
    .filter(type => type.is_active)
    .sort((a, b) => a.position - b.position)
    .map(type => ({ value: type.id, label: type.name }))
  // Preserve readable labels for goals created before the catalog integration.
  for (const type of options.data.order_types) {
    if (rows.value.some(goal => goal.order_type === type.value) && !orderTypes.value.some(item => item.value === type.value)) {
      orderTypes.value.push(type)
    }
  }
  roles.value = options.data.roles
  members.value = memberPage.data.filter(member => member.status === 'ACTIVE')
 } catch (e) { if (id === tenantId.value) error.value = e instanceof Error ? e.message : 'Não foi possível carregar as metas.' }
 finally { if (id === tenantId.value) loading.value = false }
}
function edit(goal?: CommercialGoal) {
 editingId.value = goal?.id ?? null
 bulkMode.value = false
 selectedMemberIds.value = []
 bulkResult.value = null
 form.value = goal ? {operator_id:goal.operator_id,order_type:goal.order_type,category:goal.category ?? null,target_scope:goal.target_scope ?? 'COMPANY',responsible_membership_id:goal.responsible_membership_id ?? null,negotiation_type_ids:goal.negotiation_type_ids?.length ? goal.negotiation_type_ids : (orderTypes.value.some(t => t.value === goal.order_type && /^[0-9a-f-]{36}$/i.test(goal.order_type)) ? [goal.order_type] : []),commercial_role:goal.commercial_role,metric:goal.metric,starts_on:goal.starts_on,ends_on:goal.ends_on,is_active:goal.is_active,tiers:goal.tiers.map(t=>({minimum:Number(t.minimum),percentage:Number(t.percentage)}))} : initial()
 modalOpen.value = true
}
async function save() {
 if (bulkMode.value && !editingId.value && !selectedMemberIds.value.length) {
  toast.error('Selecione ao menos um responsável para o cadastro em massa.')
  return
 }
 if (!bulkMode.value && form.value.target_scope !== 'COMPANY' && !form.value.responsible_membership_id) { toast.error('Selecione o responsável pela meta.'); return }
 if (!form.value.operator_id || !form.value.negotiation_type_ids.length || !form.value.category || !form.value.commercial_role || !form.value.metric) {
  toast.error('Selecione operadora, categoria, tipos de negociação, perfil e métrica antes de salvar.')
  return
 }
 // Preserve the legacy field while the reporting pipeline transitions to category-based goals.
 form.value.order_type = form.value.negotiation_type_ids[0]!
 busy.value = true
 try {
  if (bulkMode.value && !editingId.value) {
   const response = await commercialGoalsApi.bulkSave(tenantId.value, {
    ...form.value,
    responsible_membership_id: null,
    responsible_membership_ids: selectedMemberIds.value,
   })
   bulkResult.value = response.data
   toast.success(`${response.data.created_count} meta(s) criada(s). ${response.data.skipped_count} ignorada(s) por conflito.`)
   if (response.data.skipped_count === 0) modalOpen.value = false
  } else {
   await commercialGoalsApi.save(tenantId.value, form.value, editingId.value ?? undefined)
   modalOpen.value = false
   toast.success('Meta comercial salva.')
  }
  await load()
 } catch(e) { toast.error(e instanceof Error ? e.message : 'Erro ao salvar meta.') }
 finally { busy.value = false }
}
watch(tenantId, () => { modalOpen.value = false; void load() }, { immediate: true })
const { page, total, lastPage, pageRows, changePage } = useListPagination(filtered)

return { tenant, rows, members, operators, orderTypes, roles, loading, busy, error, canManage, writable, modalOpen, editingId, bulkMode, selectedMemberIds, bulkResult, form, label, metricLabel, filterOperator, filterType, filterRole, applyFilters, clearFilters, filtered, load, edit, save, page, total, lastPage, pageRows, changePage }
}
