<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import AsyncNotice from '@/components/ui/AsyncNotice.vue'
import { tenantApi } from '@/features/tenants/api'
import type { Tenant } from '@/features/tenants/types'
import { operatorsApi, type TenantOperator } from '@/features/operators/api'
import { request, mutate } from '@/lib/http'
import { errorMessage } from '@/lib/feedback'
import { toast } from '@/services/toast'
type Commission = { id: string; name: string; operator_id: number; operator?: { name: string }; percentage: string; deduction_percentage: string | null; is_active: boolean }
const route = useRoute()
const tenantId = computed(() => String(route.params.tenantId))
const tenant = ref<Tenant>()
const rows = ref<Commission[]>([])
const operators = ref<TenantOperator[]>([])
const loading = ref(true)
const busy = ref(false)
const error = ref('')
const canManage = ref(false)
const defaultDeduction = ref('0')
const base = computed(() => `/api/v1/tenants/${encodeURIComponent(tenantId.value)}/commissions`)
const writable = computed(() => canManage.value && !!tenant.value?.access?.allows_operational_writes)
const editingId = ref('')
const modalOpen = ref(false)
const blank = () => ({ name: '', operator_id: 0, percentage: '400', deduction_percentage: '', is_active: true })
const form = ref(blank())
const format = (n: unknown) => `${Number(n).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`
function edit(row?: Commission) {
 editingId.value = row?.id ?? ''
 form.value = row ? { name: row.name, operator_id: row.operator_id, percentage: String(row.percentage), deduction_percentage: row.deduction_percentage ?? '', is_active: row.is_active } : blank()
 modalOpen.value = true
}
async function load() {
 const id = tenantId.value
 loading.value = true
 error.value = ''
 try {
  const [company, list] = await Promise.all([tenantApi.show(id), request<{data: Commission[]; meta: {can_manage: boolean}}>(`${base.value}`)])
  if (id !== tenantId.value) return
  tenant.value = company.data
  rows.value = list.data
  canManage.value = list.meta.can_manage
  operators.value = (await operatorsApi.tenantList(id)).data.filter(o => o.selected && o.is_active)
 } catch (e) { if (id === tenantId.value) error.value = errorMessage(e) }
 finally { if (id === tenantId.value) loading.value = false }
}
watch(tenantId, () => { modalOpen.value = false; void load() }, { immediate: true })
</script>
<template><div>Tabelas de comissões</div></template>
