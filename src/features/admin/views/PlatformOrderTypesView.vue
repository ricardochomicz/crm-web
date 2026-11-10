<script setup lang="ts">
import { onMounted, ref } from 'vue'
import AppShell from '@/components/layout/AppShell.vue'
import AppDialog from '@/components/ui/AppDialog.vue'
import AsyncNotice from '@/components/ui/AsyncNotice.vue'
import { request, mutate } from '@/lib/http'
import { errorMessage } from '@/lib/feedback'
import { toast } from '@/services/toast'

type OrderType = { id: string; name: string; requires_number: boolean; is_active: boolean; position: number }
const types = ref<OrderType[]>([])
const loading = ref(true)
const error = ref('')
const busy = ref(false)
const dialog = ref(false)
const editing = ref<OrderType | null>(null)
const form = ref({ name: '', requires_number: false, is_active: true, position: 0 })

async function load() {
  loading.value = true
  error.value = ''
  try {
    types.value = (await request<{ data: OrderType[] }>('/api/v1/admin/order-types')).data
  } catch (e) { error.value = errorMessage(e) }
  finally { loading.value = false }
}
function open(type: OrderType | null = null) {
  editing.value = type
  form.value = {
    name: type?.name ?? '',
    requires_number: type?.requires_number ?? false,
    is_active: type?.is_active ?? true,
    position: type?.position ?? 0,
  }
  dialog.value = true
}
async function save() {
  if (busy.value || !form.value.name.trim()) return
  busy.value = true
  try {
    await mutate('/api/v1/admin/order-types' + (editing.value ? '/' + editing.value.id : ''), {
      ...form.value, name: form.value.name.trim(),
    }, editing.value ? 'PATCH' : 'POST')
    dialog.value = false
    toast.success('Tipo de pedido salvo.')
    await load()
  } catch (e) { toast.error(errorMessage(e)) }
  finally { busy.value = false }
}
onMounted(load)
</script>

<template>
  <AppShell title="Tipos de pedido" subtitle="Administração da plataforma">
    <header class="mb-7 flex flex-wrap items-center justify-between gap-4">
      <div>
        <p class="eyebrow">ADMINISTRAÇÃO DA PLATAFORMA</p>
        <h1 class="mt-3 text-3xl font-semibold">Tipos de pedido</h1>
        <p class="mt-2 text-sm text-slate-500">Catálogo global disponível para as empresas do TelecomHub.</p>
      </div>
      <button v-if="!loading && !error" class="primary-button w-auto" type="button" @click="open()">+ Novo tipo</button>
    </header>
    <AsyncNotice :loading="loading" :error="error" @retry="load" />
    <section v-if="!loading && !error" class="overflow-hidden rounded-2xl border border-stone-200 bg-white">
      <div class="overflow-x-auto">
        <table class="w-full min-w-[620px] text-left text-sm">
          <thead class="bg-stone-50 text-xs uppercase tracking-wide text-slate-500">
            <tr><th class="px-5 py-4">Tipo</th><th class="px-5 py-4">Número obrigatório</th><th class="px-5 py-4">Situação</th><th class="px-5 py-4">Ordem</th><th class="px-5 py-4 text-right">Ações</th></tr>
          </thead>
          <tbody class="divide-y divide-stone-100">
            <tr v-for="type in types" :key="type.id">
              <td class="px-5 py-4 font-semibold">{{ type.name }}</td>
              <td class="px-5 py-4">{{ type.requires_number ? 'Sim' : 'Não' }}</td>
              <td class="px-5 py-4">{{ type.is_active ? 'Ativo' : 'Inativo' }}</td>
              <td class="px-5 py-4">{{ type.position }}</td>
              <td class="px-5 py-4 text-right"><button type="button" class="secondary-button w-auto" @click="open(type)">Editar</button></td>
            </tr>
            <tr v-if="!types.length"><td colspan="5" class="px-5 py-12 text-center text-slate-500">Nenhum tipo de pedido cadastrado.</td></tr>
          </tbody>
        </table>
      </div>
    </section>
    <AppDialog :open="dialog" :busy="busy" :title="editing ? 'Editar tipo de pedido' : 'Novo tipo de pedido'" @close="dialog = false">
      <form class="space-y-4" @submit.prevent="save">
        <label class="block text-sm font-semibold">Nome<input v-model="form.name" class="field mt-2" maxlength="150" required /></label>
        <label class="block text-sm font-semibold">Ordem de exibição<input v-model.number="form.position" type="number" min="0" max="999999" class="field mt-2" required /></label>
        <label class="flex items-center gap-2 text-sm"><input v-model="form.requires_number" type="checkbox" class="size-4 accent-orange-600" />Exigir número do pedido</label>
        <label class="flex items-center gap-2 text-sm"><input v-model="form.is_active" type="checkbox" class="size-4 accent-orange-600" />Tipo ativo</label>
        <div class="flex justify-end gap-2">
          <button type="button" class="secondary-button w-auto" @click="dialog = false">Cancelar</button>
          <button type="submit" class="primary-button w-auto" :disabled="busy || !form.name.trim()">Salvar</button>
        </div>
      </form>
    </AppDialog>
  </AppShell>
</template>
