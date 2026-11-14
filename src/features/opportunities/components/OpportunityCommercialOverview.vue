<script setup lang="ts">
import { toRef } from 'vue'
import SearchSelect from '@/components/ui/SearchSelect.vue'
import { useOpportunityCommercialOverview } from '../composables/useOpportunityCommercialOverview'

const props = defineProps<{ tenantId: string }>()
const { mode, month, start, end, overview, busy, expanded, error, periodLabel, metrics, currency, refresh } =
    useOpportunityCommercialOverview(toRef(props, 'tenantId'))

defineExpose({ refresh })
</script>

<template>
    <section class="mb-5 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5" aria-label="Visão comercial">
        <div class="flex flex-wrap items-center justify-between gap-3" :class="expanded ? 'mb-4' : ''">
            <div>
                <h2 class="text-base font-semibold text-slate-900">Visão comercial</h2>
                <p class="mt-1 text-xs capitalize text-slate-500">{{ periodLabel }}</p>
            </div>
            <button type="button" class="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-stone-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-500" :aria-expanded="expanded" aria-controls="commercial-overview-details" @click="expanded = !expanded">
                {{ expanded ? 'Recolher' : 'Expandir visão comercial' }}
                <span aria-hidden="true">{{ expanded ? '⌃' : '⌄' }}</span>
            </button>
        </div>
        <div v-if="expanded" id="commercial-overview-details">
            <form class="mb-4 flex flex-wrap items-end justify-end gap-2" @submit.prevent="refresh">
                <label class="text-xs font-semibold text-slate-600">
                    Consultar por
                    <SearchSelect :model-value="mode" :options="[{ value: 'month', label: 'Mês / Ano' }, { value: 'range', label: 'Intervalo' }]" @update:model-value="value => mode = value === 'range' ? 'range' : 'month'" />
                </label>
                <label v-if="mode === 'month'" class="text-xs font-semibold text-slate-600">
                    Mês e ano
                    <input v-model="month" type="month" class="field mt-1" required />
                </label>
                <template v-else>
                    <label class="text-xs font-semibold text-slate-600">De<input v-model="start" type="date" class="field mt-1" required /></label>
                    <label class="text-xs font-semibold text-slate-600">Até<input v-model="end" type="date" :min="start" class="field mt-1" required /></label>
                </template>
                <button type="submit" class="primary-button w-auto" :disabled="busy">{{ busy ? 'Consultando…' : 'Consultar' }}</button>
            </form>
        <p v-if="error" role="alert" class="mb-3 text-sm text-rose-700">{{ error }}</p>
        <div v-if="overview" class="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6" :class="busy ? 'opacity-60' : ''">
            <div v-for="item in metrics" :key="item.title" class="rounded-xl border border-stone-100 bg-stone-50/60 p-3">
                <div class="mb-2 h-1 w-8 rounded-full" :class="item.accent" />
                <p class="text-xs text-slate-600">{{ item.title }}</p>
                <p class="mt-2 text-2xl font-semibold tabular-nums" :class="item.color">{{ item.metric.count }}</p>
                <p class="mt-1 text-xs font-medium text-slate-600">{{ currency(item.metric.monthly) }}/mês</p>
            </div>
        </div>
        <div v-if="overview?.forecast_revisions" class="mt-3 grid gap-3 sm:grid-cols-2" aria-label="Revisões de previsão no período">
            <div class="rounded-xl border border-amber-200 bg-amber-50/60 p-3">
                <p class="text-xs font-semibold text-amber-900">Previsões prorrogadas</p>
                <p class="mt-1 text-2xl font-semibold tabular-nums text-amber-950">{{ overview.forecast_revisions.extensions }}</p>
            </div>
            <div class="rounded-xl border border-sky-200 bg-sky-50/60 p-3">
                <p class="text-xs font-semibold text-sky-900">Previsões antecipadas</p>
                <p class="mt-1 text-2xl font-semibold tabular-nums text-sky-950">{{ overview.forecast_revisions.advances }}</p>
            </div>
            <p class="text-xs text-slate-500 sm:col-span-2">Alterações registradas no período selecionado, apenas para oportunidades atualmente abertas e visíveis para você. O histórico anterior à auditoria estruturada não entra nestes totais.</p>
        </div>
        <div v-else-if="busy" class="py-5 text-sm text-slate-500">Carregando indicadores comerciais…</div>
        <div v-if="overview" class="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 pt-3 text-xs text-slate-500">
            <span>Taxa de conversão: <strong class="text-slate-800">{{ overview.conversion_rate === null ? '—' : overview.conversion_rate.toLocaleString('pt-BR') + '%' }}</strong></span>
            <span>Ganhas e perdidas: data de encerramento · Abertas: previsão de fechamento</span>
        </div>
        </div>
    </section>
</template>
