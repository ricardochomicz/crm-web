<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import AsyncNotice from '@/components/ui/AsyncNotice.vue'
import ListFilters from '@/components/ui/ListFilters.vue'
import ListTable from '@/components/ui/ListTable.vue'
import SearchSelect from '@/components/ui/SearchSelect.vue'
import { money, useCommissionReport } from '../composables/useCommissionReport'

const route = useRoute()
const tenantId = computed(() => String(route.params.tenantId))
const { tenant, period, status, report, loading, error, totals, load, clear } = useCommissionReport(tenantId)
const statuses = [
  { value: '', label: 'Todas as situações' },
  { value: 'ESTIMATED', label: 'Estimada' },
  { value: 'ELIGIBLE', label: 'Elegível após ativação' },
  { value: 'PENDING_RULES', label: 'Pendente de regras' },
]
const issueLabels: Record<string, string> = {
  company_rule_missing: 'Não existe tabela de comissão ativa para a operadora e o tipo de pedido.',
  company_rule_ambiguous: 'Existem tabelas de comissão conflitantes para a venda.',
  participants_missing: 'Os participantes da venda não foram identificados.',
  participant_rule_missing: 'Não existe regra de comissão para o participante.',
  participant_rule_ambiguous: 'Existem regras conflitantes para o participante.',
  sale_rules_not_captured: 'As regras não foram registradas na venda; é necessária uma revisão.',
  line_requires_individualization: 'A linha precisa ser individualizada antes da apuração.',
  participant_total_exceeds_net_commission: 'Os repasses ultrapassam a comissão líquida da empresa.',
}
function brDate(value: string | null) {
  return value ? value.slice(0, 10).split('-').reverse().join('/') : 'Não ativada'
}
function issueLabel(code: string) {
  const [reason, role] = code.split(':')
  return `${issueLabels[reason ?? ''] ?? code}${role ? ' (' + role + ')' : ''}`
}
const roles: Record<string, string> = {
  CONSULTANT: 'Consultor',
  SUPERVISOR: 'Supervisor',
  MANAGER: 'Gestor',
  COMPANY: 'Empresa',
}
</script>

