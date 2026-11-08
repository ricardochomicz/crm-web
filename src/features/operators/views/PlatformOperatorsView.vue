<script setup lang="ts">
import PagePagination from '@/components/ui/PagePagination.vue'
import { useListPagination } from '@/composables/useListPagination'
import AppDialog from '@/components/ui/AppDialog.vue'
import AsyncNotice from '@/components/ui/AsyncNotice.vue'
import ListFilters from '@/components/ui/ListFilters.vue'
import ListTable from '@/components/ui/ListTable.vue'
import SearchSelect from '@/components/ui/SearchSelect.vue'
import TableActionButton from '@/components/ui/TableActionButton.vue'
import { usePlatformOperators } from '../composables/usePlatformOperators'

const {
  operators,
  loading,
  busy,
  creating,
  error,
  searchFilter,
  statusFilter,
  form,
  editing,
  editForm,
  filteredOperators,
  applyFilters,
  clearFilters,
  edit,
  closeEdit,
  saveEdit,
  load,
  create,
  toggle,
} = usePlatformOperators()
const { page, total, lastPage, pageRows, changePage } = useListPagination(filteredOperators)

function newOperator() {
  form.name = ''
  form.slug = ''
  creating.value = true
}
</script>
<template>
  <section>
    <header class="mb-7 flex flex-wrap items-center justify-between gap-4">
      <div>
        <p class="eyebrow">ADMINISTRAÇÃO DA PLATAFORMA</p>
        <h1 class="mt-3 text-3xl font-semibold">Catálogo de operadoras</h1>
        <p class="mt-2 text-sm text-slate-500">
          Catálogo global administrado pela plataforma. Desativar não exclui os vínculos existentes.
        </p>
      </div>
      <button
        v-if="!loading && !error"
        type="button"
        class="primary-button w-auto"
        :disabled="busy"
        @click="newOperator"
      >
        + Nova operadora
      </button>
    </header>

    <AsyncNotice :loading="loading" :error="error" @retry="load" />

    <template v-if="!loading && !error">
      <ListFilters
        :columns="2"
        :busy="loading"
        :count-label="`${filteredOperators.length} operadora(s) encontrada(s)`"
        @search="applyFilters"
        @clear="clearFilters"
      >
        <label class="text-xs font-semibold text-slate-600">
          Buscar operadora
          <input
            v-model="searchFilter"
            type="search"
            placeholder="Nome ou identificador"
            class="field"
          />
        </label>
        <label class="text-xs font-semibold text-slate-600">
          Situação
          <SearchSelect
            v-model="statusFilter"
            :options="[
              { value: '', label: 'Todas as situações' },
              { value: 'active', label: 'Ativas' },
              { value: 'inactive', label: 'Inativas' },
            ]"
          />
        </label>
      </ListFilters>

      <section class="overflow-hidden rounded-2xl border border-stone-200 bg-white">
        <ListTable min-width="640px" :busy="busy">
          <thead class="bg-stone-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th scope="col" class="px-6 py-4">Operadora</th>
              <th scope="col" class="px-6 py-4">Identificador</th>
              <th scope="col" class="px-6 py-4">Situação</th>
              <th scope="col" class="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-stone-100">
            <tr v-for="operator in pageRows" :key="operator.id" class="hover:bg-stone-50/70">
              <td class="px-6 py-4 font-semibold text-slate-800">{{ operator.name }}</td>
              <td class="px-6 py-4 font-mono text-xs text-slate-500">{{ operator.slug }}</td>
              <td class="px-6 py-4">
                <span
                  class="rounded-full px-2.5 py-1 text-xs font-semibold"
                  :class="
                    operator.is_active
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-stone-100 text-slate-500'
                  "
                >
                  {{ operator.is_active ? 'Ativa' : 'Inativa' }}
                </span>
              </td>
              <td class="whitespace-nowrap px-6 py-4 text-right">
                <div class="inline-flex items-center gap-1.5">
                  <TableActionButton
                    icon="edit"
                    :label="`Editar ${operator.name}`"
                    :disabled="busy"
                    @click="edit(operator)"
                  />
                  <TableActionButton
                    :icon="operator.is_active ? 'pause' : 'play'"
                    :tone="operator.is_active ? 'danger' : 'success'"
                    :label="
                      operator.is_active ? `Desativar ${operator.name}` : `Ativar ${operator.name}`
                    "
                    :disabled="busy"
                    @click="toggle(operator)"
                  />
                </div>
              </td>
            </tr>
            <tr v-if="!filteredOperators.length">
              <td colspan="4" class="px-6 py-12 text-center text-slate-500">
                {{
                  operators.length
                    ? 'Nenhuma operadora corresponde aos filtros.'
                    : 'Nenhuma operadora cadastrada.'
                }}
              </td>
            </tr>
          </tbody>
        </ListTable>
      </section>
      <PagePagination
        :page="page"
        :last-page="lastPage"
        :total="total"
        :busy="busy"
        @change="changePage"
      />
    </template>

    <AppDialog :open="creating" title="Nova operadora" :busy="busy" @close="creating = false">
      <form class="space-y-4" @submit.prevent="create">
        <label class="grid gap-2 text-sm font-medium">
          Nome
          <input
            v-model="form.name"
            class="field"
            maxlength="160"
            required
            placeholder="Nome da operadora"
          />
        </label>
        <label class="grid gap-2 text-sm font-medium">
          Identificador
          <input
            v-model="form.slug"
            class="field"
            maxlength="160"
            required
            pattern="[a-z0-9-]+"
            placeholder="nome-da-operadora"
          />
        </label>
        <div class="flex justify-end gap-3 pt-3">
          <button type="button" class="secondary-button" :disabled="busy" @click="creating = false">
            Cancelar
          </button>
          <button type="submit" class="primary-button w-auto" :disabled="busy">
            {{ busy ? 'Cadastrando…' : 'Cadastrar' }}
          </button>
        </div>
      </form>
    </AppDialog>

    <AppDialog
      :open="editing !== null"
      :busy="busy"
      :title="`Editar ${editing?.name ?? 'operadora'}`"
      @close="closeEdit"
    >
      <form class="space-y-4" @submit.prevent="saveEdit">
        <label class="block text-sm font-medium text-slate-700">
          Nome
          <input v-model="editForm.name" class="field mt-1 w-full" maxlength="160" required />
        </label>
        <label class="block text-sm font-medium text-slate-700">
          Identificador
          <input
            v-model="editForm.slug"
            class="field mt-1 w-full"
            maxlength="160"
            pattern="[a-z0-9-]+"
            required
          />
        </label>
        <div class="flex justify-end gap-3 pt-3">
          <button type="button" class="secondary-button" :disabled="busy" @click="closeEdit">
            Cancelar
          </button>
          <button type="submit" class="primary-button w-auto" :disabled="busy">
            {{ busy ? 'Salvando…' : 'Salvar alterações' }}
          </button>
        </div>
      </form>
    </AppDialog>
  </section>
</template>
