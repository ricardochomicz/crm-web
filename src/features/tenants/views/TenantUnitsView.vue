<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import AsyncNotice from '@/components/ui/AsyncNotice.vue'
import FormField from '@/components/ui/FormField.vue'
import UnitAssignmentsDrawer from '../components/UnitAssignmentsDrawer.vue'
import { tenantApi } from '../api'
import { can, type Tenant } from '../types'
import { unitsApi, type TenantUnit, type UnitList } from '../units'
import { errorMessage } from '@/lib/feedback'
import { toast } from '@/services/toast'
import { ApiError } from '@/lib/http'
const route = useRoute()
const tenantId = computed(() => String(route.params.tenantId))
const tenant = ref<Tenant>()
const result = ref<UnitList>()
const loading = ref(true)
const loadError = ref('')
const busy = ref(false)
const editing = ref<string | null>(null)
const assigning = ref<TenantUnit>()
const errors = ref<Record<string, string>>({})
const form = reactive({ name: '', email: '', phone: '', address: '', city: '', state: '' })
const writable = computed(
  () => result.value?.meta.can_manage && tenant.value?.access?.allows_operational_writes,
)
async function load() {
  const id = tenantId.value
  loading.value = true
  loadError.value = ''
  editing.value = null
  assigning.value = undefined
  try {
    const [company, units] = await Promise.all([tenantApi.show(id), unitsApi.list(id)])
    if (id !== tenantId.value) return
    tenant.value = company.data
    result.value = units
  } catch (failure) {
    if (id === tenantId.value) loadError.value = errorMessage(failure)
  } finally {
    if (id === tenantId.value) loading.value = false
  }
}
function edit(unit?: TenantUnit) {
  editing.value = unit?.id ?? ''
  assigning.value = undefined
  Object.assign(form, {
    name: unit?.name ?? '',
    email: unit?.email ?? '',
    phone: unit?.phone ?? '',
    address: unit?.address ?? '',
    city: unit?.city ?? '',
    state: unit?.state ?? '',
  })
  errors.value = {}
}
function assign(unit: TenantUnit) {
  assigning.value = unit
  editing.value = null
  errors.value = {}
}
async function save() {
  if (busy.value || !writable.value) return
  const id = tenantId.value
  busy.value = true
  errors.value = {}
  try {
    const data = {
      name: form.name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      address: form.address.trim() || null,
      city: form.city.trim() || null,
      state: form.state || null,
    }
    if (editing.value) await unitsApi.update(id, editing.value, data)
    else await unitsApi.create(id, data)
    if (id !== tenantId.value) return
    await load()
    toast.success('Unidade salva com sucesso.')
  } catch (failure) {
    if (id !== tenantId.value) return
    toast.error(errorMessage(failure))
    if (failure instanceof ApiError)
      errors.value = Object.fromEntries(
        Object.entries(failure.errors).map(([key, values]) => [
          key,
          values[0] ?? 'Confira este campo.',
        ]),
      )
  } finally {
    busy.value = false
  }
}
async function refreshCounts() {
  const id = tenantId.value
  try {
    const updated = await unitsApi.list(id)
    if (id === tenantId.value) result.value = updated
  } catch (failure) {
    if (id === tenantId.value) toast.error(errorMessage(failure))
  }
}
watch(
  tenantId,
  () => {
    result.value = undefined
    tenant.value = undefined
        void load()
  },
  { immediate: true },
)
</script>
<template>
  <AppShell :tenant="tenant" title="Matriz e filiais" subtitle="Configurações">
    <header class="mb-8 flex flex-wrap items-start justify-between gap-5">
      <div>
        <p class="eyebrow">SUA ORGANIZAÇÃO</p>
        <h1 class="mt-3 text-3xl font-semibold tracking-tight">Matriz e filiais</h1>
        <p class="mt-3 text-sm text-slate-500">
          Unidades da mesma empresa, com uma assinatura e limites compartilhados.
        </p>
      </div>
      <button
        v-if="writable && !loading"
        class="primary-button w-auto"
        :disabled="busy"
        @click="edit()"
      >
        Nova filial
      </button>
    </header>
    <AsyncNotice :loading="loading" :error="loadError" @retry="load" />
    <template v-if="!loading && !loadError && result">
      <p
        v-if="result.meta.can_manage && !writable"
        class="mb-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-900"
      >
        A assinatura atual permite apenas consultar as unidades.
      </p>
      <form
        v-if="editing !== null && writable"
        class="mb-8 rounded-2xl border border-stone-200 bg-white p-6"
        @submit.prevent="save()"
      >
        <fieldset :disabled="busy" class="grid gap-5">
          <legend class="mb-5 text-lg font-semibold">
            {{ editing ? 'Editar unidade' : 'Nova filial' }}
          </legend>
          <FormField
            id="unit-name"
            v-model="form.name"
            label="Nome da unidade"
            required
            maxlength="180"
            :error="errors.name"
          />
          <div class="grid gap-5 sm:grid-cols-2">
            <FormField
              id="unit-email"
              v-model="form.email"
              label="E-mail (opcional)"
              type="email"
              maxlength="254"
              :error="errors.email"
            /><FormField
              id="unit-phone"
              v-model="form.phone"
              label="Telefone (opcional)"
              type="tel"
              maxlength="20"
              :error="errors.phone"
            />
          </div>
          <FormField
            id="unit-address"
            v-model="form.address"
            label="Endereço (opcional)"
            maxlength="500"
            :error="errors.address"
          />
          <div class="grid gap-5 sm:grid-cols-2">
            <FormField id="unit-city" v-model="form.city" label="Cidade (opcional)" maxlength="120" :error="errors.city" />
            <div class="grid gap-2">
              <label for="unit-state" class="text-sm font-semibold">Estado (UF)</label>
              <select id="unit-state" v-model="form.state" class="field">
                <option value="">Selecione</option>
                <option v-for="uf in ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']" :key="uf" :value="uf">{{ uf }}</option>
              </select>
              <p v-if="errors.state" class="text-xs text-red-600">{{ errors.state }}</p>
            </div>
          </div>
          <div class="flex justify-end gap-3">
            <button type="button" class="secondary-button" @click="editing = null">Cancelar</button
            ><button class="primary-button w-auto" type="submit">
              {{ busy ? 'Salvando…' : 'Salvar unidade' }}
            </button>
          </div>
        </fieldset>
      </form>
      <p
        v-if="!result.data.length"
        class="rounded-2xl border border-stone-200 bg-white p-6 text-sm text-slate-500"
      >
        Você ainda não possui unidades vinculadas.
      </p>
      <div class="grid gap-5 lg:grid-cols-2">
        <article
          v-for="unit in result.data"
          :key="unit.id"
          class="rounded-2xl border border-stone-200 bg-white p-6"
        >
          <span class="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">{{
            unit.is_headquarters ? 'Matriz' : 'Filial'
          }}</span>
          <h2 class="mt-4 text-xl font-semibold">{{ unit.name }}</h2>
          <dl class="mt-5 grid gap-3 text-sm">
            <div>
              <dt class="text-xs text-slate-400">E-mail</dt>
              <dd>{{ unit.email || 'Não informado' }}</dd>
            </div>
            <div>
              <dt class="text-xs text-slate-400">Telefone</dt>
              <dd>{{ unit.phone || 'Não informado' }}</dd>
            </div>
            <div>
              <dt class="text-xs text-slate-400">Cidade / Estado</dt>
              <dd>{{ [unit.city, unit.state].filter(Boolean).join(' / ') || 'Não informado' }}</dd>
            </div>
            <div>
              <dt class="text-xs text-slate-400">Endereço</dt>
              <dd class="break-words">{{ unit.address || 'Não informado' }}</dd>
            </div>
          </dl>
          <p class="mt-5 text-xs text-slate-500">
            {{ unit.members_count }} membros · {{ unit.teams_count }} equipes
          </p>
          <div v-if="writable" class="mt-5 flex flex-wrap gap-3">
            <button class="secondary-button" :disabled="busy" @click="edit(unit)">Editar</button
            ><button class="secondary-button" :disabled="busy" @click="assign(unit)">
              Membros e equipes
            </button>
          </div>
        </article>
      </div>
    </template>
    <UnitAssignmentsDrawer
      v-if="assigning && writable"
      :tenant-id="tenantId"
      :unit="assigning"
      :can-create-team="!!tenant?.access?.allows_operational_writes && can(tenant, 'teams.create')"
      :can-manage-team-members="!!tenant?.access?.allows_operational_writes && can(tenant, 'members.team')"
      @close="assigning = undefined"
      @changed="refreshCounts"
    />
  </AppShell>
</template>