<template>
  <AppShell :tenant="tenant" title="Relatório de comissões" subtitle="Apuração comercial por data da venda">
    <header class="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <p class="eyebrow">FINANCEIRO</p>
        <h1 class="mt-2 text-3xl font-semibold">Relatório de comissões</h1>
        <p class="mt-2 text-sm text-slate-500">Valores apurados nas revisões vigentes dos pedidos.</p>
      </div>
      <RouterLink :to="`/empresas/${tenantId}/comissoes`" class="secondary-button w-auto">
        Tabelas de comissões
      </RouterLink>
    </header>

    <ListFilters :columns="2" :busy="loading" count-label="Filtre as apurações por mês da venda e situação" @search="load" @clear="clear">
      <label class="text-xs font-semibold text-slate-600">
        Mês da venda
        <input v-model="period" type="month" class="field mt-1 block w-full" required />
      </label>
      <label class="text-xs font-semibold text-slate-600">
        Situação
        <SearchSelect v-model="status" :options="statuses" />
      </label>
    </ListFilters>
    <AsyncNotice :loading="loading" :error="error" @retry="load" />
    <template v-if="report && !loading && !error">
      <section class="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-label="Indicadores de comissões">
        <div v-for="item in [
          { label: 'Linhas apuradas', value: totals.lines.toLocaleString('pt-BR') },
          { label: 'Comissão bruta', value: money(totals.gross) },
          { label: 'Descontos', value: money(totals.deduction) },
          { label: 'Comissão líquida', value: money(totals.net) },
          { label: 'Comissões dos participantes', value: money(totals.participants) },
          { label: 'Saldo da empresa', value: money(totals.company_balance) },
        ]" :key="item.label" class="rounded-2xl border border-stone-200 bg-white p-5">
          <p class="text-sm text-slate-500">{{ item.label }}</p>
          <p class="mt-2 text-2xl font-semibold text-slate-800">{{ item.value }}</p>
        </div>
      </section>

      <section v-if="report.pending_issues?.length" class="mb-6 rounded-2xl border border-amber-200 bg-amber-50/60 p-5">
        <h2 class="font-semibold text-amber-950">Por que existem comissões sem valor?</h2>
        <p class="mt-1 text-sm text-amber-900">As linhas abaixo possuem pendências de apuração. A tabela da operadora, isoladamente, não garante o cálculo dos repasses.</p>
        <ul class="mt-3 space-y-2 text-sm text-amber-950">
          <li v-for="issue in report.pending_issues" :key="issue.code">
            <strong>{{ issue.lines }} linha(s):</strong> {{ issueLabel(issue.code) }}
          </li>
        </ul>
        <p class="mt-3 text-xs text-amber-900">Corrija as regras ou participantes e revise a apuração do pedido. Alterar uma tabela não recalcula automaticamente revisões já registradas.</p>
      </section>

      <section v-if="report.pending_orders?.length" class="mb-6 overflow-hidden rounded-2xl border border-stone-200 bg-white">
        <h2 class="border-b border-stone-100 px-5 py-4 text-lg font-semibold">Pedidos que precisam de revisão</h2>
        <ListTable min-width="780px">
          <thead class="bg-stone-50 text-xs uppercase text-slate-500">
            <tr><th class="px-5 py-3 text-left">Data da venda</th><th class="px-4 py-3 text-left">Ativação</th><th class="px-4 py-3 text-left">Pendências</th><th class="px-5 py-3 text-right">Pedido</th></tr>
          </thead>
          <tbody class="divide-y divide-stone-100">
            <tr v-for="item in report.pending_orders" :key="item.order_id">
              <td class="px-5 py-3">{{ brDate(item.sold_on) }}</td>
              <td class="px-4 py-3">{{ brDate(item.activated_on) }}</td>
              <td class="px-4 py-3 text-sm">{{ item.issues.map(issueLabel).join('; ') }}</td>
              <td class="px-5 py-3 text-right">
                <RouterLink class="font-semibold text-orange-700 hover:underline" :to="`/empresas/${tenantId}/pedidos`">Ver pedidos</RouterLink>
              </td>
            </tr>
          </tbody>
        </ListTable>
      </section>
      <section class="mb-6 overflow-hidden rounded-2xl border border-stone-200 bg-white">
        <h2 class="border-b border-stone-100 px-5 py-4 text-lg font-semibold">Apuração por situação</h2>
        <ListTable min-width="760px">
          <thead class="bg-stone-50 text-xs uppercase text-slate-500">
            <tr><th class="px-5 py-3 text-left">Situação</th><th class="px-4 py-3 text-right">Linhas</th><th class="px-4 py-3 text-right">Líquida</th><th class="px-4 py-3 text-right">Participantes</th><th class="px-5 py-3 text-right">Saldo empresa</th></tr>
          </thead>
          <tbody class="divide-y divide-stone-100">
            <tr v-for="row in report.summary" :key="row.status">
              <td class="px-5 py-3">{{ statuses.find(item => item.value === row.status)?.label ?? row.status }}</td>
              <td class="px-4 py-3 text-right">{{ Number(row.lines).toLocaleString('pt-BR') }}</td>
              <td class="px-4 py-3 text-right">{{ money(row.net) }}</td>
              <td class="px-4 py-3 text-right">{{ money(row.participants) }}</td>
              <td class="px-5 py-3 text-right">{{ money(row.company_balance) }}</td>
            </tr>
          </tbody>
        </ListTable>
        <p v-if="!report.summary.length" class="p-6 text-center text-sm text-slate-500">Nenhuma comissão apurada para os filtros selecionados.</p>
      </section>

      <section class="overflow-hidden rounded-2xl border border-stone-200 bg-white">
        <h2 class="border-b border-stone-100 px-5 py-4 text-lg font-semibold">Comissões por participante</h2>
        <ListTable min-width="720px">
          <thead class="bg-stone-50 text-xs uppercase text-slate-500">
            <tr><th class="px-5 py-3 text-left">Participante</th><th class="px-4 py-3 text-left">Função</th><th class="px-4 py-3 text-right">Estimada</th><th class="px-5 py-3 text-right">Elegível</th></tr>
          </thead>
          <tbody class="divide-y divide-stone-100">
            <tr v-for="item in report.participants" :key="`${item.role}-${item.tenant_user_id ?? item.commercial_participant_id}`">
              <td class="px-5 py-3 font-medium">{{ item.name }}</td>
              <td class="px-4 py-3">{{ roles[item.role] ?? item.role }}</td>
              <td class="px-4 py-3 text-right">{{ money(item.estimated) }}</td>
              <td class="px-5 py-3 text-right">{{ money(item.eligible) }}</td>
            </tr>
          </tbody>
        </ListTable>
        <p v-if="!report.participants.length" class="p-6 text-center text-sm text-slate-500">Nenhum participante encontrado.</p>
      </section>
      <p class="mt-4 text-sm text-slate-500">{{ report.note }}</p>
    </template>
  </AppShell>
</template>
