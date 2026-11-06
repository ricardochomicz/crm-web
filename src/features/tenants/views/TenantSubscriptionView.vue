<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import AsyncNotice from '@/components/ui/AsyncNotice.vue'
import { can } from '../types'
import { useTenantSubscription } from '../composables/useTenantSubscription'

const route = useRoute()
const tenantId = computed(() => String(route.params.tenantId))
const { tenant, subscription, loading, error, subscriptionError, metrics, load, loadSubscription } =
  useTenantSubscription(tenantId)
</script>
<template>
  <AppShell :tenant="tenant" title="Plano e assinatura" subtitle="Configurações">
    <header class="mb-8">
      <p class="eyebrow">CONFIGURAÇÕES</p>
      <h1 class="mt-3 text-3xl font-semibold tracking-tight">Plano e assinatura</h1>
      <p class="mt-3 text-sm text-slate-500">Acompanhe o plano e a capacidade da sua empresa.</p>
    </header>
    <AsyncNotice :loading="loading" :error="error" @retry="load" />
    <p
      v-if="!loading && tenant && !can(tenant, 'subscription.view')"
      role="status"
      class="rounded-xl border border-stone-200 bg-white p-6 text-sm text-slate-600"
    >
      Seu cargo não permite consultar a assinatura. Entre em contato com o proprietário.
    </p>
    <template v-if="!loading && tenant && can(tenant, 'subscription.view')">
      <AsyncNotice :error="subscriptionError" @retry="loadSubscription" />
      <template v-if="subscription"
        ><div
          v-if="!subscription.allows_operational_writes"
          role="status"
          class="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
        >
          Sua assinatura não permite alterações no momento. As informações continuam disponíveis
          para consulta.
        </div>
        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article
            v-for="metric in metrics"
            :key="metric.label"
            class="rounded-2xl border border-stone-200 bg-white p-6"
          >
            <h3 class="text-xs text-slate-500">{{ metric.label }}</h3>
            <p class="mt-4 text-2xl font-semibold tracking-tight">{{ metric.value }}</p>
            <p class="mt-2 text-xs text-slate-400">{{ metric.detail }}</p>
          </article>
        </div></template
      >
    </template></AppShell
  >
</template>
