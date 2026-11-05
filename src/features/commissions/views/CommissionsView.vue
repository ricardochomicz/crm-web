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
async function save() {
 if (!writable.value || busy.value) return
 busy.value = true
 try {
  const payload = { ...form.value, percentage: Number(form.value.percentage.replace(',', '.')), deduction_percentage: form.value.deduction_percentage === '' ? null : Number(form.value.deduction_percentage.replace(',', '.')) }
  await mutate(editingId.value ? `${base.value}/${editingId.value}` : base.value, payload, editingId.value ? 'PATCH' : 'POST')
  toast.success('Tabela de comissão salva.')
  modalOpen.value = false
  await load()
 } catch (e) { toast.error(errorMessage(e)) }
 finally { busy.value = false }
}
watch(tenantId, () => { modalOpen.value = false; void load() }, { immediate: true })
</script>
<template>
 <AppShell :tenant="tenant" title="Tabelas de comissões" subtitle="Comissões recebidas das operadoras">
  <header class="mb-7 flex flex-wrap items-center justify-between gap-4">
   <div><p class="eyebrow">FINANCEIRO</p><h1 class="mt-3 text-3xl font-semibold">Tabelas de comissões</h1><p class="mt-2 text-sm text-slate-500">Percentuais recebidos das operadoras, com desconto individual.</p></div>
   <button v-if="writable" class="primary-button w-auto" type="button" @click="edit()">+ Nova tabela</button>
  </header>
  <AsyncNotice :loading="loading" :error="error" @retry="load" />
  <section v-if="!loading && !error" class="rounded-2xl border border-stone-200 bg-white p-5">
   <div v-for="item in rows" :key="item.id" class="flex items-center justify-between gap-4 border-b border-stone-100 py-4">
    <div><p class="font-semibold">{{ item.name }} · {{ item.operator?.name }}</p><p class="text-sm text-slate-500">Comissão: {{ format(item.percentage) }} · Desconto: {{ item.deduction_percentage === null ? 'Padrão da empresa' : format(item.deduction_percentage) }} · {{ item.is_active ? 'Ativa' : 'Inativa' }}</p></div>
    <button v-if="writable" type="button" class="text-orange-700" @click="edit(item)">Editar</button>
   </div>
   <p v-if="!rows.length" class="text-sm text-slate-500">Nenhuma tabela cadastrada.</p>
  </section>
 </AppShell>
</template>
