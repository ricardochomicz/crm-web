<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import ProductivityDashboard from '../components/ProductivityDashboard.vue'
import ProductivityFilters from '../components/ProductivityFilters.vue'
import { useProductivity } from '../composables/useProductivity'
import { useTenantDashboard } from '@/features/tenants/composables/useTenantDashboard'

const route = useRoute()
const tenantId = computed(() => String(route.params.tenantId ?? ''))
const { tenant } = useTenantDashboard(tenantId)
const { from, to, appliedPeriod, consultantId, data, loading, error, consultants, search, clear } = useProductivity(tenantId)
</script>

<template>
  <AppShell :tenant="tenant" title="Produtividade comercial" subtitle="Gestão de consultores">
    <div class="space-y-6">
      <ProductivityFilters v-model:from="from" v-model:to="to" v-model:consultant-id="consultantId" :consultants="consultants" :loading="loading" @search="search" @clear="clear" />
      <p v-if="error" role="alert" class="text-sm text-red-700">{{ error }}</p>
      <p v-if="loading" class="text-sm text-slate-500">Carregando indicadores…</p>
      <ProductivityDashboard v-else-if="data" :result="data" :tenant-id="tenantId" :from="appliedPeriod.from" :to="appliedPeriod.to" />
    </div>
  </AppShell>
</template>
