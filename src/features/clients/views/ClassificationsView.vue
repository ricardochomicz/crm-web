<script setup lang="ts">
import PagePagination from '@/components/ui/PagePagination.vue'
import AppDialog from '@/components/ui/AppDialog.vue'
import ClassificationForm from '../components/ClassificationForm.vue'
import ClassificationRuleForm from '../components/ClassificationRuleForm.vue'
import TableActionButton from '@/components/ui/TableActionButton.vue'
import ListFilters from '@/components/ui/ListFilters.vue'
import ListTable from '@/components/ui/ListTable.vue'
import AppShell from '@/components/layout/AppShell.vue'
import AsyncNotice from '@/components/ui/AsyncNotice.vue'
import SearchSelect from '@/components/ui/SearchSelect.vue'
import { useClassificationsPage } from '../composables/useClassificationsPage'

const {
  tenant,
  tenantId,
  operators,
  loading,
  error,
  busy,
  filter,
  writable,
  filtered,
  form,
  editing,
  modal,
  months,
  rule,
  ruleFor,
  load,
  edit,
  save,
  addRule,
  saveRule,
  page,
  total,
  lastPage,
  pageRows,
  changePage,
  applyFilters,
  clearFilters,
} = useClassificationsPage()
</script>
<template>
  <AppShell
    :tenant="tenant"
    title="Classificações das operadoras"
    subtitle="Prazos de renovação por vigência"
  >
    <header class="mb-7 flex flex-wrap items-center justify-between gap-4">
      <div>
        <p class="eyebrow">GERENCIAL</p>
        <h1 class="mt-3 text-3xl font-semibold">Classificações das operadoras</h1>
        <p class="mt-2 text-sm text-slate-500">
          Classificações globais são somente leitura. O proprietário pode criar classificações e
          regras próprias.
        </p>
      </div>
      <button v-if="writable" class="primary-button w-auto" @click="edit()">+ Classificação</button>
    </header>
    <AsyncNotice :loading="loading" :error="error" @retry="load" />
    <template v-if="!loading && !error">
      <ListFilters
        :columns="1"
        :count-label="`${filtered.length} resultado(s) encontrado(s)`"
        @search="applyFilters"
        @clear="clearFilters"
        ><label class="text-xs font-semibold text-slate-600"
          >Operadora<SearchSelect
            v-model="filter"
            :options="[
              { value: '', label: 'Todas as operadoras' },
              ...operators.map((o) => ({ value: String(o.id), label: o.name })),
            ]" /></label
      ></ListFilters>
      <section class="overflow-hidden rounded-2xl border border-stone-200 bg-white">
        <ListTable min-width="650px"
          ><thead class="bg-stone-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th class="p-4">Operadora</th>
              <th class="p-4">Classificação</th>
              <th class="p-4">Origem</th>
              <th class="p-4">Tempo em meses</th>
              <th class="p-4">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-stone-100">
            <tr v-for="c in pageRows" :key="c.id" class="hover:bg-stone-50/70">
              <td class="p-4">{{ c.operator?.name }}</td>
              <td class="p-4 font-semibold">{{ c.name }}</td>
              <td class="p-4">{{ c.tenant_id ? 'Empresa' : 'Global' }}</td>
              <td class="p-4">
                {{
                  c.rules.find((r) => r.tenant_id === tenantId && r.is_active)?.minimum_months ??
                  c.rules.find((r) => r.is_active)?.minimum_months ??
                  '—'
                }}{{ c.rules.some((r) => r.is_active) ? ' meses' : '' }}
              </td>
              <td class="p-4">
                <div class="flex gap-2">
                  <TableActionButton
                    v-if="writable && c.tenant_id"
                    icon="edit"
                    :label="`Editar ${c.name}`"
                    :busy="busy"
                    @click="edit(c)"
                  /><TableActionButton
                    v-if="writable"
                    icon="tag"
                    :label="`Nova regra para ${c.name}`"
                    :busy="busy"
                    @click="addRule(c)"
                  />
                </div>
              </td>
            </tr></tbody
        ></ListTable>
        <p v-if="!filtered.length" class="p-5 text-center text-sm text-slate-500">
          Nenhuma classificação encontrada.
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
    <AppDialog
      :open="modal"
      :title="editing ? 'Editar classificação' : 'Nova classificação'"
      :busy="busy"
      @close="modal = false"
    >
      <ClassificationForm
        v-model:form="form"
        v-model:months="months"
        :operators="operators"
        :busy="busy"
        @submit="save"
        @cancel="modal = false"
      />
    </AppDialog>
    <AppDialog
      :open="ruleFor !== null"
      :title="`Regra de renovação · ${ruleFor?.code ?? ''}`"
      :busy="busy"
      @close="ruleFor = null"
    >
      <ClassificationRuleForm
        v-model:rule="rule"
        :busy="busy"
        @submit="saveRule"
        @cancel="ruleFor = null"
      />
    </AppDialog>
  </AppShell>
</template>
