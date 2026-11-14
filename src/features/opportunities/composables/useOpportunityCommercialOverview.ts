import { computed, ref, watch, type Ref } from 'vue'
import { opportunitiesApi, type CommercialOverview } from '../api'
import { errorMessage } from '@/lib/feedback'

/** State and data fetching for the commercial overview. The component owns presentation only. */
export function useOpportunityCommercialOverview(tenantId: Ref<string>) {
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
        ...(data.won_with_orders ? [{ title: 'Ganhas com pedido', metric: data.won_with_orders, color: 'text-teal-700', accent: 'bg-teal-400' }] : []),
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
        if (!year || number === undefined || number < 1 || number > 12) return
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
        const response = await opportunitiesApi.overview(tenantId.value, from, to)
        if (version === requestVersion) overview.value = response.data
    } catch (exception) {
        if (version === requestVersion) error.value = errorMessage(exception)
    } finally {
        if (version === requestVersion) busy.value = false
    }
}
watch(tenantId, () => {
    overview.value = null
    void refresh()
}, { immediate: true })

    return { mode, month, start, end, overview, busy, expanded, error, periodLabel, metrics, currency, refresh }
}
