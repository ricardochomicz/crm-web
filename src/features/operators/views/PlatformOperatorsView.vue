<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { operatorsApi, type Operator } from '../api'
import { errorMessage } from '@/lib/feedback'
import { toast } from '@/services/toast'

const operators = ref<Operator[]>([])
const loading = ref(true)
const busy = ref(false)
const error = ref('')
const form = reactive({ name: '', slug: '' })
const editing = ref<number | null>(null)
const editForm = reactive({ name: '', slug: '' })
function edit(operator: Operator) {
  editing.value = operator.id
  editForm.name = operator.name
  editForm.slug = operator.slug
}
async function saveEdit(operator: Operator) {
  if (busy.value) return
  busy.value = true
  try {
    await operatorsApi.update(operator.id, { name: editForm.name.trim(), slug: editForm.slug.trim().toLowerCase() })
    editing.value = null
    toast.success('Operadora atualizada.')
    await load()
  } catch (failure) { toast.error(errorMessage(failure)) }
  finally { busy.value = false }
}
async function load() {
  loading.value = true
  error.value = ''
  try { operators.value = (await operatorsApi.catalog()).data }
  catch (failure) { error.value = errorMessage(failure) }
  finally { loading.value = false }
}
async function create() {
  if (busy.value) return
  busy.value = true
  try {
    await operatorsApi.create({ name: form.name.trim(), slug: form.slug.trim().toLowerCase() })
    form.name = ''
    form.slug = ''
    toast.success('Operadora cadastrada.')
    await load()
  } catch (failure) { toast.error(errorMessage(failure)) }
  finally { busy.value = false }
}
async function toggle(operator: Operator) {
  if (busy.value) return
  busy.value = true
  try {
    await operatorsApi.update(operator.id, { is_active: !operator.is_active })
    toast.success('Situação da operadora atualizada.')
    await load()
  } catch (failure) { toast.error(errorMessage(failure)) }
  finally { busy.value = false }
}
onMounted(() => { void load() })
</script>

<template>
  <section class="space-y-6">
    <div>
      <h2 class="text-xl font-semibold text-slate-800">Catálogo de operadoras</h2>
      <p class="mt-2 text-sm text-slate-500">Catálogo global administrado pela plataforma. Desativar não exclui os vínculos existentes.</p>
    </div>
    <form class="grid gap-3 rounded-2xl border border-stone-200 bg-white p-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end" @submit.prevent="create">
      <label class="grid gap-2 text-sm font-medium">Nome
        <input v-model="form.name" class="field" maxlength="160" required placeholder="Nome da operadora" />
      </label>
      <label class="grid gap-2 text-sm font-medium">Identificador
        <input v-model="form.slug" class="field" maxlength="160" required pattern="[a-z0-9-]+" placeholder="nome-da-operadora" />
      </label>
      <button class="primary-button w-auto" :disabled="busy">Cadastrar</button>
    </form>
    <p v-if="loading" class="text-sm text-slate-500">Carregando operadoras…</p>
    <p v-else-if="error" class="text-sm text-red-700">{{ error }} <button class="underline" @click="load">Tentar novamente</button></p>
    <div v-else class="overflow-hidden rounded-2xl border border-stone-200 bg-white">
      <div v-for="operator in operators" :key="operator.id" class="flex items-center justify-between gap-4 border-b border-stone-100 px-5 py-4">
        <form v-if="editing === operator.id" class="flex flex-1 flex-wrap items-end gap-2" @submit.prevent="saveEdit(operator)">
          <label class="grid gap-1 text-xs">Nome<input v-model="editForm.name" class="field" maxlength="160" required /></label>
          <label class="grid gap-1 text-xs">Identificador<input v-model="editForm.slug" class="field" maxlength="160" pattern="[a-z0-9-]+" required /></label>
          <button class="primary-button w-auto" :disabled="busy">Salvar</button>
          <button type="button" class="secondary-button" @click="editing = null">Cancelar</button>
        </form>
        <div v-else><p class="font-semibold">{{ operator.name }}</p><p class="text-xs text-slate-500">{{ operator.slug }}</p></div>
        <div class="flex gap-2"><button class="secondary-button" :disabled="busy" @click="edit(operator)">Editar</button><button class="secondary-button" :disabled="busy" @click="toggle(operator)">{{ operator.is_active ? 'Desativar' : 'Ativar' }}</button></div>
      </div>
      <p v-if="!operators.length" class="p-5 text-sm text-slate-500">Nenhuma operadora cadastrada.</p>
    </div>
  </section>
</template>
