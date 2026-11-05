<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import AsyncNotice from '@/components/ui/AsyncNotice.vue'
import { tenantApi } from '@/features/tenants/api'
import type { Tenant } from '@/features/tenants/types'
import { operatorsApi, type TenantOperator } from '../api'
import { errorMessage } from '@/lib/feedback'
import { toast } from '@/services/toast'

const route = useRoute()
const tenantId = computed(() => String(route.params.tenantId))
const tenant = ref<Tenant>()
const operators = ref<TenantOperator[]>([])
const selected = ref<number[]>([])
const loading = ref(true)
const error = ref('')
const busy = ref(false)
const writable = computed(() => !!tenant.value?.access?.allows_operational_writes)

async function load() {
  const id = tenantId.value
  loading.value = true
  error.value = ''
  try {
    const [company, list] = await Promise.all([tenantApi.show(id), operatorsApi.tenantList(id)])
    if (tenantId.value !== id) return
    tenant.value = company.data
    operators.value = list.data
    selected.value = list.data.filter((item) => item.selected).map((item) => item.id)
  } catch (failure) {
    if (tenantId.value === id) error.value = errorMessage(failure)
  } finally {
    if (tenantId.value === id) loading.value = false
  }
}

function toggle(id: number, checked: boolean) {
  selected.value = checked ? [...selected.value, id] : selected.value.filter((value) => value !== id)
}

async function save() {
  if (!writable.value || busy.value) return
  busy.value = true
  try {
    await operatorsApi.tenantSave(tenantId.value, selected.value)
    toast.success('Operadoras da empresa atualizadas.')
    await load()
  } catch (failure) {
    toast.error(errorMessage(failure))
  } finally {
    busy.value = false
  }
}
watch(tenantId, () => { void load() }, { immediate: true })
</script>

<template>
  <AppShell :tenant="tenant" title="Minhas operadoras" subtitle="Configurações">
    <header class="mb-8">
      <p class="eyebrow">PARCERIAS COMERCIAIS</p>
      <h1 class="mt-3 text-3xl font-semibold">Minhas operadoras</h1>
      <p class="mt-3 text-sm text-slate-500">Escolha uma ou várias operadoras com as quais sua empresa trabalha. Essa seleção será usada nos próximos módulos de produtos e comissões.</p>
    </header>
    <AsyncNotice :loading="loading" :error="error" @retry="load" />
    <section v-if="!loading && !error" class="rounded-2xl border border-stone-200 bg-white p-6">
      <p v-if="!writable" class="mb-5 text-sm text-amber-700">A assinatura não permite alterações no momento.</p>
      <p v-if="!operators.length" class="text-sm text-slate-500">Nenhuma operadora disponível.</p>
      <div v-for="operator in operators" :key="operator.id" class="flex items-center justify-between gap-4 border-b border-stone-100 py-4">
        <div>
          <p class="font-semibold text-slate-800">{{ operator.name }}</p>
          <p v-if="!operator.is_active" class="text-xs text-amber-700">Inativa no catálogo</p>
        </div>
        <label class="flex items-center gap-3 text-sm text-slate-600">
          <span>{{ selected.includes(operator.id) ? 'Selecionada' : 'Selecionar' }}</span>
          <input type="checkbox" class="size-5 accent-orange-600" :checked="selected.includes(operator.id)" :disabled="!writable || busy || (!operator.is_active && !operator.selected)" @change="toggle(operator.id, ($event.target as HTMLInputElement).checked)" />
        </label>
      </div>
      <div class="mt-6 flex flex-wrap items-center justify-between gap-4">
        <p class="text-sm text-slate-500">{{ selected.length }} operadora(s) selecionada(s)</p>
        <button class="primary-button w-auto" :disabled="!writable || busy" @click="save">{{ busy ? 'Salvando…' : 'Salvar operadoras' }}</button>
      </div>
    </section>
  </AppShell>
</template>
