<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import AsyncNotice from '@/components/ui/AsyncNotice.vue'
import { useTenantOperatorsPage } from '../composables/useTenantOperatorsPage'

const route = useRoute()
const tenantId = computed(() => String(route.params.tenantId))
const { tenant, operators, selected, loading, error, busy, writable, dirty, load, toggle, save } =
  useTenantOperatorsPage(tenantId)
</script>
<template>
  <AppShell :tenant="tenant" title="Minhas operadoras" subtitle="Configurações">
    <header class="mb-7">
      <p class="eyebrow">PARCERIAS COMERCIAIS</p>
      <h1 class="mt-3 text-3xl font-semibold">Minhas operadoras</h1>
      <p class="mt-2 text-sm text-slate-500">Escolha uma ou várias operadoras com as quais sua empresa trabalha. Essa seleção será usada nos próximos módulos de produtos e comissões.</p>
    </header>
    <AsyncNotice :loading="loading" :error="error" @retry="load" />
    <section v-if="!loading && !error" class="overflow-hidden rounded-2xl border border-stone-200 bg-white">
      <p v-if="!writable" class="mx-5 mt-5 text-sm text-amber-700">A assinatura não permite alterações no momento.</p>
      <p v-if="!operators.length" class="px-5 py-8 text-center text-sm text-slate-500">Nenhuma operadora disponível.</p>
      <div v-for="operator in operators" :key="operator.id" class="flex items-center justify-between gap-4 border-b border-stone-100 px-5 py-4 transition-colors hover:bg-stone-50/70">
        <div>
          <p class="font-semibold text-slate-800">{{ operator.name }}</p>
          <p v-if="!operator.is_active" class="text-xs text-amber-700">Inativa no catálogo</p>
        </div>
        <label class="flex items-center gap-3 text-sm text-slate-600">
          <span>{{ selected.includes(operator.id) ? 'Selecionada' : 'Selecionar' }}</span>
          <input type="checkbox" class="size-5 accent-orange-600" :checked="selected.includes(operator.id)" :disabled="!writable || busy || (!operator.is_active && !operator.selected)" @change="toggle(operator.id, ($event.target as HTMLInputElement).checked)" />
        </label>
      </div>
      <div class="flex flex-wrap items-center justify-between gap-4 bg-stone-50/50 px-5 py-4">
        <p class="text-sm text-slate-500">{{ selected.length }} operadora(s) selecionada(s)</p>
        <button class="primary-button w-auto" :disabled="!writable || busy || loading || !dirty" @click="save">{{ busy ? 'Salvando…' : 'Salvar operadoras' }}</button>
      </div>
    </section>
  </AppShell>
</template>
