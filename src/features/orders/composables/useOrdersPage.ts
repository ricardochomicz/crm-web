import { computed, ref, watch, type Ref } from 'vue'
import { tenantApi } from '@/features/tenants/api'
import type { Tenant } from '@/features/tenants/types'
import { errorMessage } from '@/lib/feedback'
import { ordersApi, type CommercialOrder } from '../api'

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

    watch(tenantId, () => {
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
