<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import AsyncNotice from '@/components/ui/AsyncNotice.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import TenantNavigation from '../components/TenantNavigation.vue'
import { tenantApi } from '../api'
import { roleLabels, type Tenant, type Subscription } from '../types'
import { dateLabel, errorMessage } from '@/lib/feedback'
const route = useRoute()
const tenant = ref<Tenant>()
const subscription = ref<Subscription>()
const loading = ref(true)
const error = ref('')
const subscriptionError = ref('')
async function loadSubscription() {
  if (!tenant.value || tenant.value.role !== 'OWNER') return
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
  <AppShell :title="tenant?.name ?? 'Visão geral'" subtitle="Seu espaço de trabalho">
    <div class="mb-8 flex flex-wrap items-center justify-between gap-4">
      <div>
        <p class="eyebrow">VISÃO GERAL</p>
        <h1 class="mt-3 text-3xl font-semibold tracking-tight">
          {{ tenant?.name ?? 'Abrindo sua empresa…' }}
        </h1>
        <p v-if="tenant" class="mt-3 text-sm text-slate-500">
          Seu acesso: {{ roleLabels[tenant.role] }}. Tudo começa com uma equipe conectada.
        </p>
      </div>
      <RouterLink to="/empresas" class="secondary-button"
        >Trocar empresa<AppIcon class="size-4"
      /></RouterLink>
    </div>
    <TenantNavigation v-if="tenant" :tenant="tenant" />
    <AsyncNotice :loading="loading" :error="error" @retry="load" />
    <template v-if="!loading && tenant">
      <section
        class="mb-7 flex flex-wrap items-center justify-between gap-6 rounded-3xl bg-[#202a26] p-7 text-white sm:p-9"
      >
        <div>
          <span
            class="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1 text-[10px] font-semibold"
            ><span class="size-1.5 rounded-full bg-emerald-400" />EMPRESA ATIVA</span
          >
          <h2 class="text-2xl font-medium tracking-tight">Um espaço. Muitas possibilidades.</h2>
          <p class="mt-3 max-w-lg text-sm leading-6 text-slate-300">
            Sua empresa está pronta. Aqui você acompanha as informações do seu acesso e, como
            proprietário, a capacidade da assinatura.
          </p>
        </div>
        <span
          class="hidden size-20 items-center justify-center rounded-3xl border border-white/10 bg-white/5 text-orange-300 sm:flex"
          ><AppIcon name="grid" class="size-9"
        /></span>
      </section>
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
      <RouterLink
        v-if="tenant.role === 'OWNER'"
        :to="`/empresas/${tenant.id}/equipe`"
        class="mt-7 flex items-center justify-between gap-5 rounded-2xl border border-orange-200 bg-orange-50 p-6 transition hover:bg-orange-100"
        ><div>
          <h2 class="text-sm font-semibold text-orange-900">Sua próxima conexão começa aqui.</h2>
          <p class="mt-2 text-xs leading-6 text-orange-800">
            Convide pessoas, acompanhe os aceites e gerencie os acessos da equipe.
          </p>
        </div>
        <span class="flex shrink-0 items-center gap-2 text-xs font-semibold text-orange-800"
          >Gerenciar equipe<AppIcon class="size-4" /></span
      ></RouterLink>
      <section class="mt-7 rounded-2xl border border-stone-200 bg-white p-6">
        <h2 class="text-base font-semibold">Sobre este espaço</h2>
        <dl class="mt-5 grid gap-5 text-sm sm:grid-cols-3">
          <div>
            <dt class="text-xs text-slate-400">Empresa</dt>
            <dd class="mt-1 font-medium">{{ tenant.name }}</dd>
          </div>
          <div>
            <dt class="text-xs text-slate-400">Tipo de cadastro</dt>
            <dd class="mt-1">{{ tenant.type === 'PJ' ? 'Pessoa jurídica' : 'Pessoa física' }}</dd>
          </div>
          <div>
            <dt class="text-xs text-slate-400">Seu papel</dt>
            <dd class="mt-1">{{ roleLabels[tenant.role] }}</dd>
          </div>
        </dl>
        <p
          v-if="tenant.role !== 'OWNER'"
          class="mt-6 border-t border-stone-100 pt-4 text-xs leading-6 text-slate-500"
        >
          A assinatura e as vagas são gerenciadas pelo proprietário da empresa.
        </p>
      </section>
    </template>
  </AppShell>
</template>
