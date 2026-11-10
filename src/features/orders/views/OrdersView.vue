<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import AsyncNotice from '@/components/ui/AsyncNotice.vue'
import ListTable from '@/components/ui/ListTable.vue'
import ListFilters from '@/components/ui/ListFilters.vue'
import SearchSelect from '@/components/ui/SearchSelect.vue'
import PagePagination from '@/components/ui/PagePagination.vue'
import OrderDetailsPanel from '../components/OrderDetailsPanel.vue'
import AppDialog from '@/components/ui/AppDialog.vue'
import { useOrdersPage } from '../composables/useOrdersPage'

const route = useRoute()
const selectedOrderId = ref<string | null>(null)
const tenantId = computed(() => String(route.params.tenantId))
const { tenant, paginated, total, page, lastPage, perPage, loading, error, search, status, month, dateField, consultant, team, quickView, summary, consultants, teams, statuses, setQuickView, applyFilters, clearFilters, changePage, load } = useOrdersPage(tenantId)
const canMoveOrders = computed(() => tenant.value?.role === 'OWNER' || tenant.value?.role === 'MANAGER')
const money = (value: string) => Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const date = (value: string) => value?.slice(0, 10).split('-').reverse().join('/') || '—'
</script>

<template>
    <AppShell :tenant="tenant" title="Pedidos comerciais" subtitle="Comercial">
        <header class="mb-7">
            <p class="eyebrow">COMERCIAL</p>
            <h1 class="mt-3 text-3xl font-semibold">Pedidos comerciais</h1>
            <p class="mt-2 text-sm text-slate-500">Acompanhe os pedidos originados das oportunidades ganhas.</p>
        </header>
        <div class="mb-5 grid gap-3 sm:grid-cols-3">
            <button v-for="item in [{ key: 'progress', label: 'Em tramitação', count: summary.progress }, { key: 'activated', label: 'Ativados no mês', count: summary.activated }, { key: 'completed', label: 'Concluídos no mês', count: summary.completed }]" :key="item.key" type="button" class="rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:border-orange-300" :class="quickView === item.key ? 'border-orange-500 ring-1 ring-orange-200' : 'border-stone-200'" @click="setQuickView(item.key as typeof quickView)">
                <p class="text-sm text-slate-500">{{ item.label }}</p><p class="mt-2 text-2xl font-semibold text-slate-800">{{ item.count }}</p>
            </button>
        </div>
        <ListFilters :count-label="total + ' pedido(s) encontrado(s)'" :columns="3" collapsible @search="applyFilters" @clear="clearFilters">
            <div><label class="mb-1 block text-xs font-semibold text-slate-600">Empresa, CPF ou CNPJ</label><input v-model="search" class="field w-full" placeholder="Nome, razão social ou documento" /></div>
            <div><label class="mb-1 block text-xs font-semibold text-slate-600">Status do pedido</label><SearchSelect v-model="status" :options="[{ value: '', label: 'Todos os status' }, ...statuses.map(value => ({ value, label: value }))]" /></div>
            <div><label class="mb-1 block text-xs font-semibold text-slate-600">Mês de referência</label><input v-model="month" type="month" class="field w-full" /></div>
            <div><label class="mb-1 block text-xs font-semibold text-slate-600">Consultor</label><SearchSelect v-model="consultant" :options="[{ value: '', label: 'Todos os consultores' }, ...consultants.map(value => ({ value, label: value }))]" /></div>
            <div><label class="mb-1 block text-xs font-semibold text-slate-600">Equipe</label><SearchSelect v-model="team" :options="[{ value: '', label: 'Todas as equipes' }, ...teams.map(value => ({ value: value.id, label: value.name }))]" /></div>
            <div><label class="mb-1 block text-xs font-semibold text-slate-600">Mês considerado pela</label><SearchSelect v-model="dateField" :options="[{ value: 'created_at', label: 'Data de criação' }, { value: 'activated_at', label: 'Data de ativação' }, { value: 'administratively_completed_at', label: 'Data de conclusão' }]" /></div>
            <template #actions><button type="button" class="secondary-button w-auto" @click="setQuickView('all')">Todos os pedidos</button></template>
        </ListFilters>
        <AppDialog :open="!!selectedOrderId"  :title="canMoveOrders ? 'Movimentar pedido' : 'Detalhes do pedido'" size="full" @close="selectedOrderId = null">
            <OrderDetailsPanel v-if="selectedOrderId" :tenant-id="tenantId" :order-id="selectedOrderId" :can-manage="canMoveOrders" @close="selectedOrderId = null" @saved="load" />
        </AppDialog>
        <AsyncNotice :loading="loading" :error="error" @retry="load" />
        <section v-if="!loading && !error" class="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
            <ListTable min-width="750px">
                <thead class="bg-stone-50 text-xs font-semibold uppercase text-slate-500">
                    <tr><th class="p-4">Cliente</th><th class="p-4">Consultor</th><th class="p-4">Criado em</th><th class="p-4">Venda</th><th class="p-4">Linhas</th><th class="p-4">Mensalidade</th><th class="p-4">Status</th><th class="p-4 text-right">Ações</th></tr>
                </thead>
                <tbody>
                    <tr v-for="order in paginated" :key="order.id" class="border-t border-stone-100">
                        <td class="p-4">{{ order.customer_name }}</td>
                        <td class="p-4">{{ order.consultant_name || '—' }}</td>
                        <td class="p-4">{{ date(order.created_at || '') }}</td><td class="p-4">{{ date(order.sold_on) }}</td>
                        <td class="p-4">{{ order.line_quantity }}</td>
                        <td class="p-4 font-semibold">{{ money(order.monthly_amount) }}</td>
                        <td class="p-4"><span class="rounded-lg bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">{{ order.order_status || order.status }}</span></td>
                        <td class="p-4 text-right"><button type="button"  :class="canMoveOrders ? 'primary-button' : 'secondary-button'" class="w-auto whitespace-nowrap" @click="selectedOrderId = order.id">{{ canMoveOrders ? 'Movimentar Pedido' : 'Detalhes do pedido' }}</button></td>
                    </tr>
                </tbody>
            </ListTable>
            <p v-if="!total" class="p-6 text-center text-sm text-slate-500">Nenhum pedido encontrado.</p>
        </section>
        <PagePagination v-if="!loading && !error" :page="page" :last-page="lastPage" :total="total" :per-page="perPage" @change="changePage" />
    </AppShell>
</template>
