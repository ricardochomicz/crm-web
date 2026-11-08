<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import AsyncNotice from '@/components/ui/AsyncNotice.vue'
import TableActionButton from '@/components/ui/TableActionButton.vue'
import PagePagination from '@/components/ui/PagePagination.vue'
import { useListPagination } from '@/composables/useListPagination'
import AppShell from '@/components/layout/AppShell.vue'
import AppDialog from '@/components/ui/AppDialog.vue'
import ListFilters from '@/components/ui/ListFilters.vue'
import ListTable from '@/components/ui/ListTable.vue'
import { request, mutate } from '@/lib/http'
import { toast } from '@/services/toast'
import { errorMessage } from '@/lib/feedback'

type Status = { id: string; name: string; is_initial: boolean }
const statuses = ref<Status[]>([])
const search = ref('')
const applied = ref('')
const loading = ref(true)
const error = ref('')
const busy = ref(false)
const dialog = ref(false)
const editing = ref<Status | null>(null)
const name = ref('')
const protectedNames = ['ATIVO', 'CONCLUIDO', 'PARCIALMENTE ATIVADO']
const filtered = computed(() =>
  statuses.value.filter((s) =>
    s.name.toLocaleLowerCase('pt-BR').includes(applied.value.toLocaleLowerCase('pt-BR')),
  ),
)
function clearFilters() {
  search.value = ''
  applied.value = ''
}
const protectedStatus = (s: Status) => s.is_initial || protectedNames.includes(s.name)
async function load() {
  loading.value = true
  error.value = ''
  try {
    statuses.value = (await request<{ data: Status[] }>('/api/v1/admin/order-statuses')).data
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    loading.value = false
  }
}
function open(status: Status | null = null) {
  editing.value = status
  name.value = status?.name ?? ''
  dialog.value = true
}
async function save() {
  if (!name.value.trim() || busy.value) return
  busy.value = true
  try {
    const url = '/api/v1/admin/order-statuses' + (editing.value ? '/' + editing.value.id : '')
    await mutate(url, { name: name.value }, editing.value ? 'PATCH' : 'POST')
    dialog.value = false
    toast.success('Status salvo.')
    await load()
  } catch (e) {
    toast.error(errorMessage(e))
  } finally {
    busy.value = false
  }
}
async function remove(status: Status) {
  if (!window.confirm('Excluir o status ' + status.name + '?')) return
  busy.value = true
  try {
    await mutate('/api/v1/admin/order-statuses/' + status.id, {}, 'DELETE')
    toast.success('Status excluído.')
    await load()
  } catch (e) {
    toast.error(errorMessage(e))
  } finally {
    busy.value = false
  }
}
const { page, total, lastPage, pageRows, changePage } = useListPagination(filtered)
onMounted(load)
</script>
<template>
  <AppShell title="Status dos pedidos" subtitle="Administração da plataforma">
    <header class="mb-7 flex flex-wrap items-center justify-between gap-4">
      <div>
        <p class="eyebrow">ADMINISTRAÇÃO DA PLATAFORMA</p>
        <h1 class="mt-3 text-3xl font-semibold">Status dos pedidos</h1>
        <p class="mt-2 text-sm text-slate-500">Catálogo global utilizado por todas as empresas.</p>
      </div>
      <button
        type="button"
        class="primary-button w-auto"
        v-if="!loading && !error"
        :disabled="busy"
        @click="open()"
      >
        + Novo status
      </button>
    </header>
    <AsyncNotice :loading="loading" :error="error" @retry="load" />
    <template v-if="!loading && !error">
      <ListFilters
        :columns="1"
        :busy="busy"
        :count-label="`${filtered.length} status encontrado(s)`"
        @search="applied = search"
        @clear="clearFilters"
      >
        <label class="text-xs font-semibold text-slate-600"
          >Buscar status<input
            v-model="search"
            type="search"
            class="field"
            placeholder="Nome do status"
        /></label>
      </ListFilters>
      <section class="overflow-hidden rounded-2xl border border-stone-200 bg-white">
        <ListTable min-width="580px" :busy="loading">
          <thead class="bg-stone-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th scope="col" class="px-5 py-4">Status</th>
              <th scope="col" class="px-5 py-4">Tipo</th>
              <th scope="col" class="px-5 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-stone-100">
            <tr v-for="status in pageRows" :key="status.id" class="hover:bg-stone-50/70">
              <td class="px-5 py-4 font-semibold text-slate-800">{{ status.name }}</td>
              <td class="px-5 py-4 text-sm text-slate-500">
                {{
                  status.is_initial
                    ? 'Inicial'
                    : protectedStatus(status)
                      ? 'Reservado ao sistema'
                      : 'Global'
                }}
              </td>
              <td class="px-5 py-4 text-right">
                <div v-if="!protectedStatus(status)" class="flex justify-end gap-2">
                  <TableActionButton
                    icon="edit"
                    :label="`Editar ${status.name}`"
                    :busy="busy"
                    @click="open(status)"
                  /><TableActionButton
                    icon="trash"
                    tone="danger"
                    :label="`Excluir ${status.name}`"
                    :busy="busy"
                    @click="remove(status)"
                  />
                </div>
                <span v-else class="text-xs text-slate-400">Protegido</span>
              </td>
            </tr>
            <tr v-if="!filtered.length">
              <td colspan="3" class="px-5 py-12 text-center text-slate-500">
                Nenhum status encontrado.
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
    <AppDialog
      :busy="busy"
      :open="dialog"
      :title="editing ? 'Editar status' : 'Novo status'"
      @close="dialog = false"
    >
      <form class="space-y-4" @submit.prevent="save">
        <label class="block text-sm font-semibold"
          >Nome<input v-model="name" class="field mt-2" required maxlength="100"
        /></label>
        <div class="flex justify-end gap-2">
          <button type="button" class="secondary-button w-auto" @click="dialog = false">
            Cancelar</button
          ><button type="submit" class="primary-button w-auto" :disabled="busy || !name.trim()">
            Salvar
          </button>
        </div>
      </form>
    </AppDialog>
  </AppShell>
</template>
