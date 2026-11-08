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
    const search = ref('')
    const appliedSearch = ref('')
    const page = ref(1)
    const perPage = 15
    const applyFilters = () => { appliedSearch.value = search.value; page.value = 1 }
    const clearFilters = () => { search.value = ''; appliedSearch.value = ''; page.value = 1 }
    const filtered = computed(() => orders.value.filter(order =>
        [order.code, order.customer_name, order.order_status].some(value =>
            String(value ?? '').toLocaleLowerCase('pt-BR').includes(appliedSearch.value.trim().toLocaleLowerCase('pt-BR'))
        )
    ))
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
    function onFocus() { void refreshOrders() }
    onMounted(() => {
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
        appliedSearch.value = ''
        page.value = 1
        void load()
    }, { immediate: true })

    return { tenant, orders, filtered, paginated, total, page, lastPage, perPage, loading, error, search, applyFilters, clearFilters, changePage, load }
}
