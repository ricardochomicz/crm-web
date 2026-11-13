<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import AsyncNotice from '@/components/ui/AsyncNotice.vue'
import ListTable from '@/components/ui/ListTable.vue'
import PagePagination from '@/components/ui/PagePagination.vue'
import OrderDetailsPanel from '../components/OrderDetailsPanel.vue'
import OrdersListFilters from '../components/OrdersListFilters.vue'
import AppDialog from '@/components/ui/AppDialog.vue'
import { can } from '@/features/tenants/types'
import { useOrdersPage } from '../composables/useOrdersPage'
import { useOrderDeepLink } from '../composables/useOrderDeepLink'

const route = useRoute()
const selectedOrderId = ref<string | null>(null)
const { close: closeOrderDetails } = useOrderDeepLink(selectedOrderId)
const tenantId = computed(() => String(route.params.tenantId))
const { tenant, paginated, total, page, lastPage, perPage, loading, error, search, status, month, dateField, consultant, team, quickView, summary, consultants, teams, statuses, setQuickView, applyFilters, clearFilters, changePage, load } = useOrdersPage(tenantId)
type OrderQuickView = 'progress' | 'activated' | 'completed'
const quickViewCards = computed(() => [
  { key: 'progress' as const, label: 'Em tramitação', count: summary.value.progress },
  { key: 'activated' as const, label: 'Ativados no mês', count: summary.value.activated },
  { key: 'completed' as const, label: 'Concluídos no mês', count: summary.value.completed },
])
function selectQuickView(view: OrderQuickView) {
  setQuickView(view)
}
const canMoveOrders = computed(() => can(tenant.value, 'orders.manage') && (tenant.value?.role === 'OWNER' || tenant.value?.role === 'MANAGER'))
const isCompletedOrder = (order: { administratively_completed_at?: string | null; status?: string }) =>
    !!order.administratively_completed_at || ['COMPLETED', 'CONCLUDED'].includes(order.status?.toUpperCase() ?? '')
const selectedOrder = computed(() => paginated.value.find(order => order.id === selectedOrderId.value))
const canMoveSelectedOrder = computed(() => canMoveOrders.value && !!selectedOrder.value && !isCompletedOrder(selectedOrder.value))
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
            <button v-for="item in quickViewCards" :key="item.key" type="button" class="rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:border-orange-300" :class="quickView === item.key ? 'border-orange-500 ring-1 ring-orange-200' : 'border-stone-200'" @click="selectQuickView(item.key)">
                <p class="text-sm text-slate-500">{{ item.label }}</p><p class="mt-2 text-2xl font-semibold text-slate-800">{{ item.count }}</p>
            </button>
        </div>
        <OrdersListFilters v-model:search="search" v-model:status="status" v-model:month="month"
            v-model:consultant="consultant" v-model:team="team" v-model:date-field="dateField"
            :total="total" :busy="loading" :statuses="statuses" :consultants="consultants" :teams="teams"
            @search="applyFilters" @clear="clearFilters" @all="setQuickView('all')" />
        <AppDialog :open="!!selectedOrderId"  :title="canMoveSelectedOrder ? 'Movimentar pedido' : 'Detalhes do pedido'" size="full" @close="closeOrderDetails">
            <OrderDetailsPanel v-if="selectedOrderId" :tenant-id="tenantId" :order-id="selectedOrderId" :can-manage="canMoveSelectedOrder" @close="selectedOrderId = null" @saved="load" />
        </AppDialog>
        <AsyncNotice :loading="loading" :error="error" @retry="load" />
        <section v-if="!loading && !error" class="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
            <ListTable min-width="750px">
                <thead class="bg-stone-50 text-xs font-semibold uppercase text-slate-500">
                    <tr><th class="p-4">Cliente</th><th class="p-4">Consultor</th><th class="p-4">Criado em</th><th class="p-4">Ativação</th><th class="p-4">Tipo negociação</th><th class="p-4">Linhas</th><th class="p-4">Mensalidade</th><th class="p-4">Status</th><th class="p-4 text-right">Ações</th></tr>
                </thead>
                <tbody>
                    <tr v-for="order in paginated" :key="order.id" class="border-t border-stone-100">
                        <td class="p-4">{{ order.customer_name }}</td>
                        <td class="p-4">{{ order.consultant_name || '—' }}</td>
                        <td class="p-4">{{ date(order.created_at || '') }}</td><td class="p-4">{{ date(order.activated_at || '') }}</td><td class="p-4">{{ order.order_type || '—' }}</td>
                        <td class="p-4">{{ order.line_quantity }}</td>
                        <td class="p-4 font-semibold">{{ money(order.monthly_amount) }}</td>
                        <td class="p-4"><span class="rounded-lg bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">{{ order.order_status || order.status }}</span></td>
                        <td class="p-4 text-right"><button type="button"  :class="canMoveOrders && !isCompletedOrder(order) ? 'primary-button' : 'secondary-button'" class="w-auto whitespace-nowrap" @click="selectedOrderId = order.id">{{ canMoveOrders && !isCompletedOrder(order) ? 'Movimentar Pedido' : 'Detalhes' }}</button></td>
                    </tr>
                </tbody>
            </ListTable>
            <p v-if="!total" class="p-6 text-center text-sm text-slate-500">Nenhum pedido encontrado.</p>
        </section>
        <PagePagination v-if="!loading && !error" :page="page" :last-page="lastPage" :total="total" :per-page="perPage" @change="changePage" />
    </AppShell>
</template>
