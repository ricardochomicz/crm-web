import { computed, onMounted, onUnmounted, ref, watch, type Ref } from 'vue'
import { tenantApi } from '@/features/tenants/api'
import type { Tenant } from '@/features/tenants/types'
import { errorMessage } from '@/lib/feedback'
import { ordersApi, type CommercialOrder } from '../api'
import { subscribeOrders } from '@/services/realtime/orders'

export function useOrdersPage(tenantId: Ref<string>) {
    const tenant = ref<Tenant>()
    const orders = ref<CommercialOrder[]>([])
    const loading = ref(true)
    const error = ref('')
    const currentMonth = () => { const now = new Date(); return now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') }
    const search = ref('')
    const status = ref('')
    const month = ref(currentMonth())
    const dateField = ref<'created_at' | 'activated_at' | 'administratively_completed_at'>('created_at')
    const consultant = ref('')
    const team = ref('')
    const quickView = ref<'all' | 'progress' | 'activated' | 'completed'>('all')
    const applied = ref({ search: '', status: '', month: currentMonth(), dateField: 'created_at' as typeof dateField.value, consultant: '', team: '', quickView: 'all' as typeof quickView.value })
    const page = ref(1)
    const perPage = 15
    const isCompleted = (order: CommercialOrder) => !!order.administratively_completed_at || ['COMPLETED', 'CONCLUDED'].includes(order.status?.toUpperCase() ?? '')
    const isCancelled = (order: CommercialOrder) => ['CANCELLED', 'CANCELED'].includes(order.status?.toUpperCase() ?? '')
    const monthOf = (value?: string | null) => value?.slice(0, 7) ?? ''
    const consultants = computed(() => Array.from(new Map(orders.value.filter(o => o.consultant_name).map(o => [o.consultant_name!, o.consultant_name!])).values()).sort((a,b) => a.localeCompare(b, 'pt-BR')))
    const teams = computed(() => Array.from(new Map(orders.value.filter(o => o.consultant_team_id).map(o => [o.consultant_team_id!, { id: o.consultant_team_id!, name: o.consultant_team_name || 'Equipe sem nome' }])).values()).sort((a,b) => a.name.localeCompare(b.name, 'pt-BR')))
    const statuses = computed(() => Array.from(new Set(orders.value.map(o => o.order_status || o.status).filter((v): v is string => !!v))).sort((a,b) => a.localeCompare(b, 'pt-BR')))
    const applyFilters = () => { applied.value = { search: search.value, status: status.value, month: month.value, dateField: dateField.value, consultant: consultant.value, team: team.value, quickView: quickView.value }; page.value = 1 }
    const clearFilters = () => { search.value = ''; status.value = ''; month.value = currentMonth(); dateField.value = 'created_at'; consultant.value = ''; team.value = ''; quickView.value = 'all'; applyFilters() }
    const setQuickView = (view: typeof quickView.value) => { quickView.value = view; applyFilters() }
    const summary = computed(() => ({
        progress: orders.value.filter(o => !isCompleted(o) && !isCancelled(o)).length,
        activated: orders.value.filter(o => monthOf(o.activated_at) === month.value).length,
        completed: orders.value.filter(o => monthOf(o.administratively_completed_at) === month.value).length,
    }))
    const filtered = computed(() => orders.value.filter(order => {
        const f = applied.value
        const term = f.search.trim().toLocaleLowerCase('pt-BR')
        if (term && ![order.code, order.customer_name, order.customer_document].some(v => String(v ?? '').toLocaleLowerCase('pt-BR').includes(term))) return false
        if (f.status && (order.order_status || order.status) !== f.status) return false
        if (f.consultant && order.consultant_name !== f.consultant) return false
        if (f.team && order.consultant_team_id !== f.team) return false
        if (f.quickView === 'progress') return !isCompleted(order) && !isCancelled(order)
        if (f.quickView === 'activated') return monthOf(order.activated_at) === f.month
        if (f.quickView === 'completed') return monthOf(order.administratively_completed_at) === f.month
        return !f.month || monthOf(order[f.dateField]) === f.month
    }))
    const total = computed(() => filtered.value.length)
    const lastPage = computed(() => Math.max(1, Math.ceil(total.value / perPage)))
    const paginated = computed(() => filtered.value.slice((page.value - 1) * perPage, page.value * perPage))
    const changePage = (next: number) => { page.value = next }
    let sequence = 0

    async function load() {
        const id = tenantId.value
        const current = ++sequence
        loading.value = true
        error.value = ''
        try {
            const [company, result] = await Promise.all([tenantApi.show(id), ordersApi.list(id)])
            if (current !== sequence || id !== tenantId.value) return
            tenant.value = company.data
            orders.value = result.data
        } catch (failure) {
            if (current === sequence) error.value = errorMessage(failure)
        } finally {
            if (current === sequence) loading.value = false
        }
    }

    // Atualiza o andamento alterado por outros usuários sem recarregar a página.
    // A atualização silenciosa preserva filtros, paginação e a tabela visível.
    let refreshSequence = 0
    async function refreshOrders() {
        const id = tenantId.value
        const current = ++refreshSequence
        if (typeof document !== 'undefined' && document.hidden) return
        try {
            const result = await ordersApi.list(id)
            if (current === refreshSequence && id === tenantId.value) orders.value = result.data
        } catch {
            // Falhas transitórias não devem apagar a listagem já carregada.
        }
    }
    let refreshTimer: ReturnType<typeof setInterval> | undefined
    let unsubscribe: (() => void) | undefined
    let realtimeMounted = false
    function onFocus() { void refreshOrders() }
    onMounted(() => {
        realtimeMounted = true
        unsubscribe = subscribeOrders(tenantId.value, () => { void refreshOrders() })
        // Fallback for installations without Reverb and reconnections.
        refreshTimer = setInterval(() => { void refreshOrders() }, 60000)
        window.addEventListener('focus', onFocus)
        document.addEventListener('visibilitychange', onFocus)
    })
    onUnmounted(() => {
        if (refreshTimer) clearInterval(refreshTimer)
        unsubscribe?.()
        window.removeEventListener('focus', onFocus)
        document.removeEventListener('visibilitychange', onFocus)
        ++refreshSequence
    })

    watch(tenantId, () => {
        ++refreshSequence
        ++sequence
        tenant.value = undefined
        orders.value = []
        search.value = ''
        clearFilters()
        page.value = 1
        void load()
    }, { immediate: true })

    return { tenant, orders, filtered, paginated, total, page, lastPage, perPage, loading, error, search, status, month, dateField, consultant, team, quickView, summary, consultants, teams, statuses, applyFilters, clearFilters, setQuickView, changePage, load }
}
