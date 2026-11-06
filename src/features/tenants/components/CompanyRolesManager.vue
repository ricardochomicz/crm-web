<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { request, mutate } from '@/lib/http'
import { errorMessage } from '@/lib/feedback'
import type { CompanyRole } from '@/features/members/api'
const props = defineProps<{ tenantId: string; catalog: {key:string;label:string;group:string;requires:string[]}[]; canEdit: boolean }>()
const roles = ref<CompanyRole[]>([])
const selectedId = ref('')
const name = ref('')
const permissions = ref<string[]>([])
const active = ref(true)
const busy = ref(false)
const error = ref('')
const creating = ref(false)
const selected = computed(() => roles.value.find(role => role.id === selectedId.value))
async function load() {
 try { roles.value = (await request<{data:CompanyRole[]}>(`/api/v1/tenants/${props.tenantId}/roles`)).data; if (!selectedId.value && roles.value.length) select(roles.value[0]!) }
 catch (e) { error.value = errorMessage(e) }
}
function select(role: CompanyRole) {
 creating.value = false; selectedId.value = role.id; name.value = role.name; permissions.value = [...role.permissions]; active.value = role.is_active; error.value = ''
}
function add() { creating.value = true; selectedId.value = ''; name.value = ''; permissions.value = []; active.value = true; error.value = '' }
function toggle(key:string, checked:boolean) {
 const next = new Set(permissions.value)
 if (checked) { next.add(key); props.catalog.find(item => item.key === key)?.requires.forEach(req => next.add(req)) }
 else { next.delete(key); props.catalog.filter(item => item.requires.includes(key)).forEach(item => next.delete(item.key)) }
 permissions.value = [...next]
}
async function save() {
 if (!name.value.trim() || busy.value) return
 busy.value = true; error.value = ''
 try {
  const url = `/api/v1/tenants/${props.tenantId}/roles${creating.value ? '' : '/'+selectedId.value}`
  const result = await mutate<{data:CompanyRole}>(url, {name:name.value.trim(),permissions:permissions.value,is_active:active.value}, creating.value ? 'POST' : 'PATCH')
  await load(); select(roles.value.find(role => role.id === result.data.id) ?? result.data)
 } catch (e) { error.value = errorMessage(e) }
 finally { busy.value = false }
}
onMounted(load)
</script>
<template>
<section class="mt-8 rounded-2xl border border-stone-200 bg-white p-6">
 <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
  <div><h2 class="text-xl font-semibold">Cargos personalizados</h2><p class="mt-2 text-sm text-slate-500">Configure os cargos disponíveis para convites e membros desta empresa.</p></div>
  <button class="secondary-button" :disabled="!canEdit" @click="add">Novo cargo</button>
 </div>
 <p v-if="error" role="alert" class="mb-4 text-sm text-red-700">{{error}}</p>
 <div class="grid gap-5 md:grid-cols-[14rem_1fr]">
  <div class="space-y-1">
   <button v-for="role in roles" :key="role.id" type="button" class="block w-full rounded-lg px-3 py-2 text-left text-sm" :class="selectedId===role.id&&!creating?'bg-slate-800 text-white':'hover:bg-stone-100'" @click="select(role)">{{role.name}}<span v-if="!role.is_active" class="ml-2 text-xs opacity-70">(Inativo)</span></button>
  </div>
  <form v-if="creating || selected" class="space-y-4" @submit.prevent="save">
   <label class="block text-sm font-semibold">Nome do cargo<input v-model="name" class="field mt-2" maxlength="100" required :disabled="!canEdit || selected?.code==='OWNER'"/></label>
   <label v-if="!creating && selected?.code!=='OWNER'" class="flex items-center gap-2 text-sm"><input v-model="active" type="checkbox" :disabled="!canEdit"/>Cargo ativo</label>
   <div><h3 class="mb-3 text-sm font-semibold">Permissões</h3>
    <div class="grid max-h-96 gap-2 overflow-y-auto sm:grid-cols-2">
     <label v-for="permission in catalog" :key="permission.key" class="flex items-start gap-2 rounded-lg border border-stone-100 p-2 text-xs">
      <input type="checkbox" :checked="selected?.code==='OWNER'||permissions.includes(permission.key)" :disabled="!canEdit||selected?.code==='OWNER'" @change="toggle(permission.key,($event.target as HTMLInputElement).checked)"/>{{permission.label}}
     </label>
    </div>
   </div>
   <button type="submit" class="primary-button w-auto" :disabled="!canEdit||busy||selected?.code==='OWNER'||!name.trim()">{{busy?'Salvando…':'Salvar cargo'}}</button>
  </form>
 </div>
</section>
</template>
