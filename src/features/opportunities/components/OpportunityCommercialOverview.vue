<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { opportunitiesApi, type CommercialOverview } from '../api'
import { errorMessage } from '@/lib/feedback'

const props = defineProps<{ tenantId: string }>()
const today = new Date()
const initialMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
const mode = ref<'month' | 'range'>('month')
const month = ref(initialMonth)
const start = ref(`${initialMonth}-01`)
const end = ref(`${initialMonth}-${String(new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()).padStart(2, '0')}`)
const overview = ref<CommercialOverview | null>(null)
const busy = ref(false)
const expanded = ref(false)
const error = ref('')
let requestVersion = 0

const currency = (value: string | number) => Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const periodLabel = computed(() => {
    if (mode.value === 'range') return `${start.value.split('-').reverse().join('/')} a ${end.value.split('-').reverse().join('/')}`
    const [year, number] = month.value.split('-').map(Number)
    if (!year || !number) return 'Selecione o período'
    return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(year, number - 1, 1)))
})
const metrics = computed(() => {
    const data = overview.value
    if (!data) return []
    return [
        { title: 'Em aberto no período', metric: data.open_period, color: 'text-slate-900', accent: 'bg-slate-400' },
        { title: 'Forecast vencido', metric: data.overdue, color: 'text-rose-700', accent: 'bg-rose-400' },
        { title: 'Ganhas no período', metric: data.won, color: 'text-emerald-700', accent: 'bg-emerald-400' },
        { title: 'Perdidas no período', metric: data.lost, color: 'text-slate-700', accent: 'bg-slate-400' },
        { title: 'Próximos meses', metric: data.future, color: 'text-blue-700', accent: 'bg-blue-400' },
        { title: 'Sem previsão', metric: data.unscheduled, color: 'text-amber-700', accent: 'bg-amber-400' },
    ]
})
async function refresh() {
    let from = start.value
    let to = end.value
    if (mode.value === 'month') {
        if (!/^\d{4}-\d{2}$/.test(month.value)) return
        const [year, number] = month.value.split('-').map(Number)
        if (number < 1 || number > 12) return
        from = `${month.value}-01`
        to = `${month.value}-${String(new Date(year, number, 0).getDate()).padStart(2, '0')}`
    }
    if (!from || !to || from > to) {
        error.value = 'Informe um intervalo de datas válido.'
        return
    }
    const version = ++requestVersion
    busy.value = true
    error.value = ''
    try {
        const response = await opportunitiesApi.overview(props.tenantId, from, to)
        if (version === requestVersion) overview.value = response.data
    } catch (exception) {
        if (version === requestVersion) error.value = errorMessage(exception)
    } finally {
        if (version === requestVersion) busy.value = false
    }
}
watch(() => props.tenantId, () => {
    overview.value = null
    void refresh()
}, { immediate: true })
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
                    <select v-model="mode" class="field mt-1 min-w-32">
                        <option value="month">Mês / Ano</option>
                        <option value="range">Intervalo</option>
                    </select>
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
        <div v-else-if="busy" class="py-5 text-sm text-slate-500">Carregando indicadores comerciais…</div>
        <div v-if="overview" class="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 pt-3 text-xs text-slate-500">
            <span>Taxa de conversão: <strong class="text-slate-800">{{ overview.conversion_rate === null ? '—' : overview.conversion_rate.toLocaleString('pt-BR') + '%' }}</strong></span>
            <span>Ganhas e perdidas: data de encerramento · Abertas: previsão de fechamento</span>
        </div>
        </div>
    </section>
</template>
