<script setup lang="ts">
import AppShell from '@/components/layout/AppShell.vue'
import AsyncNotice from '@/components/ui/AsyncNotice.vue'
import ListFilters from '@/components/ui/ListFilters.vue'
import ListTable from '@/components/ui/ListTable.vue'
import PagePagination from '@/components/ui/PagePagination.vue'
import SearchSelect from '@/components/ui/SearchSelect.vue'
import { useMyCommissions } from '../composables/useMyCommissions'

const { tenant, month, status, page, data, loading, error, load, search, clear, changePage } = useMyCommissions()
const money = (amount: string | null) => amount === null ? 'Pendente' : Number(amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const date = (value: string | null) => value ? value.slice(0, 10).split('-').reverse().join('/') : '—'
const statuses: Record<string, string> = {
  ESTIMATED: 'Estimada',
  ELIGIBLE: 'Elegível',
  PENDING_RULES: 'Pendente de apuração',
}
</script>

<template>
  <AppShell :tenant="tenant" title="Minhas comissões" subtitle="Acompanhe seus repasses por venda">
    <header class="mb-6">
      <p class="eyebrow">COMERCIAL</p>
      <h1 class="mt-2 text-3xl font-semibold">Minhas comissões</h1>
      <p class="mt-2 text-sm text-slate-500">Consulte somente os valores atribuídos a você nas apurações vigentes.</p>
    </header>
    <ListFilters :columns="2" :busy="loading" count-label="Filtre por mês da venda e situação" @search="search" @clear="clear">
      <label class="text-xs font-semibold text-slate-600">Mês da venda
        <input v-model="month" type="month" class="field mt-1 block w-full" />
      </label>
      <label class="text-xs font-semibold text-slate-600">Situação
        <SearchSelect v-model="status" :options="[
          { value: '', label: 'Todas as situações' },
          { value: 'ESTIMATED', label: 'Estimada' },
          { value: 'ELIGIBLE', label: 'Elegível' },
          { value: 'PENDING_RULES', label: 'Pendente de apuração' },
        ]" />
      </label>
    </ListFilters>
    <AsyncNotice :loading="loading" :error="error" @retry="load" />
    <template v-if="data && !loading && !error">
      <div class="mb-5 grid gap-3 sm:grid-cols-2">
        <article class="rounded-2xl border border-stone-200 bg-white p-5">
          <p class="text-sm text-slate-500">Comissões estimadas</p>
          <p class="mt-2 text-2xl font-semibold">{{ money(data.summary.estimated) }}</p>
        </article>
        <article class="rounded-2xl border border-stone-200 bg-white p-5">
          <p class="text-sm text-slate-500">Elegíveis após ativação</p>
          <p class="mt-2 text-2xl font-semibold">{{ money(data.summary.eligible) }}</p>
        </article>
      </div>
      <section class="overflow-hidden rounded-2xl border border-stone-200 bg-white">
        <ListTable min-width="740px">
          <thead class="bg-stone-50 text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th class="px-4 py-3">Venda</th><th class="px-4 py-3">Ativação</th>
              <th class="px-4 py-3">Linha / Serviço</th><th class="px-4 py-3">Situação</th>
              <th class="px-4 py-3 text-right">Minha comissão</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-stone-100">
            <tr v-for="item in data.items" :key="item.order_id + '-' + item.line_number + '-' + item.revision">
              <td class="px-4 py-3">{{ date(item.sold_on) }}</td>
              <td class="px-4 py-3">{{ date(item.activated_on) }}</td>
              <td class="px-4 py-3"><div class="font-medium">{{ item.description }}</div><div class="text-xs text-slate-500">{{ item.line_number || 'Sem número' }} · Revisão {{ item.revision }}</div></td>
              <td class="px-4 py-3">{{ statuses[item.status] ?? item.status }}</td>
              <td class="px-4 py-3 text-right font-semibold">{{ money(item.amount) }}</td>
            </tr>
          </tbody>
        </ListTable>
        <p v-if="!data.items.length" class="p-6 text-sm text-slate-500">Nenhuma comissão encontrada neste período.</p>
      </section>
      <PagePagination :page="page" :last-page="data.pagination.last_page" :total="data.pagination.total" :busy="loading" @change="changePage" />
      <p class="mt-3 text-xs text-slate-500">{{ data.note }}</p>
    </template>
  </AppShell>
</template>
