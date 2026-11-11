<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import ProductivityDashboard from '../components/ProductivityDashboard.vue'
import { useProductivity } from '../composables/useProductivity'
import { useTenantDashboard } from '@/features/tenants/composables/useTenantDashboard'

const route = useRoute()
const tenantId = computed(() => String(route.params.tenantId ?? ''))
const { tenant } = useTenantDashboard(tenantId)
const { from, to, consultantId, data, loading, error, rows, search, clear } = useProductivity(tenantId)
</script>

<template>
  <AppShell :tenant="tenant" title="Produtividade comercial" subtitle="Gestão de consultores">
    <div class="space-y-6">
      <form class="flex flex-wrap items-end gap-3 rounded-xl border border-stone-200 bg-white p-4" @submit.prevent="search">
        <label class="text-sm text-slate-700">De <input v-model="from" type="date" class="mt-1 block rounded-lg border border-stone-300 px-3 py-2" /></label>
        <label class="text-sm text-slate-700">Até <input v-model="to" type="date" class="mt-1 block rounded-lg border border-stone-300 px-3 py-2" /></label>
        <label class="text-sm text-slate-700">Consultor
          <select v-model="consultantId" class="mt-1 block rounded-lg border border-stone-300 px-3 py-2">
            <option value="">Todos</option>
            <option v-for="person in rows" :key="person.id" :value="person.id">{{ person.name }}</option>
          </select>
        </label>
        <button type="submit" class="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white" :disabled="loading">Buscar</button>
        <button type="button" class="rounded-lg border border-stone-300 px-4 py-2 text-sm" @click="clear">Limpar filtros</button>
      </form>
      <p v-if="error" role="alert" class="text-sm text-red-700">{{ error }}</p>
      <p v-if="loading" class="text-sm text-slate-500">Carregando indicadores…</p>
      <ProductivityDashboard v-else-if="data" :result="data" />
    </div>
  </AppShell>
</template>
