<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
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
const loading = ref(false)
const busy = ref(false)
const dialog = ref(false)
const editing = ref<Status | null>(null)
const name = ref('')
const protectedNames = ['ATIVO', 'CONCLUIDO', 'PARCIALMENTE ATIVADO']
const filtered = computed(() => statuses.value.filter(s => s.name.toLocaleLowerCase('pt-BR').includes(applied.value.toLocaleLowerCase('pt-BR'))))
const protectedStatus = (s: Status) => s.is_initial || protectedNames.includes(s.name)
async function load() {
  loading.value = true
  try { statuses.value = (await request<{ data: Status[] }>('/api/v1/admin/order-statuses')).data }
  catch (e) { toast.error(errorMessage(e)) }
  finally { loading.value = false }
}
function open(status: Status | null = null) { editing.value = status; name.value = status?.name ?? ''; dialog.value = true }
async function save() {
  if (!name.value.trim() || busy.value) return
  busy.value = true
  try {
    const url = '/api/v1/admin/order-statuses' + (editing.value ? '/' + editing.value.id : '')
    await mutate(url, { name: name.value }, editing.value ? 'PATCH' : 'POST')
    dialog.value = false
    toast.success('Status salvo.')
    await load()
  } catch (e) { toast.error(errorMessage(e)) }
  finally { busy.value = false }
}
async function remove(status: Status) {
  if (!window.confirm('Excluir o status ' + status.name + '?')) return
  busy.value = true
  try {
    await mutate('/api/v1/admin/order-statuses/' + status.id, {}, 'DELETE')
    toast.success('Status excluído.')
    await load()
  } catch (e) { toast.error(errorMessage(e)) }
  finally { busy.value = false }
}
onMounted(load)
</script>
<template>
  <AppShell title="Status dos pedidos" subtitle="Administração da plataforma">
    <header class="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div><p class="eyebrow">ADMINISTRAÇÃO DA PLATAFORMA</p><h1 class="mt-2 text-3xl font-semibold">Status dos pedidos</h1><p class="mt-1 text-sm text-slate-500">Catálogo global utilizado por todas as empresas.</p></div>
      <button type="button" class="primary-button w-auto" @click="open()">+ Novo status</button>
    </header>
    <ListFilters :columns="1" :count-label="`${filtered.length} status encontrado(s)`" @search="applied = search" @clear="search = ''; applied = ''">
      <label class="text-sm font-semibold text-slate-700">Buscar status<input v-model="search" class="field mt-2" placeholder="Nome do status" /></label>
    </ListFilters>
    <section class="overflow-hidden rounded-2xl border border-stone-200 bg-white">
      <ListTable min-width="580px" :busy="loading">
        <thead class="bg-stone-50"><tr><th class="p-4">Status</th><th class="p-4">Tipo</th><th class="p-4 text-right">Ações</th></tr></thead>
        <tbody><tr v-for="status in filtered" :key="status.id" class="border-t border-stone-100">
          <td class="p-4 font-medium">{{ status.name }}</td>
          <td class="p-4 text-sm text-slate-500">{{ status.is_initial ? 'Inicial' : protectedStatus(status) ? 'Reservado ao sistema' : 'Global' }}</td>
          <td class="p-4 text-right"><div v-if="!protectedStatus(status)" class="flex justify-end gap-2"><button type="button" class="secondary-button w-auto" @click="open(status)">Editar</button><button type="button" class="secondary-button w-auto" :disabled="busy" @click="remove(status)">Excluir</button></div><span v-else class="text-xs text-slate-400">Protegido</span></td>
        </tr></tbody>
      </ListTable>
    </section>
    <AppDialog :open="dialog" :title="editing ? 'Editar status' : 'Novo status'" @close="dialog = false">
      <form class="space-y-4" @submit.prevent="save">
        <label class="block text-sm font-semibold">Nome<input v-model="name" class="field mt-2" required maxlength="100" /></label>
        <div class="flex justify-end gap-2"><button type="button" class="secondary-button w-auto" @click="dialog = false">Cancelar</button><button type="submit" class="primary-button w-auto" :disabled="busy || !name.trim()">Salvar</button></div>
      </form>
    </AppDialog>
  </AppShell>
</template>
