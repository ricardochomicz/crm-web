<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import SearchSelect from '@/components/ui/SearchSelect.vue'
import AppShell from '@/components/layout/AppShell.vue'
import AsyncNotice from '@/components/ui/AsyncNotice.vue'
import { toast } from '@/services/toast'
import { request } from '@/lib/http'
import { operatorsApi, type TenantOperator } from '@/features/operators/api'
import { teamCommissionsApi, type CommissionOption } from '@/features/team-commissions/api'
import { type Tenant } from '@/features/tenants/types'
import CommercialGoalForm from '../components/CommercialGoalForm.vue'
import { commercialGoalsApi, type CommercialGoal, type GoalInput } from '../api'
const route = useRoute()
const tenantId = computed(() => String(route.params.tenantId))
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
 operator_id: operators.value[0]?.id ?? 0,
 order_type: orderTypes.value[0]?.value ?? 'NEW',
 commercial_role: roles.value[0]?.value ?? 'CONSULTANT',
 metric: 'QUANTITY', starts_on: new Date().toISOString().slice(0,10),
 ends_on: null, is_active: true, tiers: [{minimum:0, percentage:50}],
})
const form = ref<GoalInput>(initial())
const label = (options: CommissionOption[], value: string) => options.find(o => o.value === value)?.label ?? value
const metricLabel = (metric: string) => metric === 'QUANTITY' ? 'Linhas' : 'Receita'
const filterOperator = ref('')
const filterType = ref('')
const filterRole = ref('')
const filtered = computed(() => rows.value.filter(r =>
 (!filterOperator.value || String(r.operator_id) === filterOperator.value) &&
 (!filterType.value || r.order_type === filterType.value) &&
 (!filterRole.value || r.commercial_role === filterRole.value)))
async function load() {
 loading.value = true; error.value = ''
 try {
  const [t, g, o, options] = await Promise.all([
   request<{data:Tenant}>(`/api/v1/tenants/${tenantId.value}`),
   commercialGoalsApi.list(tenantId.value),
   operatorsApi.tenantList(tenantId.value),
   teamCommissionsApi.options(tenantId.value),
  ])
  tenant.value = t.data; rows.value = g.data; canManage.value = g.meta.can_manage
  operators.value = o.data.filter(item => item.selected)
  orderTypes.value = options.data.order_types; roles.value = options.data.roles
 } catch (e) { error.value = e instanceof Error ? e.message : 'Não foi possível carregar as metas.' }
 finally { loading.value = false }
}
function edit(goal?: CommercialGoal) {
 editingId.value = goal?.id ?? null
 form.value = goal ? {operator_id:goal.operator_id,order_type:goal.order_type,commercial_role:goal.commercial_role,metric:goal.metric,starts_on:goal.starts_on,ends_on:goal.ends_on,is_active:goal.is_active,tiers:goal.tiers.map(t=>({minimum:Number(t.minimum),percentage:Number(t.percentage)}))} : initial()
 modalOpen.value = true
}
async function save() {
 busy.value = true
 try {
  await commercialGoalsApi.save(tenantId.value, form.value, editingId.value ?? undefined)
  modalOpen.value = false
  toast.success('Meta comercial salva.')
  await load()
 } catch(e) { toast.error(e instanceof Error ? e.message : 'Erro ao salvar meta.') }
 finally { busy.value = false }
}
watch(tenantId, load)
onMounted(load)
</script>
<template>
 <AppShell :tenant="tenant" title="Metas comerciais" subtitle="Faixas de comissão por desempenho">
  <header class="mb-7 flex flex-wrap items-center justify-between gap-4">
   <div><p class="eyebrow">GERENCIAL</p><h1 class="mt-3 text-3xl font-semibold">Metas comerciais</h1><p class="mt-2 text-sm text-slate-500">Metas por operadora, pedido e perfil. A apuração retroativa será integrada aos pedidos.</p></div>
   <button v-if="writable" class="primary-button w-auto" type="button" @click="edit()">+ Nova meta</button>
  </header>
  <AsyncNotice :loading="loading" :error="error" @retry="load"/>
  <template v-if="!loading && !error">
   <section class="mb-5 grid gap-3 rounded-2xl border border-stone-200 bg-white p-5 md:grid-cols-3">
    <label class="text-sm">Operadora<SearchSelect v-model="filterOperator" :options="[{value:'',label:'Todas'}, ...operators.map(o=>({value:String(o.id),label:o.name}))]"/></label>
    <label class="text-sm">Tipo de pedido<SearchSelect v-model="filterType" :options="[{value:'',label:'Todos'}, ...orderTypes]"/></label>
    <label class="text-sm">Perfil<SearchSelect v-model="filterRole" :options="[{value:'',label:'Todos'}, ...roles]"/></label>
   </section>
   <section class="overflow-x-auto rounded-2xl border border-stone-200 bg-white">
    <table class="w-full min-w-[850px] text-left text-sm">
     <thead class="bg-stone-50 text-slate-500"><tr><th class="p-4">Operadora</th><th class="p-4">Pedido</th><th class="p-4">Perfil</th><th class="p-4">Métrica</th><th class="p-4">Faixas (mínimo → comissão)</th><th class="p-4">Vigência</th><th class="p-4">Status</th><th v-if="writable" class="p-4">Ações</th></tr></thead>
     <tbody><tr v-for="r in filtered" :key="r.id" class="border-t border-stone-100">
      <td class="p-4">{{ r.operator?.name }}</td><td class="p-4">{{ label(orderTypes,r.order_type) }}</td><td class="p-4">{{ label(roles,r.commercial_role) }}</td><td class="p-4">{{ metricLabel(r.metric) }}</td>
      <td class="p-4">{{ r.tiers.map(t => Number(t.minimum).toLocaleString('pt-BR') + ' → ' + Number(t.percentage).toLocaleString('pt-BR') + '%').join(' · ') }}</td>
      <td class="p-4">{{ r.starts_on }} até {{ r.ends_on ?? 'indeterminado' }}</td><td class="p-4">{{ r.is_active ? 'Ativa' : 'Inativa' }}</td>
      <td v-if="writable" class="p-4"><button class="rounded-lg border px-3 py-1" type="button" @click="edit(r)">Editar</button></td>
     </tr></tbody>
    </table>
    <p v-if="!filtered.length" class="p-6 text-sm text-slate-500">Nenhuma meta encontrada.</p>
   </section>
  </template>
  <div v-if="modalOpen && writable" class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
   <CommercialGoalForm v-model="form" :operators="operators" :order-types="orderTypes" :roles="roles" :busy="busy" :editing="!!editingId" @submit="save" @cancel="modalOpen=false"/>
  </div>
 </AppShell>
</template>
