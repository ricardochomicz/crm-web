<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { request, mutate } from '@/lib/http'
import { errorMessage } from '@/lib/feedback'
import type { CompanyRole } from '@/features/members/api'

type Permission = { key: string; label: string; group: string; requires: string[] }
const props = defineProps<{ tenantId: string; catalog: Permission[]; canEdit: boolean }>()
const roles = ref<CompanyRole[]>([])
const selectedId = ref('')
const name = ref('')
const permissions = ref<string[]>([])
const active = ref(true)
const busy = ref(false)
const loading = ref(true)
const error = ref('')
const creating = ref(false)
const search = ref('')
const expanded = ref<string[]>([])
const selected = computed(() => roles.value.find(role => role.id === selectedId.value))
const protectedRole = computed(() => !creating.value && selected.value?.code === 'OWNER')
const original = computed(() => selected.value?.permissions ?? [])
const dirty = computed(() => creating.value || name.value !== selected.value?.name || active.value !== selected.value?.is_active ||
  permissions.value.length !== original.value.length || permissions.value.some(key => !original.value.includes(key)))
const groups = computed(() => {
  const value = search.value.trim().toLocaleLowerCase('pt-BR')
  return [...new Set(props.catalog.map(item => item.group))].map(group => ({
    name: group,
    items: props.catalog.filter(item => item.group === group && (!value || `${group} ${item.label}`.toLocaleLowerCase('pt-BR').includes(value))),
  })).filter(group => group.items.length)
})
const count = (items: Permission[]) => items.filter(item => permissions.value.includes(item.key)).length
function discardChanges() { return !dirty.value || window.confirm('Descartar alterações não salvas neste cargo?') }
function select(role: CompanyRole) {
  if (!discardChanges()) return
  creating.value = false
  selectedId.value = role.id
  name.value = role.name
  permissions.value = [...role.permissions]
  active.value = role.is_active
  error.value = ''
  expanded.value = []
}
function add() {
  if (!discardChanges()) return
  creating.value = true
  selectedId.value = ''
  name.value = ''
  permissions.value = []
  active.value = true
  error.value = ''
  expanded.value = []
}
async function load() {
  loading.value = true
  try {
    roles.value = (await request<{data: CompanyRole[]}>(`/api/v1/tenants/${props.tenantId}/roles`)).data
    if (!creating.value) {
      const role = roles.value.find(item => item.id === selectedId.value) ?? roles.value.find(item => item.code !== 'OWNER') ?? roles.value[0]
      if (role) {
        selectedId.value = role.id
        name.value = role.name
        permissions.value = [...role.permissions]
        active.value = role.is_active
      }
    }
  } catch (e) { error.value = errorMessage(e) }
  finally { loading.value = false }
}
function toggle(key: string, checked: boolean) {
  if (!props.canEdit || protectedRole.value) return
  const next = new Set(permissions.value)
  if (checked) {
    const addRequired = (permissionKey: string) => {
      if (next.has(permissionKey)) return
      next.add(permissionKey)
      props.catalog.find(item => item.key === permissionKey)?.requires.forEach(addRequired)
    }
    addRequired(key)
  } else {
    next.delete(key)
    let changed = true
    while (changed) {
      changed = false
      for (const item of props.catalog) {
        if (next.has(item.key) && item.requires.some(required => !next.has(required))) {
          next.delete(item.key)
          changed = true
        }
      }
    }
  }
  permissions.value = [...next]
}
function applyGroup(items: Permission[], mode: 'none' | 'read' | 'all') {
  if (!props.canEdit || protectedRole.value) return
  if (mode === 'none') { items.forEach(item => toggle(item.key, false)); return }
  if (mode === 'all') { items.forEach(item => toggle(item.key, true)); return }
  const readItems = items.filter(item => /(^|\.)(view|list|read)$/.test(item.key) || /visualizar|consultar|listar|ver\b/i.test(item.label))
  items.forEach(item => { if (!readItems.includes(item)) toggle(item.key, false) })
  readItems.forEach(item => toggle(item.key, true))
}
function toggleExpanded(group: string) {
  expanded.value = expanded.value.includes(group) ? expanded.value.filter(item => item !== group) : [...expanded.value, group]
}
async function save() {
  if (!name.value.trim() || busy.value || !props.canEdit || protectedRole.value || !dirty.value) return
  busy.value = true
  error.value = ''
  try {
    const url = `/api/v1/tenants/${props.tenantId}/roles${creating.value ? '' : '/' + selectedId.value}`
    const result = await mutate<{data: CompanyRole}>(url,
      { name: name.value.trim(), permissions: permissions.value, is_active: active.value }, creating.value ? 'POST' : 'PATCH')
    creating.value = false
    selectedId.value = result.data.id
    await load()
  } catch (e) { error.value = errorMessage(e) }
  finally { busy.value = false }
}
onMounted(load)
</script>
<template>
<section class="rounded-2xl border border-stone-200 bg-white p-5 sm:p-7">
  <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
    <div>
      <h2 class="text-xl font-semibold text-slate-900">Cargos da empresa</h2>
      <p class="mt-1 text-sm text-slate-500">Escolha um cargo e marque o que as pessoas com ele podem fazer.</p>
    </div>
    <button type="button" class="secondary-button" :disabled="!canEdit || busy" @click="add">+ Criar cargo</button>
  </div>
  <p v-if="loading" class="py-6 text-sm text-slate-500">Carregando cargos…</p>
  <p v-if="error" role="alert" class="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{{ error }}</p>
  <div v-if="!loading" class="grid items-start gap-6 lg:grid-cols-[14rem_minmax(0,1fr)]">
    <nav aria-label="Cargos disponíveis" class="flex gap-2 overflow-x-auto pb-2 lg:flex-col">
      <button v-for="role in roles" :key="role.id" type="button" :disabled="busy"
        :aria-current="selectedId === role.id && !creating ? 'true' : undefined"
        class="shrink-0 rounded-xl px-4 py-3 text-left text-sm transition lg:w-full"
        :class="selectedId === role.id && !creating ? 'bg-slate-800 font-semibold text-white' : 'border border-stone-200 text-slate-700 hover:bg-stone-50'"
        @click="select(role)">
        <span class="block">{{ role.name }}</span>
        <span v-if="role.code === 'OWNER'" class="block text-xs opacity-70">Acesso total</span>
        <span v-else-if="!role.is_active" class="block text-xs opacity-70">Inativo</span>
      </button>
    </nav>
    <form v-if="creating || selected" class="min-w-0 space-y-6" @submit.prevent="save">
      <div class="rounded-xl bg-stone-50 p-4">
        <label for="company-role-name" class="mb-2 block text-sm font-semibold text-slate-700">Nome do cargo</label>
        <input id="company-role-name" v-model="name" class="field" maxlength="100" required
          placeholder="Ex.: Supervisor de Equipe" :disabled="!canEdit || protectedRole || busy" />
        <p v-if="protectedRole" class="mt-2 text-xs text-slate-500">O proprietário sempre tem acesso total. Suas permissões não podem ser alteradas.</p>
        <label v-else-if="!creating" class="mt-3 flex items-center gap-2 text-sm text-slate-600">
          <input v-model="active" type="checkbox" :disabled="!canEdit || busy" /> Cargo ativo para novos vínculos
        </label>
      </div>
      <div>
        <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div><h3 class="text-lg font-semibold">Acesso aos módulos</h3><p class="mt-1 text-xs text-slate-500">{{ permissions.length }} permissões selecionadas</p></div>
          <input v-model="search" type="search" class="field max-w-64" aria-label="Buscar módulo ou permissão" placeholder="Buscar módulo…" />
        </div>
        <div class="space-y-3">
          <section v-for="group in groups" :key="group.name" class="overflow-hidden rounded-xl border border-stone-200">
            <div class="flex flex-wrap items-center justify-between gap-3 p-4">
              <button type="button" class="flex min-w-0 items-center gap-2 text-left" :aria-expanded="expanded.includes(group.name) || !!search"
                @click="toggleExpanded(group.name)">
                <span class="text-slate-400">{{ expanded.includes(group.name) || search ? '▾' : '▸' }}</span>
                <span class="font-semibold text-slate-800">{{ group.name }}</span>
                <span class="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-slate-500">{{ protectedRole ? group.items.length : count(group.items) }}/{{ group.items.length }}</span>
              </button>
              <div v-if="!protectedRole" class="flex flex-wrap gap-1" :aria-label="`Acesso rápido: ${group.name}`">
                <button type="button" class="rounded-lg border px-2.5 py-1.5 text-xs hover:bg-stone-50" :disabled="!canEdit || busy" @click="applyGroup(group.items, 'none')">Sem acesso</button>
                <button type="button" class="rounded-lg border px-2.5 py-1.5 text-xs hover:bg-stone-50" :disabled="!canEdit || busy" @click="applyGroup(group.items, 'read')">Só visualizar</button>
                <button type="button" class="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs text-emerald-800 hover:bg-emerald-100" :disabled="!canEdit || busy" @click="applyGroup(group.items, 'all')">Acesso completo</button>
              </div>
            </div>
            <div v-if="expanded.includes(group.name) || search" class="grid gap-2 border-t border-stone-100 bg-stone-50/60 p-4 sm:grid-cols-2">
              <label v-for="permission in group.items" :key="permission.key" class="flex cursor-pointer items-start gap-3 rounded-lg bg-white p-3 text-sm text-slate-700">
                <input type="checkbox" class="mt-0.5 size-4 accent-emerald-700"
                  :checked="protectedRole || permissions.includes(permission.key)" :disabled="!canEdit || protectedRole || busy"
                  @change="toggle(permission.key, ($event.target as HTMLInputElement).checked)" />
                <span>{{ permission.label }}</span>
              </label>
            </div>
          </section>
          <p v-if="!groups.length" class="py-5 text-sm text-slate-500">Nenhum módulo ou permissão encontrado.</p>
        </div>
      </div>
      <div v-if="!protectedRole" class="sticky bottom-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white/95 p-4 shadow-sm backdrop-blur">
        <p class="text-xs text-slate-600">{{ dirty ? 'Alterações ainda não salvas' : 'Todas as alterações estão salvas' }}</p>
        <button type="submit" class="primary-button w-auto" :disabled="!canEdit || busy || !dirty || !name.trim()">
          {{ busy ? 'Salvando…' : creating ? 'Criar cargo' : 'Salvar permissões' }}
        </button>
      </div>
    </form>
  </div>
</section>
</template>
