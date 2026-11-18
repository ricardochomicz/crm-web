<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import AsyncNotice from '@/components/ui/AsyncNotice.vue'
import { onboardingSteps, useTenantOnboarding } from '../onboarding/useTenantOnboarding'

const route = useRoute()
const tenantId = computed(() => String(route.params.tenantId))
const { tenant, progress, loading, busy, error, completedCount, canComplete, nextStep, missingOperators, base, load, complete } = useTenantOnboarding(tenantId)
</script>

<template>
  <AppShell :tenant="tenant ?? undefined" title="Configuração inicial" subtitle="Prepare sua operação comercial">
    <header class="mb-7">
      <p class="eyebrow">PRIMEIROS PASSOS</p>
      <h1 class="mt-3 text-3xl font-semibold tracking-tight text-slate-900">Configure sua empresa</h1>
      <p class="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
        Configure as operadoras, comissões e classificações para começar a operar.
        Suas alterações são salvas em cada módulo; você pode retornar a qualquer momento.
      </p>
    </header>
    <AsyncNotice :loading="loading" :error="error" @retry="load" />
    <section v-if="!loading && progress" class="max-w-4xl space-y-5">
      <div class="rounded-2xl border border-stone-200 bg-white p-6">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <h2 class="font-semibold text-slate-900">{{ progress.completed ? 'Configuração concluída' : 'Seu progresso' }}</h2>
          <span class="text-sm font-semibold text-orange-700">{{ completedCount }} de {{ onboardingSteps.length }} etapas</span>
        </div>
        <div class="mt-4 h-2 overflow-hidden rounded-full bg-stone-100" role="progressbar" :aria-valuenow="completedCount" :aria-valuemax="onboardingSteps.length" aria-valuemin="0" aria-label="Progresso da configuração">
          <div class="h-full rounded-full bg-orange-500 transition-all" :style="{ width: (completedCount / onboardingSteps.length * 100) + '%' }" />
        </div>
      </div>
      <div v-if="nextStep && !progress.completed" class="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-orange-200 bg-orange-50 p-5">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wider text-orange-700">Próxima etapa</p>
          <h2 class="mt-1 font-semibold text-slate-900">{{ nextStep.title }}</h2>
          <p class="mt-1 text-sm text-slate-600">{{ nextStep.description }}</p>
        </div>
        <RouterLink :to="base + '/' + nextStep.path" class="primary-button w-auto">Continuar configuração</RouterLink>
      </div>
      <ol class="space-y-3">
        <li v-for="(step, index) in onboardingSteps" :key="step.key" class="flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-white p-5" :class="nextStep?.key === step.key ? 'border-orange-300' : 'border-stone-200'">
          <div class="flex items-center gap-4">
            <span class="flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold" :class="progress.steps[step.key].complete ? 'bg-emerald-50 text-emerald-700' : 'bg-orange-50 text-orange-700'">{{ progress.steps[step.key].complete ? '✓' : index + 1 }}</span>
            <div>
              <h3 class="font-semibold text-slate-900">{{ step.title }}</h3>
              <p class="mt-1 text-xs text-slate-500">{{ step.description }}</p>
              <template v-if="step.key === 'commissions' || step.key === 'classifications'">
                <p v-if="!progress.steps[step.key].complete && missingOperators(step.key).length" class="mt-2 text-xs font-medium text-amber-700">Pendentes: {{ missingOperators(step.key).join(', ') }}</p>
              </template>
            </div>
          </div>
          <RouterLink :to="base + '/' + step.path" class="secondary-button w-auto text-sm">{{ step.key === 'classifications' && !progress.steps[step.key].complete ? '+ Criar classificações' : progress.steps[step.key].complete ? 'Revisar' : 'Configurar' }}</RouterLink>
        </li>
      </ol>
      <div class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white p-5">
        <button type="button" class="secondary-button w-auto" :disabled="busy" @click="load">Atualizar progresso</button>
        <RouterLink v-if="progress.completed" :to="base" class="primary-button w-auto">Ir para o dashboard</RouterLink>
        <button v-else-if="tenant?.role === 'OWNER'" type="button" class="primary-button w-auto" :disabled="!canComplete || busy" @click="complete">{{ busy ? 'Concluindo…' : 'Concluir configuração' }}</button>
        <p v-else class="text-sm text-slate-500">Somente o proprietário pode concluir a configuração.</p>
      </div>
    </section>
  </AppShell>
</template>
