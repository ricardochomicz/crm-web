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
    const filtered = computed(() => orders.value.filter(order =>
        [order.code, order.customer_name, order.order_status].some(value =>
            String(value ?? '').toLocaleLowerCase('pt-BR').includes(search.value.trim().toLocaleLowerCase('pt-BR'))
        )
    ))
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
        void load()
    }, { immediate: true })

    return { tenant, orders, filtered, loading, error, search, load }
}
