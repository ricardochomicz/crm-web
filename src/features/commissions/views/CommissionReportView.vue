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
