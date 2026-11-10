<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import PagePagination from '@/components/ui/PagePagination.vue'
import TableActionButton from '@/components/ui/TableActionButton.vue'
import ListFilters from '@/components/ui/ListFilters.vue'
import ListTable from '@/components/ui/ListTable.vue'
import SearchSelect from '@/components/ui/SearchSelect.vue'
import AppShell from '@/components/layout/AppShell.vue'
import AsyncNotice from '@/components/ui/AsyncNotice.vue'
import CommercialGoalForm from '../components/CommercialGoalForm.vue'
import { useCommercialGoalsPage } from '../composables/useCommercialGoalsPage'

const route = useRoute()
const tenantId = computed(() => String(route.params.tenantId))
const {
  tenant,
  operators,
  members,
  orderTypes,
  roles,
  loading,
  busy,
  error,
  writable,
  modalOpen,
  editingId,
  form,
  label,
  metricLabel,
  filterOperator,
  filterType,
  filterRole,
  applyFilters,
  clearFilters,
  filtered,
  load,
  edit,
  save,
  page,
  total,
  lastPage,
  pageRows,
  changePage,
} = useCommercialGoalsPage(tenantId)
</script>
<template>
  <AppShell :tenant="tenant" title="Metas comerciais" subtitle="Faixas de comissão por desempenho">
    <header class="mb-7 flex flex-wrap items-center justify-between gap-4">
      <div>
        <p class="eyebrow">GERENCIAL</p>
        <h1 class="mt-3 text-3xl font-semibold">Metas comerciais</h1>
        <p class="mt-2 text-sm text-slate-500">
          Metas por operadora, pedido e perfil. A apuração retroativa será integrada aos pedidos.
        </p>
      </div>
      <button v-if="writable" class="primary-button w-auto" type="button" @click="edit()">
        + Nova meta
      </button>
    </header>
    <AsyncNotice :loading="loading" :error="error" @retry="load" />
    <template v-if="!loading && !error">
      <ListFilters
        :columns="3"
        :count-label="`${filtered.length} resultado(s) encontrado(s)`"
        @search="applyFilters"
        @clear="clearFilters"
      >
        <label class="text-xs font-semibold text-slate-600"
          >Operadora<SearchSelect
            v-model="filterOperator"
            :options="[
              { value: '', label: 'Todas as operadoras' },
              ...operators.map((o) => ({ value: String(o.id), label: o.name })),
            ]"
        /></label>
        <label class="text-xs font-semibold text-slate-600"
          >Tipo de pedido<SearchSelect
            v-model="filterType"
            :options="[{ value: '', label: 'Todos os tipos' }, ...orderTypes]"
        /></label>
        <label class="text-xs font-semibold text-slate-600"
          >Perfil<SearchSelect
            v-model="filterRole"
            :options="[{ value: '', label: 'Todos os perfis' }, ...roles]"
        /></label>
      </ListFilters>
      <section class="overflow-hidden rounded-2xl border border-stone-200 bg-white">
        <ListTable min-width="850px">
          <thead class="bg-stone-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th class="p-4">Operadora</th>
              <th class="p-4">Categoria</th>
              <th class="p-4">Responsável</th>
              <th class="p-4">Pedido</th>
              <th class="p-4">Perfil</th>
              <th class="p-4">Métrica</th>
              <th class="p-4">Faixas (mínimo → comissão)</th>
              <th class="p-4">Vigência</th>
              <th class="p-4">Status</th>
              <th v-if="writable" class="p-4">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-stone-100">
            <tr v-for="r in pageRows" :key="r.id" class="hover:bg-stone-50/70">
              <td class="p-4">{{ r.operator?.name }}</td>
              <td class="p-4">{{ r.category?.replaceAll("_", " ") ?? "—" }}</td>
              <td class="p-4">{{ r.target_scope === "COMPANY" || !r.target_scope ? "Empresa" : members.find(m => m.id === r.responsible_membership_id)?.name ?? "Membro não encontrado" }}</td>
              <td class="p-4">{{ (r.negotiation_type_ids?.length ? r.negotiation_type_ids : [r.order_type]).map(id => label(orderTypes, id)).join(", ") }}</td>
              <td class="p-4">{{ label(roles, r.commercial_role) }}</td>
              <td class="p-4">{{ metricLabel(r.metric) }}</td>
              <td class="p-4">
                {{
                  r.tiers
                    .map(
                      (t) =>
                        Number(t.minimum).toLocaleString('pt-BR') +
                        ' → ' +
                        Number(t.percentage).toLocaleString('pt-BR') +
                        '%',
                    )
                    .join(' · ')
                }}
              </td>
              <td class="p-4">{{ r.starts_on }} até {{ r.ends_on ?? 'indeterminado' }}</td>
              <td class="p-4">
                <span
                  class="rounded-full px-2.5 py-1 text-xs font-semibold"
                  :class="
                    r.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-slate-500'
                  "
                  >{{ r.is_active ? 'Ativa' : 'Inativa' }}</span
                >
              </td>
              <td v-if="writable" class="p-4">
                <TableActionButton
                  icon="edit"
                  :label="`Editar meta de ${r.operator?.name ?? 'operadora'}`"
                  :disabled="busy"
                  @click="edit(r)"
                />
              </td>
            </tr>
          </tbody>
        </ListTable>
        <p v-if="!filtered.length" class="p-6 text-center text-sm text-slate-500">
          Nenhuma meta encontrada.
        </p>
      </section>
      <PagePagination
        :page="page"
        :last-page="lastPage"
        :total="total"
        :busy="loading || busy"
        @change="changePage"
      />
    </template>
    <div
      v-if="modalOpen && writable"
      class="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/50 p-4"
    >
      <CommercialGoalForm
        v-model="form"
        :operators="operators"
        :members="members"
        :order-types="orderTypes"
        :roles="roles"
        :busy="busy"
        :editing="!!editingId"
        @submit="save"
        @cancel="modalOpen = false"
      />
    </div>
  </AppShell>
</template>
