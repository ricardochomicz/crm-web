<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import AsyncNotice from '@/components/ui/AsyncNotice.vue'
import ListTable from '@/components/ui/ListTable.vue'
import { useOrdersPage } from '../composables/useOrdersPage'

const route = useRoute()
const tenantId = computed(() => String(route.params.tenantId))
const { tenant, filtered, loading, error, search, load } = useOrdersPage(tenantId)
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
        <div class="mb-5 rounded-2xl border border-stone-200 bg-white p-4">
            <label for="order-search" class="mb-2 block text-sm font-semibold text-slate-700">Pesquisar pedidos</label>
            <input id="order-search" v-model="search" class="field w-full" placeholder="Código, cliente ou status" />
        </div>
        <AsyncNotice :loading="loading" :error="error" @retry="load" />
        <section v-if="!loading && !error" class="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
            <ListTable min-width="750px">
                <thead class="bg-stone-50 text-xs font-semibold uppercase text-slate-500">
                    <tr><th class="p-4">Pedido</th><th class="p-4">Cliente</th><th class="p-4">Venda</th><th class="p-4">Linhas</th><th class="p-4">Mensalidade</th><th class="p-4">Status</th></tr>
                </thead>
                <tbody>
                    <tr v-for="order in filtered" :key="order.id" class="border-t border-stone-100">
                        <td class="p-4 font-semibold text-slate-800">{{ order.code || order.id.slice(0, 8) }}</td>
                        <td class="p-4">{{ order.customer_name }}</td>
                        <td class="p-4">{{ date(order.sold_on) }}</td>
                        <td class="p-4">{{ order.line_quantity }}</td>
                        <td class="p-4 font-semibold">{{ money(order.monthly_amount) }}</td>
                        <td class="p-4"><span class="rounded-lg bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">{{ order.order_status || order.status }}</span></td>
                    </tr>
                </tbody>
            </ListTable>
            <p v-if="!filtered.length" class="p-6 text-center text-sm text-slate-500">Nenhum pedido encontrado.</p>
        </section>
    </AppShell>
</template>
