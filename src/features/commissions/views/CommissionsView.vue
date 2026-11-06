<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import PagePagination from '@/components/ui/PagePagination.vue'
import ListFilters from '@/components/ui/ListFilters.vue'
import ListTable from '@/components/ui/ListTable.vue'
import SearchSelect from '@/components/ui/SearchSelect.vue'
import AppShell from '@/components/layout/AppShell.vue'
import CommissionForm from '../components/CommissionForm.vue'
import TableActionButton from '@/components/ui/TableActionButton.vue'
import AsyncNotice from '@/components/ui/AsyncNotice.vue'
import { useCommissionsPage } from '../composables/useCommissionsPage'

const route = useRoute()
const tenantId = computed(() => String(route.params.tenantId))
const {
  tenant,
  operators,
  orderTypes,
  loading,
  busy,
  settingsBusy,
  error,
  writable,
  defaultDeduction,
  filterOperator,
  filterOrderType,
  filteredRows,
  applyFilters,
  clearFilters,
  page,
  total,
  lastPage,
  pageRows,
  changePage,
  editingId,
  modalOpen,
  form,
  format,
  orderTypeLabel,
  edit,
  load,
  saveSettings,
  save,
} = useCommissionsPage(tenantId)
</script>
<template>
  <AppShell
    :tenant="tenant"
    title="Tabelas de comissões"
    subtitle="Comissões recebidas das operadoras"
  >
    <header class="mb-7 flex flex-wrap items-center justify-between gap-4">
      <div>
        <p class="eyebrow">FINANCEIRO</p>
        <h1 class="mt-3 text-3xl font-semibold">Tabelas de comissões</h1>
        <p class="mt-2 text-sm text-slate-500">
          Percentuais recebidos das operadoras, com desconto individual.
        </p>
      </div>
      <button v-if="writable" class="primary-button w-auto" type="button" @click="edit()">
        + Nova tabela
      </button>
    </header>
    <AsyncNotice :loading="loading" :error="error" @retry="load" />
    <form
      v-if="!loading && !error"
      class="mb-5 rounded-2xl border border-stone-200 bg-white p-5"
      @submit.prevent="saveSettings"
    >
      <div class="flex flex-wrap items-end gap-4">
        <label class="block text-sm font-semibold text-slate-700"
          >Desconto padrão da empresa (%)<input
            v-model="defaultDeduction"
            :disabled="!writable || settingsBusy"
            inputmode="decimal"
            class="mt-2 block w-44 rounded-xl border-0 bg-stone-100 px-4 py-3 text-sm font-normal outline-none focus:bg-white focus:ring-2 focus:ring-orange-400" /></label
        ><button
          v-if="writable"
          type="submit"
          class="primary-button w-auto"
          :disabled="settingsBusy"
        >
          {{ settingsBusy ? 'Salvando…' : 'Salvar padrão' }}
        </button>
      </div>
      <p class="mt-3 text-xs text-slate-500">
        Aplicado à comissão bruta quando a tabela não possui desconto próprio. Use 0% para não
        descontar.
      </p>
    </form>
    <ListFilters
      :columns="2"
      v-if="!loading && !error"
      :count-label="`${filteredRows.length} resultado(s) encontrado(s)`"
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
          v-model="filterOrderType"
          :options="[{ value: '', label: 'Todos os tipos' }, ...orderTypes]"
      /></label>
    </ListFilters>
    <section
      v-if="!loading && !error"
      class="overflow-hidden rounded-2xl border border-stone-200 bg-white"
    >
      <ListTable min-width="720px">
        <thead class="bg-stone-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th class="px-5 py-4">Tipo de pedido</th>
            <th class="px-4 py-4">Operadora</th>
            <th class="px-4 py-4 text-right">Comissão</th>
            <th class="px-4 py-4 text-right">Desconto</th>
            <th class="px-4 py-4">Situação</th>
            <th v-if="writable" class="px-5 py-4 text-right">Ações</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-stone-100">
          <tr v-for="item in pageRows" :key="item.id" class="hover:bg-stone-50/70">
            <td class="px-5 py-4 font-semibold text-slate-800">
              {{ orderTypeLabel(item.order_type) }}
            </td>
            <td class="px-4 py-4 text-slate-600">{{ item.operator?.name }}</td>
            <td class="px-4 py-4 text-right font-semibold text-slate-800">
              {{ format(item.percentage) }}
            </td>
            <td class="px-4 py-4 text-right text-slate-600">
              {{
                item.deduction_percentage === null
                  ? 'Padrão (' + format(defaultDeduction) + ')'
                  : format(item.deduction_percentage)
              }}
            </td>
            <td class="px-4 py-4">
              <span
                class="rounded-full px-2.5 py-1 text-xs font-semibold"
                :class="
                  item.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-slate-500'
                "
                >{{ item.is_active ? 'Ativa' : 'Inativa' }}</span
              >
            </td>
            <td v-if="writable" class="px-5 py-4 text-right">
              <TableActionButton
                icon="edit"
                :label="`Editar tabela de ${item.operator?.name ?? 'comissões'}`"
                :disabled="busy"
                @click="edit(item)"
              />
            </td>
          </tr>
        </tbody>
      </ListTable>
      <p v-if="!filteredRows.length" class="px-5 py-8 text-center text-sm text-slate-500">
        Nenhuma tabela cadastrada.
      </p>
    </section>
    <PagePagination
      v-if="!loading && !error"
      :page="page"
      :last-page="lastPage"
      :total="total"
      :busy="loading || busy"
      @change="changePage"
    />
    <div
      v-if="modalOpen && writable"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <CommissionForm
        v-model="form"
        :operators="operators"
        :order-types="orderTypes"
        :busy="busy"
        :editing="!!editingId"
        @submit="save"
        @cancel="modalOpen = false"
      />
    </div>
  </AppShell>
</template>
