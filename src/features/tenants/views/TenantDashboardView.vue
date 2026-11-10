<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { opportunitiesApi, type FunnelOverview, type CommercialOverview } from '@/features/opportunities/api'
import { errorMessage } from '@/lib/feedback'
import { useRoute } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import AsyncNotice from '@/components/ui/AsyncNotice.vue'
import DashboardMetricCard from '../components/DashboardMetricCard.vue'
import { useTenantDashboard } from '../composables/useTenantDashboard'
import { can } from '../types'

const route = useRoute()
const tenantId = computed(() => String(route.params.tenantId))
const { tenant, loading, error, load } = useTenantDashboard(tenantId)
const overview = ref<CommercialOverview | null>(null)
const funnel = ref<FunnelOverview | null>(null)
const funnelLoading = ref(false)
const funnelError = ref('')
let funnelRequest = 0
const overviewLoading = ref(false)
const overviewError = ref('')
const period = ref<'month' | 'quarter'>('month')
let overviewRequest = 0
const dateRange = computed(() => {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const startMonth = period.value === 'quarter' ? Math.floor(month / 3) * 3 : month
  const endMonth = period.value === 'quarter' ? startMonth + 3 : month + 1
  const iso = (date: Date) => [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-')
  return { from: iso(new Date(year, startMonth, 1)), to: iso(new Date(year, endMonth, 0)) }
})
const canViewOpportunities = computed(() => can(tenant.value, 'opportunities.view'))
async function loadOverview() {
  const id = tenantId.value
  const request = ++overviewRequest
  overview.value = null
  overviewError.value = ''
  if (!tenant.value || !canViewOpportunities.value) return
  overviewLoading.value = true
  try {
    const response = await opportunitiesApi.overview(id, dateRange.value.from, dateRange.value.to)
    if (request === overviewRequest) overview.value = response.data
  } catch (failure) {
    if (request === overviewRequest) overviewError.value = errorMessage(failure)
  } finally {
    if (request === overviewRequest) overviewLoading.value = false
  }
}
async function loadFunnel() {
  const id = tenantId.value
  const request = ++funnelRequest
  funnel.value = null
  funnelError.value = ''
  if (!tenant.value || !canViewOpportunities.value) return
  funnelLoading.value = true
  try {
    const response = await opportunitiesApi.funnelOverview(id)
    if (request === funnelRequest) funnel.value = response.data
  } catch (failure) {
    if (request === funnelRequest) funnelError.value = errorMessage(failure)
  } finally {
    if (request === funnelRequest) funnelLoading.value = false
  }
}
watch([tenantId, tenant], () => { void loadFunnel() }, { immediate: true })
const funnelMax = computed(() => Math.max(1, ...(funnel.value?.stages.map(stage => stage.count) ?? [])))
const funnelTotal = computed(() => (funnel.value?.stages.reduce((sum, stage) => sum + stage.count, 0) ?? 0) + (funnel.value?.unassigned.count ?? 0))
watch([tenantId, period, tenant], () => { void loadOverview() }, { immediate: true })
const currency = (value: string | number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value))
const base = computed(() => `/empresas/${tenantId.value}`)
const profile = computed(() => {
  if (tenant.value?.role === 'CONSULTANT') return 'consultant'
  if (tenant.value?.role === 'MANAGER') return 'supervisor'
  return 'manager'
})
const config = computed(() => {
  if (profile.value === 'consultant') return {
    eyebrow: 'Minha operação', title: 'Seu dia comercial, em um só lugar.',
    description: 'Negociações, resultados e prioridades da sua carteira.',
  }
  if (profile.value === 'supervisor') return {
    eyebrow: 'Gestão da equipe', title: 'Prioridades da operação comercial.',
    description: 'Negociações e resultados da equipe sob sua responsabilidade.',
  }
  return {
    eyebrow: 'Visão gerencial', title: 'Resultados claros. Decisões melhores.',
    description: 'Uma visão estratégica das oportunidades comerciais.',
  }
})
const metrics = computed(() => [
  { label: 'Negociações ganhas', value: overview.value ? String(overview.value.won.count) : '—', detail: 'Encerradas no período' },
  { label: 'Valor mensal ganho', value: overview.value ? currency(overview.value.won.monthly) : '—', detail: 'Valor mensal estimado das oportunidades ganhas' },
  { label: 'Oportunidades abertas', value: overview.value ? String(overview.value.open_period.count) : '—', detail: 'Previsão de fechamento no período' },
  { label: 'Taxa de conversão', value: overview.value?.conversion_rate != null ? `${overview.value.conversion_rate.toLocaleString('pt-BR')}%` : '—', detail: 'Ganhas / (ganhas + perdidas) no período' },
])
const pipeline = computed(() => [
  { label: 'Abertas no período', count: overview.value?.open_period.count ?? 0, amount: overview.value?.open_period.monthly ?? '0' },
  { label: 'Atrasadas', count: overview.value?.overdue.count ?? 0, amount: overview.value?.overdue.monthly ?? '0' },
  { label: 'Previstas após o período', count: overview.value?.future.count ?? 0, amount: overview.value?.future.monthly ?? '0' },
  { label: 'Sem previsão', count: overview.value?.unscheduled.count ?? 0, amount: overview.value?.unscheduled.monthly ?? '0' },
])
const maxPipeline = computed(() => Math.max(1, ...pipeline.value.map(item => item.count)))
const shortcuts = computed(() => [
  { label: 'Clientes', description: 'Cadastros e relacionamento', path: 'clientes', permission: 'clients.view' },
  { label: 'Oportunidades', description: 'Negociações e propostas', path: 'oportunidades', permission: 'opportunities.view' },
  { label: 'Pedidos', description: 'Acompanhamento comercial', path: 'pedidos', permission: 'opportunities.view' },
  { label: 'Agenda', description: 'Compromissos e atividades', path: 'agenda', permission: 'calendar.view' },
  { label: 'Carteira', description: 'Contratos e clientes', path: 'carteira', permission: 'clients.view' },
  { label: 'Metas', description: 'Objetivos comerciais', path: 'metas-comerciais', permission: 'commercial-goals.view' },
  { label: 'Equipe', description: 'Consultores e membros', path: 'equipe', permission: 'members.view' },
  { label: 'Comissões', description: 'Resultados e remuneração', path: 'comissoes-equipe', permission: 'team-commissions.view' },
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
        <label class="flex items-center gap-2 text-xs text-slate-500">Período
          <select v-model="period" class="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-slate-700 focus-visible:outline-2 focus-visible:outline-orange-600">
            <option value="month">Este mês</option>
            <option value="quarter">Este trimestre</option>
          </select>
        </label>
      </header>

      <section v-if="!canViewOpportunities" class="rounded-2xl border border-stone-200 bg-white p-6 text-sm text-slate-500">
        Os indicadores comerciais não estão disponíveis para as permissões atuais.
      </section>
      <template v-else>
        <div v-if="overviewError" role="alert" class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <span>{{ overviewError }}</span><button type="button" class="font-semibold underline" @click="loadOverview">Tentar novamente</button>
        </div>
        <section aria-label="Indicadores comerciais" :aria-busy="overviewLoading" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardMetricCard v-for="metric in metrics" :key="metric.label" v-bind="metric" />
        </section>
        <div class="grid gap-4 xl:grid-cols-5">
          <section class="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm xl:col-span-3">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 class="text-base font-semibold text-slate-900">Funil de vendas</h2>
                <p class="mt-1 text-xs text-slate-500">Oportunidades abertas por etapa · posição atual, sem filtro de período</p>
              </div>
              <RouterLink :to="`${base}/oportunidades`" class="text-xs font-semibold text-orange-700 hover:underline">Abrir negociações →</RouterLink>
            </div>
            <div v-if="funnelLoading" class="mt-6 h-56 animate-pulse rounded-xl bg-stone-100" />
            <div v-else-if="funnelError" class="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700" role="alert">
              {{ funnelError }} <button class="ml-2 font-semibold underline" @click="loadFunnel">Tentar novamente</button>
            </div>
            <div v-else-if="funnel" class="mt-6 space-y-4">
              <div class="flex items-baseline gap-2 border-b border-stone-100 pb-5">
                <strong class="text-3xl font-semibold tracking-tight text-slate-900 tabular-nums">{{ funnelTotal }}</strong>
                <span class="text-xs text-slate-500">negociações abertas no funil</span>
              </div>
              <div v-for="(stage, index) in funnel.stages" :key="stage.id" class="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2">
                <div class="flex items-center gap-2 text-xs">
                  <span class="flex size-6 shrink-0 items-center justify-center rounded-lg bg-orange-50 font-semibold text-orange-700">{{ index + 1 }}</span>
                  <span class="truncate font-medium text-slate-700">{{ stage.name }}</span>
                </div>
                <span class="text-right text-xs font-semibold tabular-nums text-slate-800">{{ stage.count }} <span class="font-normal text-slate-400">· {{ currency(stage.monthly) }}/mês</span></span>
                <div class="col-span-2 h-2.5 overflow-hidden rounded-full bg-stone-100">
                  <div class="h-full rounded-full bg-orange-500 transition-all" :style="{ width: `${stage.count / funnelMax * 100}%`, opacity: Math.max(.45, 1 - index * .1) }" />
                </div>
              </div>
              <p v-if="!funnel.stages.length" class="text-sm text-slate-500">Nenhuma etapa configurada.</p>
              <p v-if="funnel.unassigned.count" class="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">{{ funnel.unassigned.count }} oportunidades sem etapa definida.</p>
            </div>
            <p v-else class="mt-6 text-sm text-slate-500">Funil indisponível.</p>
          </section>
          <section class="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm xl:col-span-2">
            <h2 class="text-sm font-semibold text-slate-900">Pontos de atenção</h2>
            <p class="mt-1 text-xs text-slate-500">Acompanhamento comercial</p>
            <div v-if="overview" class="mt-6 space-y-4">
              <RouterLink :to="`${base}/oportunidades`" class="flex items-center justify-between rounded-xl bg-amber-50 p-4 text-sm hover:bg-amber-100">
                <span class="font-medium text-amber-900">Oportunidades atrasadas</span>
                <strong class="tabular-nums text-amber-900">{{ overview.overdue.count }}</strong>
              </RouterLink>
              <div class="flex items-center justify-between rounded-xl bg-stone-50 p-4 text-sm">
                <span class="text-slate-600">Negociações perdidas no período</span>
                <strong class="tabular-nums text-slate-900">{{ overview.lost.count }}</strong>
              </div>
              <div class="flex items-center justify-between rounded-xl bg-stone-50 p-4 text-sm">
                <span class="text-slate-600">Sem data prevista</span>
                <strong class="tabular-nums text-slate-900">{{ overview.unscheduled.count }}</strong>
              </div>
            </div>
            <p v-else class="mt-6 text-sm text-slate-500">{{ overviewLoading ? 'Carregando indicadores…' : 'Indicadores indisponíveis.' }}</p>
          </section>
        </div>
      </template>

      <section v-if="canViewOpportunities && overview" class="grid gap-4 md:grid-cols-3">
        <div class="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <p class="text-xs font-medium text-slate-500">Potencial de fechamento no período</p>
          <p class="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{{ currency(overview.open_period.monthly) }}</p>
          <p class="mt-1 text-xs text-slate-400">Mensalidade estimada · não é receita realizada</p>
        </div>
        <div class="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <p class="text-xs font-medium text-slate-500">Valor mensal em atraso</p>
          <p class="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{{ currency(overview.overdue.monthly) }}</p>
          <p class="mt-1 text-xs text-slate-400">Negociações com previsão vencida</p>
        </div>
        <div class="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <p class="text-xs font-medium text-slate-500">Negociações perdidas</p>
          <p class="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{{ overview.lost.count }}</p>
          <p class="mt-1 text-xs text-slate-400">{{ currency(overview.lost.monthly) }}/mês em valor estimado</p>
        </div>
      </section>
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
