<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import AsyncNotice from '@/components/ui/AsyncNotice.vue'
import DashboardMetricCard from '../components/DashboardMetricCard.vue'
import { useTenantDashboard } from '../composables/useTenantDashboard'
import { can } from '../types'

const route = useRoute()
const tenantId = computed(() => String(route.params.tenantId))
const { tenant, loading, error, load } = useTenantDashboard(tenantId)
const base = computed(() => `/empresas/${tenantId.value}`)
const profile = computed(() => {
  if (tenant.value?.role === 'CONSULTANT') return 'consultant'
  if (tenant.value?.role === 'MANAGER') return 'supervisor'
  return 'manager'
})
const config = computed(() => {
  if (profile.value === 'consultant') return {
    eyebrow: 'Minha operação',
    title: 'Seu dia comercial, em um só lugar.',
    description: 'Acompanhe sua carteira, negociações e próximas atividades.',
    metrics: ['Minhas vendas', 'Oportunidades abertas', 'Pedidos em andamento', 'Atividades pendentes'],
  }
  if (profile.value === 'supervisor') return {
    eyebrow: 'Gestão da equipe',
    title: 'Prioridades da operação comercial.',
    description: 'Acompanhe o desempenho da equipe e os pontos que exigem atenção.',
    metrics: ['Vendas da equipe', 'Meta da equipe', 'Pedidos em andamento', 'Clientes em atenção'],
  }
  return {
    eyebrow: 'Visão gerencial',
    title: 'Resultados claros. Decisões melhores.',
    description: 'Uma visão estratégica dos resultados e da operação comercial.',
    metrics: ['Receita comercial', 'Vendas realizadas', 'Clientes ativos', 'Conversão comercial'],
  }
})
const shortcuts = computed(() => [
  { label: 'Clientes', description: 'Cadastros e relacionamento', path: 'clientes', permission: 'clients.view' },
  { label: 'Oportunidades', description: 'Negociações e propostas', path: 'oportunidades', permission: 'opportunities.view' },
  { label: 'Pedidos', description: 'Acompanhamento comercial', path: 'pedidos', permission: 'orders.view' },
  { label: 'Agenda', description: 'Compromissos e atividades', path: 'agenda', permission: 'calendar.view' },
  { label: 'Carteira', description: 'Contratos e clientes', path: 'carteira', permission: 'clients.view' },
  { label: 'Metas', description: 'Objetivos comerciais', path: 'metas-comerciais', permission: 'commercial_goals.view' },
  { label: 'Equipe', description: 'Consultores e membros', path: 'equipe', permission: 'members.view' },
  { label: 'Comissões', description: 'Resultados e remuneração', path: 'comissoes-equipe', permission: 'team_commissions.view' },
].filter(item => can(tenant.value, item.permission)))
</script>

<template>
  <AppShell :tenant="tenant" :title="tenant?.name ?? 'Dashboard'" subtitle="Dashboard comercial">
    <AsyncNotice :loading="loading" :error="error" @retry="load" />
    <div v-if="!loading && tenant" class="space-y-7">
      <header class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p class="text-xs font-semibold uppercase tracking-widest text-orange-600">{{ config.eyebrow }}</p>
          <h1 class="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">{{ config.title }}</h1>
          <p class="mt-2 text-sm text-slate-500">{{ config.description }}</p>
        </div>
        <span class="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs text-slate-500">Dados do seu espaço</span>
      </header>

      <section aria-label="Indicadores principais" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardMetricCard v-for="metric in config.metrics" :key="metric" :label="metric" />
      </section>

      <div class="grid gap-4 xl:grid-cols-5">
        <section class="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm xl:col-span-3">
          <div class="flex items-center justify-between gap-3">
            <h2 class="text-sm font-semibold text-slate-900">Evolução comercial</h2>
            <span class="text-xs text-slate-400">Em preparação</span>
          </div>
          <div class="mt-6 flex min-h-52 flex-col items-center justify-center rounded-xl border border-dashed border-stone-200 bg-stone-50/60 p-6 text-center">
            <p class="text-sm font-medium text-slate-700">Gráfico aguardando indicadores consolidados</p>
            <p class="mt-2 max-w-sm text-xs leading-5 text-slate-500">Os resultados serão exibidos após a integração segura com os dados deste espaço.</p>
          </div>
        </section>
        <section class="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm xl:col-span-2">
          <h2 class="text-sm font-semibold text-slate-900">Prioridades</h2>
          <p class="mt-2 text-xs leading-5 text-slate-500">Pedidos pendentes, atividades e alertas relevantes aparecerão aqui conforme seu nível de acesso.</p>
          <div class="mt-6 rounded-xl bg-stone-50 p-5 text-sm text-slate-500">Nenhum indicador conectado ainda.</div>
        </section>
      </div>

      <section class="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <div>
          <h2 class="text-sm font-semibold text-slate-900">Acesso rápido</h2>
          <p class="mt-1 text-xs text-slate-500">Continue seu trabalho sem perder tempo.</p>
        </div>
        <div v-if="shortcuts.length" class="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <RouterLink v-for="item in shortcuts" :key="item.path" :to="`${base}/${item.path}`" class="group rounded-xl border border-stone-200 p-4 transition hover:border-orange-300 hover:bg-orange-50 focus-visible:outline-2 focus-visible:outline-orange-600">
            <span class="flex items-center justify-between text-sm font-semibold text-slate-800">{{ item.label }} <span aria-hidden="true" class="text-slate-400 transition group-hover:translate-x-1 group-hover:text-orange-600">→</span></span>
            <span class="mt-1 block text-xs text-slate-500">{{ item.description }}</span>
          </RouterLink>
        </div>
        <p v-else class="mt-5 text-sm text-slate-500">Nenhum atalho disponível para as permissões atuais.</p>
      </section>
    </div>
  </AppShell>
</template>
