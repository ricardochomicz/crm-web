import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { teamCommissionsApi, type TeamCommissionRule, type TeamCommissionInput, type CommissionOption } from '../api'
import { operatorsApi, type TenantOperator } from '@/features/operators/api'
import { tenantApi } from '@/features/tenants/api'
import type { Tenant } from '@/features/tenants/types'
import { errorMessage } from '@/lib/feedback'
import { toast } from '@/services/toast'
export function useTeamCommissions() {
 const route = useRoute()
 const tenantId = computed(() => String(route.params.tenantId))
 const tenant = ref<Tenant>()
 const rows = ref<TeamCommissionRule[]>([])
 const operators = ref<TenantOperator[]>([])
 const orderTypes = ref<CommissionOption[]>([])
 const roles = ref<CommissionOption[]>([])
 const loading = ref(true)
 const busy = ref(false)
 const error = ref('')
 const canManage = ref(false)
 const editingId = ref('')
 const modalOpen = ref(false)
 const blank = (): TeamCommissionInput => ({operator_id: 0, order_type: '', commercial_role: '', percentage: '', starts_on: new Date().toISOString().slice(0,10), ends_on: null, is_active: true})
 const form = ref<TeamCommissionInput>(blank())
 const writable = computed(() => canManage.value && !!tenant.value?.access?.allows_operational_writes)
 const label = (items: CommissionOption[], value: string) => items.find(item => item.value === value)?.label ?? value
 function edit(row?: TeamCommissionRule) {
   editingId.value = row?.id ?? ''
   form.value = row ? {operator_id: row.operator_id, order_type: row.order_type, commercial_role: row.commercial_role, percentage: String(row.percentage), starts_on: row.starts_on, ends_on: row.ends_on, is_active: row.is_active} : blank()
   modalOpen.value = true
 }
 async function load() {
   const id = tenantId.value
   loading.value = true; error.value = ''
   try {
     const [company, list, options, available] = await Promise.all([tenantApi.show(id), teamCommissionsApi.list(id), teamCommissionsApi.options(id), operatorsApi.tenantList(id)])
     if (id !== tenantId.value) return
     tenant.value = company.data; rows.value = list.data; canManage.value = list.meta.can_manage
     orderTypes.value = options.data.order_types; roles.value = options.data.roles
     operators.value = available.data.filter(o => o.selected && o.is_active)
   } catch(e) { if(id === tenantId.value) error.value = errorMessage(e) }
   finally { if(id === tenantId.value) loading.value = false }
 }
 async function save() {
   if(!writable.value || busy.value) return
   busy.value = true
   try { await teamCommissionsApi.save(tenantId.value, form.value, editingId.value || undefined); modalOpen.value = false; toast.success('Regra de comissão salva.'); await load() }
   catch(e) { toast.error(errorMessage(e)) }
   finally { busy.value = false }
 }
 watch(tenantId, () => { modalOpen.value = false; void load() }, {immediate:true})
 return {tenant,rows,operators,orderTypes,roles,loading,busy,error,writable,editingId,modalOpen,form,label,edit,load,save}
}
