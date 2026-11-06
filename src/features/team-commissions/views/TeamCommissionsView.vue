<script setup lang="ts">
import { computed, ref } from 'vue'
import { toast } from '@/services/toast'
import AppShell from '@/components/layout/AppShell.vue'
import AsyncNotice from '@/components/ui/AsyncNotice.vue'
import TeamCommissionForm from '../components/TeamCommissionForm.vue'
import { useTeamCommissions } from '../composables/useTeamCommissions'
const {tenant,rows,operators,orderTypes,roles,loading,busy,error,writable,editingId,modalOpen,form,label,edit,load,save} = useTeamCommissions()

const filterOperator = ref('')
const filterOrderType = ref('')
const filterRole = ref('')
const filteredRows = computed(() => rows.value.filter(row =>
 (!filterOperator.value || String(row.operator_id) === filterOperator.value) &&
 (!filterOrderType.value || row.order_type === filterOrderType.value) &&
 (!filterRole.value || row.commercial_role === filterRole.value)
))
const exportRows = computed(() => filteredRows.value.filter(row => row.is_active))
const exportAllowed = computed(() => filterRole.value !== '' && exportRows.value.length > 0)
const exportTitle = computed(() => 'Tabela de comissionamento — ' + label(roles.value, filterRole.value))
const safe = (value: unknown) => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
const displayDate = (value: string | null) => value ? value.split('-').reverse().join('/') : 'Indeterminado'
const exportData = () => exportRows.value.map(row => [
 row.operator?.name ?? operators.value.find(o => o.id === row.operator_id)?.name ?? '',
 label(orderTypes.value, row.order_type),
 label(roles.value, row.commercial_role),
 Number(row.percentage).toLocaleString('pt-BR', {maximumFractionDigits: 2}) + '%',
 displayDate(row.starts_on),
 displayDate(row.ends_on),
])
function exportCsv() {
 if (!exportAllowed.value) return
 const header = ['Operadora', 'Tipo de pedido', 'Papel comercial', 'Comissão sobre contrato', 'Vigência inicial', 'Vigência final']
 const escapeCsv = (v: string) => {
  const normalized = /^[=+@\-\t\r]/.test(v) ? "'" + v : v
  return '"' + normalized.replace(/"/g, '""') + '"'
 }
 const csv = '\uFEFF' + [header, ...exportData()].map(row => row.map(escapeCsv).join(';')).join('\r\n')
 const url = URL.createObjectURL(new Blob([csv], {type:'text/csv;charset=utf-8'}))
 const link = document.createElement('a')
 link.href = url; link.download = 'comissoes-' + filterRole.value.toLowerCase() + '.csv'
 document.body.appendChild(link); link.click(); link.remove()
 URL.revokeObjectURL(url)
}
function exportPdf() {
 if (!exportAllowed.value) return
 const popup = window.open('', '_blank')
 if (!popup) { toast.error('Permita pop-ups para imprimir ou salvar em PDF.'); return }
 const headers = ['Operadora','Tipo de pedido','Papel','Comissão','Início','Fim']
 const tr = (cells: string[], heading = false) => '<tr>' + cells.map(v => '<' + (heading ? 'th' : 'td') + '>' + safe(v) + '</' + (heading ? 'th' : 'td') + '>').join('') + '</tr>'
 const html = '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>' + safe(exportTitle.value) + '</title><style>body{font-family:Arial,sans-serif;color:#182333;margin:36px}h1{font-size:22px}p{color:#536071}table{border-collapse:collapse;width:100%;margin-top:24px;font-size:12px}th,td{border-bottom:1px solid #ddd;padding:10px;text-align:left}th{background:#f1f3f5}@page{size:A4 landscape;margin:15mm}</style></head><body><h1>' + safe(exportTitle.value) + '</h1><p>' + safe(tenant.value?.name ?? '') + ' · Percentuais calculados sobre o valor-base do contrato. Regras ativas e vigências conforme tabela.</p><table><thead>' + tr(headers,true) + '</thead><tbody>' + exportData().map(row => tr(row)).join('') + '</tbody></table><p>Documento informativo. Condições sujeitas à vigência e às regras contratuais aplicáveis.</p></body></html>'
 popup.document.open(); popup.document.write(html); popup.document.close()
 popup.focus()
 popup.print()
}
</script>
<template>
 <AppShell :tenant="tenant" title="Comissões da equipe" subtitle="Regras de repasse sobre o valor dos contratos">
  <header class="mb-7 flex flex-wrap items-center justify-between gap-4">
   <div><p class="eyebrow">GERENCIAL</p><h1 class="mt-3 text-3xl font-semibold">Comissões da equipe</h1><p class="mt-2 text-sm text-slate-500">Percentuais por operadora, tipo de pedido e papel comercial.</p></div>
   <button v-if="writable" type="button" class="primary-button w-auto" @click="edit()">+ Nova regra</button>
  </header>
  <AsyncNotice :loading="loading" :error="error" @retry="load"/>
  <section v-if="!loading && !error" class="mb-5 rounded-2xl border border-stone-200 bg-white p-5">
   <div class="grid gap-3 md:grid-cols-3">
    <label class="block text-sm font-semibold">Operadora<select v-model="filterOperator" class="mt-2 w-full rounded-lg border border-stone-200 px-3 py-2.5 font-normal"><option value="">Todas</option><option v-for="o in operators" :key="o.id" :value="String(o.id)">{{ o.name }}</option></select></label>
    <label class="block text-sm font-semibold">Tipo de pedido<select v-model="filterOrderType" class="mt-2 w-full rounded-lg border border-stone-200 px-3 py-2.5 font-normal"><option value="">Todos</option><option v-for="o in orderTypes" :key="o.value" :value="o.value">{{ o.label }}</option></select></label>
    <label class="block text-sm font-semibold">Papel comercial<select v-model="filterRole" class="mt-2 w-full rounded-lg border border-stone-200 px-3 py-2.5 font-normal"><option value="">Todos</option><option v-for="o in roles" :key="o.value" :value="o.value">{{ o.label }}</option></select></label>
   </div>
   <div class="mt-4 flex flex-wrap items-center justify-between gap-3">
    <span class="text-sm text-slate-500">{{ filteredRows.length }} regra(s) encontrada(s)</span>
    <div class="flex flex-wrap gap-2">
     <button type="button" class="rounded-lg border px-3 py-2 text-sm" @click="filterOperator='';filterOrderType='';filterRole=''">Limpar filtros</button>
     <button type="button" class="rounded-lg border px-3 py-2 text-sm" :disabled="!exportAllowed" @click="exportCsv">Exportar Excel (CSV)</button>
     <button type="button" class="rounded-lg border px-3 py-2 text-sm" :disabled="!exportAllowed" @click="exportPdf">Salvar PDF</button>
    </div>
   </div>
   <p class="mt-3 text-xs text-slate-500">Para enviar uma tabela comercial, selecione o papel (ex.: Parceiro). A exportação inclui apenas regras ativas filtradas, sem expor comissões de outros papéis. O PDF é salvo pelo diálogo de impressão do navegador.</p>
  </section>
  <section v-if="!loading && !error" class="overflow-hidden rounded-2xl border border-stone-200 bg-white">
   <div class="overflow-x-auto"><table class="w-full min-w-[860px] text-left text-sm">
    <thead class="bg-stone-50 text-xs font-semibold uppercase tracking-wide text-slate-500"><tr><th class="px-4 py-4">Operadora</th><th class="px-4 py-4">Tipo de pedido</th><th class="px-4 py-4">Papel</th><th class="px-4 py-4 text-right">Comissão</th><th class="px-4 py-4">Vigência</th><th class="px-4 py-4">Situação</th><th v-if="writable" class="px-4 py-4">Ações</th></tr></thead>
    <tbody class="divide-y divide-stone-100"><tr v-for="row in filteredRows" :key="row.id">
     <td class="px-4 py-4">{{ row.operator?.name }}</td><td class="px-4 py-4">{{ label(orderTypes,row.order_type) }}</td><td class="px-4 py-4">{{ label(roles,row.commercial_role) }}</td>
     <td class="px-4 py-4 text-right font-semibold">{{ Number(row.percentage).toLocaleString('pt-BR') }}%</td>
     <td class="px-4 py-4">{{ row.starts_on }} até {{ row.ends_on ?? 'indeterminado' }}</td>
     <td class="px-4 py-4">{{ row.is_active ? 'Ativa' : 'Inativa' }}</td>
     <td v-if="writable" class="px-4 py-4"><button type="button" class="rounded-lg border px-3 py-1.5 hover:border-orange-300" @click="edit(row)">Editar</button></td>
    </tr></tbody>
   </table></div>
   <p v-if="!filteredRows.length" class="px-5 py-8 text-sm text-slate-500">Nenhuma regra encontrada para os filtros selecionados.</p>
  </section>
  <div v-if="modalOpen && writable" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
   <TeamCommissionForm v-model="form" :operators="operators" :order-types="orderTypes" :roles="roles" :busy="busy" :editing="!!editingId" @submit="save" @cancel="modalOpen = false"/>
  </div>
 </AppShell>
</template>
