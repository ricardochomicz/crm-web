<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import AsyncNotice from '@/components/ui/AsyncNotice.vue'
import DashboardMetricCard from '../components/DashboardMetricCard.vue'
import DashboardSectionHeading from '../components/DashboardSectionHeading.vue'
import DashboardActivationsPanel from '../components/DashboardActivationsPanel.vue'
import DashboardPendingActivationsPanel from '../components/DashboardPendingActivationsPanel.vue'
import DashboardConsultantsPanel from '../components/DashboardConsultantsPanel.vue'
import ConsultantPrioritiesPanel from '@/features/commercial-priorities/components/ConsultantPrioritiesPanel.vue'
import CommercialRadarPanel from '@/features/commercial-priorities/components/CommercialRadarPanel.vue'
import SearchSelect from '@/components/ui/SearchSelect.vue'
import { useCommercialDashboard } from '../composables/useCommercialDashboard'
import { useDashboardSections, type DashboardSection } from '../composables/useDashboardSections'

const route = useRoute()
const tenantId = computed(() => String(route.params.tenantId))
const { expanded, toggle, expand } = useDashboardSections(tenantId)
function jump(section: DashboardSection) {
  expand(section)
  requestAnimationFrame(() => document.getElementById(`dashboard-${section}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
}
const { tenant, loading, error, load, period, overview, funnel, overviewError, funnelError, overviewLoading, funnelLoading, money, base, canSee, isOwner, profile, intro, refreshOverview, refreshFunnel, refresh, metrics, funnelTotal, funnelMax, shortcuts, attention } = useCommercialDashboard(tenantId)
</script>

<template>
  <AppShell :tenant="tenant" :title="tenant?.name ?? 'Dashboard'" subtitle="CRM Telecom · Operações comerciais">
    <AsyncNotice :loading="loading" :error="error" @retry="load" />
    <div v-if="!loading && tenant" class="space-y-5">
      <header class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[.2em] text-orange-600">{{ isOwner ? 'Painel do proprietário' : profile }}</p>
          <h1 class="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Visão geral do negócio <span aria-hidden="true">✦</span></h1>
          <p class="mt-1 text-sm text-slate-500">{{ intro }}</p>
        </div>
        <div class="flex items-center gap-2">
          <label class="sr-only" for="dashboard-period">Período</label>
          <SearchSelect
            :model-value="period"
            @update:model-value="value => { if (value === 'month' || value === 'quarter') period = value }"
            :options="[
              { value: 'month', label: 'Este mês' },
              { value: 'quarter', label: 'Este trimestre' },
            ]"
          />
          <button type="button" class="rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-slate-900 transition hover:bg-[#243154]" aria-label="Atualizar dashboard" @click="refresh">↻</button>
        </div>
      </header>

      <nav aria-label="Seções do dashboard" class="flex flex-wrap gap-2 text-xs font-semibold">
        <a href="#dashboard-vendas" @click.prevent="jump('vendas')" class="rounded-lg border border-stone-200 bg-white px-3 py-2 text-slate-700 hover:border-orange-300">Vendas</a>
        <a v-if="canSee" href="#dashboard-ativacoes" @click.prevent="jump('ativacoes')" class="rounded-lg border border-stone-200 bg-white px-3 py-2 text-slate-700 hover:border-orange-300">Ativações</a>
        <a v-if="tenant.role === 'OWNER' || tenant.role === 'MANAGER' || tenant.role === 'CONSULTANT'" href="#dashboard-produtividade" @click.prevent="jump('produtividade')" class="rounded-lg border border-stone-200 bg-white px-3 py-2 text-slate-700 hover:border-orange-300">Produtividade</a>
        <a v-if="canSee" href="#dashboard-alertas" @click.prevent="jump('alertas')" class="rounded-lg border border-stone-200 bg-white px-3 py-2 text-slate-700 hover:border-orange-300">Alertas</a>
      </nav>

      <DashboardSectionHeading anchor="dashboard-vendas" collapsible :expanded="expanded.vendas" @toggle="toggle('vendas')" title="Vendas" description="Indicadores comerciais, oportunidades e funil de negociação" />
      <div v-show="expanded.vendas" id="dashboard-vendas-content" class="space-y-5">
      <CommercialRadarPanel :tenant-id="tenantId" :enabled="!!tenant" />

      <section v-if="!canSee" class="rounded-2xl border border-stone-200 bg-white p-6 text-sm text-slate-600">Os indicadores comerciais não estão disponíveis para seu perfil.</section>
      <template v-else>
        <div v-if="overviewError" role="alert" class="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{{ overviewError }} <button type="button" class="ml-2 underline" @click="refreshOverview">Tentar novamente</button></div>
        <section aria-label="Indicadores principais" :aria-busy="overviewLoading" class="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
          <DashboardMetricCard v-for="metric in metrics" :key="metric.label" v-bind="metric" />
        </section>

        <div class="grid gap-4 xl:grid-cols-12">
          <section class="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm xl:col-span-7">
            <div class="flex flex-wrap items-start justify-between gap-2">
              <div><h2 class="text-base font-semibold text-slate-900">Funil de vendas</h2><p class="mt-1 text-xs text-slate-500">Oportunidades abertas por etapa · situação atual</p></div>
              <RouterLink :to="base + '/oportunidades'" class="text-xs font-semibold text-orange-700 hover:underline">Ver oportunidades ↗</RouterLink>
            </div>
            <div v-if="funnelLoading" class="mt-7 h-64 animate-pulse rounded-xl bg-stone-100" />
            <div v-else-if="funnelError" role="alert" class="mt-7 text-sm text-rose-700">{{ funnelError }} <button class="underline" @click="refreshFunnel">Recarregar</button></div>
            <div v-else-if="funnel" class="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_135px]">
              <div class="space-y-3">
                <div v-for="(stage, index) in funnel.stages" :key="stage.id" class="relative mx-auto flex min-h-11 items-center justify-between gap-3 overflow-hidden rounded-lg px-4 py-2 text-xs font-semibold text-white transition-all" :class="['bg-orange-500','bg-orange-600','bg-amber-500','bg-emerald-600','bg-teal-700'][index % 5]" :style="{ width: (100 - Math.min(index * 8, 40)) + '%', opacity: stage.count === 0 ? .5 : 1 }">
                  <span class="truncate">{{ stage.name }}</span><span class="shrink-0 tabular-nums">{{ stage.count }}</span>
                </div>
                <p v-if="!funnel.stages.length" class="py-12 text-center text-sm text-slate-500">Configure as etapas do funil para visualizar os resultados.</p>
                <p v-if="funnel.unassigned.count" class="text-xs text-amber-700">{{ funnel.unassigned.count }} oportunidades sem etapa atribuída.</p>
              </div>
              <div class="space-y-3">
                <div class="rounded-xl border border-stone-200 bg-stone-50 p-4"><p class="text-xs text-slate-500">Total em aberto</p><p class="mt-1 text-3xl font-bold tabular-nums text-slate-900">{{ funnelTotal }}</p><p class="text-xs text-slate-500">oportunidades</p></div>
                <div class="rounded-xl border border-stone-200 bg-stone-50 p-4"><p class="text-xs text-slate-500">Maior etapa</p><p class="mt-2 text-xl font-bold text-slate-900">{{ Math.max(0, funnelMax === 1 && funnelTotal === 0 ? 0 : funnelMax) }}</p><p class="mt-1 text-xs text-slate-500">oportunidades</p></div>
              </div>
            </div>
            <p v-else class="mt-6 text-sm text-slate-500">Funil indisponível.</p>
          </section>

          <section class="rounded-2xl border border-stone-200 bg-white p-5 xl:col-span-5">
            <h2 class="text-base font-semibold text-slate-900">Resumo comercial</h2>
            <p class="mt-1 text-xs text-slate-500">Indicadores para tomada de decisão</p>
            <div v-if="overview" class="mt-6 space-y-5">
              <div>
                <div class="flex justify-between gap-2 text-sm"><span class="text-slate-600">Ganhas no período</span><strong class="text-emerald-700">{{ overview.won.count }}</strong></div>
                <div class="mt-2 h-2 overflow-hidden rounded-full bg-stone-100"><div class="h-full rounded-full bg-emerald-400" :style="{ width: (overview.won.count + overview.lost.count ? overview.won.count / (overview.won.count + overview.lost.count) * 100 : 0) + '%' }" /></div>
              </div>
              <div class="flex items-center justify-between border-b border-stone-200 pb-4 text-sm"><span class="text-slate-600">Perdidas no período</span><strong class="text-rose-700">{{ overview.lost.count }}</strong></div>
              <div class="flex items-center justify-between border-b border-stone-200 pb-4 text-sm"><span class="text-slate-600">Potencial mensal em aberto</span><strong class="text-sky-700">{{ money(overview.open_period.monthly) }}</strong></div>
              <div class="flex items-center justify-between border-b border-stone-200 pb-4 text-sm"><span class="text-slate-600">Valor mensal atrasado</span><strong class="text-amber-700">{{ money(overview.overdue.monthly) }}</strong></div>
              <div class="rounded-xl bg-orange-50 p-4 text-xs leading-5 text-orange-700">Valores de oportunidades são estimativas comerciais, não faturamento efetivado.</div>
            </div>
            <p v-else class="mt-6 text-sm text-slate-500">{{ overviewLoading ? 'Carregando resumo…' : 'Resumo indisponível.' }}</p>
          </section>
        </div>

        <DashboardSectionHeading anchor="dashboard-alertas" collapsible :expanded="expanded.alertas" @toggle="toggle('alertas')" title="Alertas e acompanhamento" description="Previsões comerciais e pontos que precisam de atenção" />
        <div v-show="expanded.alertas" id="dashboard-alertas-content" class="grid gap-4 xl:grid-cols-12">
          <section class="rounded-2xl border border-stone-200 bg-white p-5 xl:col-span-7">
            <div class="flex items-center justify-between"><div><h2 class="text-base font-semibold text-slate-900">Visão de oportunidades</h2><p class="mt-1 text-xs text-slate-500">Previsões e pontos de atenção</p></div><span class="rounded-lg bg-orange-50 px-2 py-1 text-[11px] font-medium text-orange-700">Período selecionado</span></div>
            <div v-if="overview" class="mt-5 grid gap-3 sm:grid-cols-3">
              <div v-for="item in [{label:'No período', count:overview.open_period.count, value:overview.open_period.monthly},{label:'Após o período',count:overview.future.count,value:overview.future.monthly},{label:'Em atraso',count:overview.overdue.count,value:overview.overdue.monthly}]" :key="item.label" class="rounded-xl border border-stone-200 bg-stone-50 p-4">
                <p class="text-xs text-slate-500">{{ item.label }}</p><p class="mt-2 text-2xl font-bold text-slate-900">{{ item.count }}</p><p class="mt-1 text-xs text-slate-500">{{ money(item.value) }}/mês</p>
              </div>
            </div>
            <p v-else class="mt-6 text-sm text-slate-500">Aguardando indicadores.</p>
          </section>
          <section class="rounded-2xl border border-stone-200 bg-white p-5 xl:col-span-5">
            <div class="flex items-center justify-between"><div><h2 class="text-base font-semibold text-slate-900">Central de atenção</h2><p class="mt-1 text-xs text-slate-500">O que precisa de acompanhamento</p></div><span class="text-lg text-orange-600">♢</span></div>
            <div v-if="overview" class="mt-4 space-y-2">
              <RouterLink v-for="item in attention" :key="item.label" :to="base + '/oportunidades'" class="flex items-center justify-between gap-3 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 transition hover:bg-orange-50">
                <div class="min-w-0"><p class="truncate text-sm font-medium text-slate-900">{{ item.label }}</p><p class="mt-0.5 text-xs text-slate-500">{{ item.detail }}</p></div><strong class="text-xl tabular-nums" :class="item.tone">{{ item.count }}</strong>
              </RouterLink>
            </div>
            <p v-else class="mt-5 text-sm text-slate-500">Aguardando indicadores.</p>
          </section>
        </div>
      </template>
      </div>

      <DashboardSectionHeading v-if="canSee" anchor="dashboard-ativacoes" collapsible :expanded="expanded.ativacoes" @toggle="toggle('ativacoes')" title="Ativações" description="Linhas ativadas, pendências e previsões vencidas" />
      <div v-if="canSee" v-show="expanded.ativacoes" id="dashboard-ativacoes-content" class="space-y-5">
      <DashboardActivationsPanel
        v-if="canSee"
        :tenant-id="tenantId"
        :enabled="!loading && canSee"
      />

      <DashboardPendingActivationsPanel v-if="canSee" :tenant-id="tenantId" :enabled="!loading && canSee" />

      </div>

      <DashboardSectionHeading v-if="tenant.role === 'OWNER' || tenant.role === 'MANAGER' || tenant.role === 'CONSULTANT'" anchor="dashboard-produtividade" collapsible :expanded="expanded.produtividade" @toggle="toggle('produtividade')" title="Produtividade" description="Resultados por consultor e atividades prioritárias" />
      <div v-show="expanded.produtividade" id="dashboard-produtividade-content" class="space-y-5">
      <DashboardConsultantsPanel
        v-if="tenant.role === 'OWNER' || tenant.role === 'MANAGER'"
        :tenant-id="tenantId"
        :enabled="!loading"
      />

      <ConsultantPrioritiesPanel
        v-if="tenant.role === 'CONSULTANT' && canSee"
        :tenant-id="tenantId"
        :enabled="!loading"
      />

      </div>

      <section class="rounded-2xl border border-stone-200 bg-white p-5">
        <h2 class="text-base font-semibold text-slate-900">Acesso rápido</h2>
        <p class="mt-1 text-xs text-slate-500">Principais áreas do sistema</p>
        <div v-if="shortcuts.length" class="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
          <RouterLink v-for="link in shortcuts" :key="link.path" :to="base + '/' + link.path" class="group rounded-xl border border-stone-200 bg-stone-50 p-4 transition hover:-translate-y-0.5 hover:border-orange-300 hover:bg-orange-50">
            <span class="flex items-start justify-between"><span class="text-2xl text-orange-600">{{ link.symbol }}</span><span class="text-slate-500 group-hover:text-orange-700">↗</span></span>
            <span class="mt-4 block text-sm font-semibold text-slate-900">{{ link.label }}</span>
          </RouterLink>
        </div>
        <p v-else class="mt-4 text-sm text-slate-500">Nenhum atalho disponível para este perfil.</p>
      </section>
    </div>
  </AppShell>
</template>
