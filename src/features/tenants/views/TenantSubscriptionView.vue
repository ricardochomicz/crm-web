<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import AsyncNotice from '@/components/ui/AsyncNotice.vue'
import { tenantApi } from '../api'
import { can, type Tenant, type Subscription } from '../types'
import { dateLabel, errorMessage } from '@/lib/feedback'
const route = useRoute()
const tenant = ref<Tenant>()
const subscription = ref<Subscription>()
const loading = ref(true)
const error = ref('')
const subscriptionError = ref('')
async function loadSubscription() {
  if (!can(tenant.value, 'subscription.view') || !tenant.value) return
  subscriptionError.value = ''
  subscription.value = undefined
  try {
    subscription.value = (await tenantApi.subscription(tenant.value.id)).data
  } catch (failure) {
    subscriptionError.value = errorMessage(failure)
  }
}
async function load() {
  loading.value = true
  error.value = ''
  tenant.value = undefined
  subscription.value = undefined
  try {
    tenant.value = (await tenantApi.show(String(route.params.tenantId))).data
    await loadSubscription()
  } catch (failure) {
    error.value = errorMessage(failure)
  } finally {
    loading.value = false
  }
}
onMounted(load)
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
            v-for="metric in [
              {
                label: 'Pessoas na empresa',
                value: subscription.usage.users,
                detail: `de ${subscription.limits.users} vagas no plano`,
              },
              {
                label: 'Convites reservados',
                value: subscription.usage.reserved_invitations,
                detail: 'aguardando aceite',
              },
              {
                label: 'Vagas disponíveis',
                value: subscription.remaining.users,
                detail: 'para novas conexões',
              },
              {
                label: 'Plano atual',
                value: subscription.plan.name ?? 'Não informado',
                detail:
                  subscription.status === 'TRIALING'
                    ? `Teste até ${dateLabel(subscription.trial_ends_at)}`
                    : ({
                        ACTIVE: 'Assinatura ativa',
                        PAST_DUE: 'Pagamento pendente',
                        CANCELLED: 'Assinatura cancelada',
                      }[subscription.status] ?? subscription.status),
              },
            ]"
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
