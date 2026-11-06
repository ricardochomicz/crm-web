<script setup lang="ts">
import PagePagination from '@/components/ui/PagePagination.vue'
import ListFilters from '@/components/ui/ListFilters.vue'
import ListTable from '@/components/ui/ListTable.vue'
import SearchSelect from '@/components/ui/SearchSelect.vue'
import TableActionButton from '@/components/ui/TableActionButton.vue'
import AppShell from '@/components/layout/AppShell.vue'
import AsyncNotice from '@/components/ui/AsyncNotice.vue'
import TeamCommissionForm from '../components/TeamCommissionForm.vue'
import { useTeamCommissionsPage } from '../composables/useTeamCommissionsPage'

const { tenant, operators, orderTypes, roles, loading, busy, error, writable, editingId, modalOpen, form, label, edit, load, save, filterOperator, filterOrderType, filterRole, applyFilters, clearFilters, filteredRows, exportAllowed, exportCsv, exportPdf, page, total, lastPage, pageRows, changePage } = useTeamCommissionsPage()
</script><template>
 <AppShell :tenant="tenant" title="Comissões da equipe" subtitle="Regras de repasse sobre o valor dos contratos">
  <header class="mb-7 flex flex-wrap items-center justify-between gap-4">
   <div><p class="eyebrow">GERENCIAL</p><h1 class="mt-3 text-3xl font-semibold">Comissões da equipe</h1><p class="mt-2 text-sm text-slate-500">Percentuais por operadora, tipo de pedido e papel comercial.</p></div>
   <button v-if="writable" type="button" class="primary-button w-auto" @click="edit()">+ Nova regra</button>
  </header>
  <AsyncNotice :loading="loading" :error="error" @retry="load"/>
  <section v-if="!loading && !error" class="mb-5 rounded-2xl border border-stone-200 bg-white p-5">
   <ListFilters :columns="3" @search="applyFilters" @clear="clearFilters">
    <label class="block text-sm font-semibold">Operadora<SearchSelect v-model="filterOperator" :options="[{value:'',label:'Todas'}, ...operators.map(o=>({value:String(o.id),label:o.name}))]"/></label>
    <label class="block text-sm font-semibold">Tipo de pedido<SearchSelect v-model="filterOrderType" :options="[{value:'',label:'Todos'}, ...orderTypes]"/></label>
    <label class="block text-sm font-semibold">Papel comercial<SearchSelect v-model="filterRole" :options="[{value:'',label:'Todos'}, ...roles]"/></label>
   </ListFilters>
   <div class="mt-4 flex flex-wrap items-center justify-between gap-3">
    <span class="text-sm text-slate-500">{{ filteredRows.length }} regra(s) encontrada(s)</span>
    <div class="flex flex-wrap gap-2">
     <button type="button" class="rounded-lg border px-3 py-2 text-sm" :disabled="!exportAllowed" @click="exportCsv">Exportar Excel (CSV)</button>
     <button type="button" class="rounded-lg border px-3 py-2 text-sm" :disabled="!exportAllowed" @click="exportPdf">Salvar PDF</button>
    </div>
   </div>
   <p class="mt-3 text-xs text-slate-500">Para enviar uma tabela comercial, selecione o papel (ex.: Parceiro). A exportação inclui apenas regras ativas filtradas, sem expor comissões de outros papéis. O PDF é salvo pelo diálogo de impressão do navegador.</p>
  </section>
  <section v-if="!loading && !error" class="overflow-hidden rounded-2xl border border-stone-200 bg-white">
   <ListTable min-width="860px">
    <thead class="bg-stone-50 text-xs font-semibold uppercase tracking-wide text-slate-500"><tr><th class="px-4 py-4">Operadora</th><th class="px-4 py-4">Tipo de pedido</th><th class="px-4 py-4">Papel</th><th class="px-4 py-4 text-right">Comissão</th><th class="px-4 py-4">Vigência</th><th class="px-4 py-4">Situação</th><th v-if="writable" class="px-4 py-4">Ações</th></tr></thead>
    <tbody class="divide-y divide-stone-100"><tr v-for="row in pageRows" :key="row.id">
     <td class="px-4 py-4">{{ row.operator?.name }}</td><td class="px-4 py-4">{{ label(orderTypes,row.order_type) }}</td><td class="px-4 py-4">{{ label(roles,row.commercial_role) }}</td>
     <td class="px-4 py-4 text-right font-semibold">{{ Number(row.percentage).toLocaleString('pt-BR') }}%</td>
     <td class="px-4 py-4">{{ row.starts_on }} até {{ row.ends_on ?? 'indeterminado' }}</td>
     <td class="px-4 py-4">{{ row.is_active ? 'Ativa' : 'Inativa' }}</td>
     <td v-if="writable" class="px-4 py-4"><TableActionButton icon="edit" :label="`Editar comissão de ${row.operator?.name ?? 'operadora'}`" :disabled="busy" @click="edit(row)" /></td>
    </tr></tbody>
   </ListTable>
   <p v-if="!filteredRows.length" class="px-5 py-8 text-sm text-slate-500">Nenhuma regra encontrada para os filtros selecionados.</p>
  <PagePagination :page="page" :last-page="lastPage" :total="total" @change="changePage" /></section>
  <div v-if="modalOpen && writable" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
   <TeamCommissionForm v-model="form" :operators="operators" :order-types="orderTypes" :roles="roles" :busy="busy" :editing="!!editingId" @submit="save" @cancel="modalOpen = false"/>
  </div>
 </AppShell>
</template>
