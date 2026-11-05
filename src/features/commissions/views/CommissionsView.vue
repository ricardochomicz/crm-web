<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
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
  defaultDeduction.value = (await request<{data: {default_deduction_percentage: string}}>(base.value + '/settings')).data.default_deduction_percentage
 } catch (e) { if (id === tenantId.value) error.value = errorMessage(e) }
 finally { if (id === tenantId.value) loading.value = false }
}
async function saveSettings() {
 try {
  await mutate(base.value + '/settings', { default_deduction_percentage: Number(defaultDeduction.value.replace(',', '.')) }, 'PUT')
  toast.success('Desconto padrão salvo.')
 } catch (e) { toast.error(errorMessage(e)) }
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
  <form v-if="!loading && !error" class="mb-5 rounded-2xl border border-stone-200 bg-white p-5" @submit.prevent="saveSettings"><div class="flex flex-wrap items-end gap-4"><label class="block text-sm font-semibold text-slate-700">Desconto padrão da empresa (%)<input v-model="defaultDeduction" :disabled="!writable" inputmode="decimal" class="mt-2 block w-44 rounded-lg border border-stone-200 px-3 py-2.5 text-sm font-normal" /></label><button v-if="writable" type="submit" class="primary-button w-auto">Salvar padrão</button></div><p class="mt-3 text-xs text-slate-500">Aplicado à comissão bruta quando a tabela não possui desconto próprio. Use 0% para não descontar.</p></form>
  <section v-if="!loading && !error" class="overflow-hidden rounded-2xl border border-stone-200 bg-white">
   <div class="overflow-x-auto">
    <table class="w-full min-w-[720px] text-left text-sm">
     <thead class="bg-stone-50 text-xs font-semibold uppercase tracking-wide text-slate-500"><tr><th class="px-5 py-4">Tabela</th><th class="px-4 py-4">Operadora</th><th class="px-4 py-4 text-right">Comissão</th><th class="px-4 py-4 text-right">Desconto</th><th class="px-4 py-4">Situação</th><th v-if="writable" class="px-5 py-4 text-right">Ações</th></tr></thead>
     <tbody class="divide-y divide-stone-100">
      <tr v-for="item in rows" :key="item.id" class="hover:bg-stone-50/70">
       <td class="px-5 py-4 font-semibold text-slate-800">{{ item.name }}</td>
       <td class="px-4 py-4 text-slate-600">{{ item.operator?.name }}</td>
       <td class="px-4 py-4 text-right font-semibold text-slate-800">{{ format(item.percentage) }}</td>
       <td class="px-4 py-4 text-right text-slate-600">{{ item.deduction_percentage === null ? 'Padrão (' + format(defaultDeduction) + ')' : format(item.deduction_percentage) }}</td>
       <td class="px-4 py-4"><span class="rounded-full px-2.5 py-1 text-xs font-semibold" :class="item.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-slate-500'">{{ item.is_active ? 'Ativa' : 'Inativa' }}</span></td>
       <td v-if="writable" class="px-5 py-4 text-right"><button type="button" class="inline-flex size-9 items-center justify-center rounded-lg border border-stone-200 text-slate-600 hover:border-orange-300 hover:text-orange-700" title="Editar tabela" aria-label="Editar tabela" @click="edit(item)"><AppIcon name="edit" class="size-4" /></button></td>
      </tr>
     </tbody>
    </table>
   </div>
   <p v-if="!rows.length" class="px-5 py-8 text-center text-sm text-slate-500">Nenhuma tabela cadastrada.</p>
  </section>
  <div v-if="modalOpen && writable" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
   <form class="w-full max-w-lg space-y-4 rounded-2xl bg-white p-6 shadow-xl" @submit.prevent="save">
    <h2 class="text-xl font-semibold">{{ editingId ? 'Editar tabela' : 'Nova tabela de comissão' }}</h2>
    <label class="block text-sm font-medium">Nome<input v-model="form.name" required maxlength="180" class="mt-1 w-full rounded-lg border p-2" /></label>
    <label class="block text-sm font-medium">Operadora<select v-model.number="form.operator_id" required class="mt-1 w-full rounded-lg border p-2"><option :value="0" disabled>Selecione</option><option v-for="op in operators" :key="op.id" :value="op.id">{{ op.name }}</option></select></label>
    <label class="block text-sm font-medium">Comissão (%) <input v-model="form.percentage" required inputmode="decimal" class="mt-1.5 block w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm font-normal" /></label>
    <label class="block text-sm font-medium text-slate-700">Desconto (%)<input v-model="form.deduction_percentage" inputmode="decimal" class="mt-1.5 block w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm font-normal" placeholder="Vazio = padrão da empresa" /><span class="mt-1 block text-xs font-normal text-slate-500">Informe 0 para não aplicar desconto.</span></label>
    <label class="flex items-center gap-2 text-sm font-medium text-slate-700"><input v-model="form.is_active" type="checkbox" class="size-4 accent-orange-600" /> Tabela ativa</label>
    <div class="flex justify-end gap-3"><button type="button" class="rounded-lg border px-4 py-2" @click="modalOpen = false">Cancelar</button><button type="submit" :disabled="busy" class="primary-button w-auto">Salvar</button></div>
   </form>
  </div>
 </AppShell>
</template>
