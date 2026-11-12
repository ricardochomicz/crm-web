<script setup lang="ts">
import AppDialog from '@/components/ui/AppDialog.vue'
import AsyncNotice from '@/components/ui/AsyncNotice.vue'
import AppShell from '@/components/layout/AppShell.vue'
import PagePagination from '@/components/ui/PagePagination.vue'
import TableActionButton from '@/components/ui/TableActionButton.vue'
import ListFilters from '@/components/ui/ListFilters.vue'
import ListTable from '@/components/ui/ListTable.vue'
import SearchSelect from '@/components/ui/SearchSelect.vue'
import ClassificationForm from '../components/ClassificationForm.vue'
import ClassificationRuleForm from '../components/ClassificationRuleForm.vue'
import { useAdminClassificationsPage } from '../composables/useAdminClassificationsPage'

const { rows, operators, loading, busy, error, form, months, editing, modal, ruleFor, rule, ruleEditing, filter, filtered, load, edit, save, addRule, editRule, saveRule, page, total, lastPage, pageRows, changePage, applyFilters, clearFilters } = useAdminClassificationsPage()
</script>
<template>
  <AppShell title="Classificações globais" subtitle="Administração da plataforma"
    ><header class="mb-7 flex flex-wrap items-center justify-between gap-4">
      <div>
        <p class="eyebrow">ADMINISTRAÇÃO DA PLATAFORMA</p>
        <h1 class="mt-3 text-3xl font-semibold">Classificações globais</h1>
        <p class="mt-2 text-sm text-slate-500">
          Catálogo padrão e vigências das regras de renovação.
        </p>
      </div>
      <div>
        <button
          v-if="!loading && !error"
          type="button"
          :disabled="busy"
          class="primary-button w-auto"
          @click="edit()"
        >
          + Nova classificação
        </button>
      </div>
    </header>
    <AsyncNotice :loading="loading" :error="error" @retry="load" />
    <template v-if="!loading && !error"
      ><ListFilters
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
      <div class="overflow-hidden rounded-2xl border border-stone-200 bg-white">
        <ListTable min-width="650px" :busy="busy"
          ><thead class="bg-stone-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th scope="col" class="px-5 py-4">Operadora</th>
              <th scope="col" class="px-5 py-4">Prazo de renovação</th>
              <th scope="col" class="px-5 py-4">Classificação</th>
              <th scope="col" class="px-5 py-4">Regras</th>
              <th scope="col" class="px-5 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-stone-100">
            <tr v-for="c in pageRows" :key="c.id" class="hover:bg-stone-50/70">
              <td class="px-5 py-4">{{ c.operator?.name }}</td>
              <td class="px-5 py-4">{{ c.rules.find((rule) => rule.is_active && !rule.valid_until)?.minimum_months ?? c.rules.find((rule) => rule.is_active)?.minimum_months ?? "—" }} meses</td>
              <td class="px-5 py-4 font-semibold text-slate-800">{{ c.name }}</td>
              <td class="px-5 py-4">
                <p v-for="r in c.rules" :key="r.id">
                  {{ r.minimum_months }} meses · {{ r.valid_from }} até
                  {{ r.valid_until ?? 'indeterminado' }}
                  <TableActionButton
                    type="button"
                    icon="edit"
                    :label="`Editar regra de ${c.code}`"
                    :busy="busy"
                    @click="editRule(c, r)"
                  />
                </p>
              </td>
              <td class="whitespace-nowrap px-5 py-4 text-right">
                <TableActionButton
                  icon="edit"
                  :label="`Editar ${c.name}`"
                  :busy="busy"
                  @click="edit(c)"
                />
                <TableActionButton
                  icon="tag"
                  :label="`Nova regra para ${c.name}`"
                  :busy="busy"
                  @click="addRule(c)"
                />
              </td>
            </tr>
            <tr v-if="!filtered.length">
              <td colspan="5" class="px-5 py-12 text-center text-slate-500">
                Nenhuma classificação encontrada.
              </td>
            </tr>
          </tbody></ListTable
        >
      </div>
      <PagePagination :page="page" :last-page="lastPage" :total="total" @change="changePage"
    /></template>
    <AppDialog
      :open="modal"
      :title="editing ? 'Editar classificação' : 'Nova classificação'"
      :busy="busy"
      @close="modal = false"
      ><ClassificationForm v-model:form="form" v-model:months="months" :operators="operators" :busy="busy" show-description :max-months="1200" @submit="save" @cancel="modal = false" /></AppDialog
    >
    <AppDialog
      :open="ruleFor !== null"
      :title="`Regra global · ${ruleFor?.code ?? ''}`"
      :busy="busy"
      @close="ruleFor = null"
      ><ClassificationRuleForm v-model:rule="rule" :busy="busy" @submit="saveRule" @cancel="ruleFor = null" /></AppDialog
    >
  </AppShell>
</template>
