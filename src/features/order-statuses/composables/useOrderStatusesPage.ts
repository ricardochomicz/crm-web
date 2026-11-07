import { computed, ref, watch, type Ref } from 'vue'
import { tenantApi } from '@/features/tenants/api'
import type { Tenant } from '@/features/tenants/types'
import { errorMessage } from '@/lib/feedback'
import { toast } from '@/services/toast'
import { orderStatusesApi, type OrderStatus } from '../api'

export function useOrderStatusesPage(tenantId: Ref<string>) {
    const tenant = ref<Tenant>()
    const statuses = ref<OrderStatus[]>([])
    const loading = ref(true)
    const busy = ref(false)
    const error = ref('')
    const canManage = ref(false)
    const name = ref('')
    const editingId = ref<string | null>(null)
    const writable = computed(() => canManage.value && !!tenant.value?.access?.allows_operational_writes)
    let sequence = 0

    async function load() {
        const id = tenantId.value
        const current = ++sequence
        loading.value = true
        error.value = ''
        try {
            const [company, result] = await Promise.all([tenantApi.show(id), orderStatusesApi.list(id)])
            if (current !== sequence || id !== tenantId.value) return
            tenant.value = company.data
            statuses.value = result.data
            canManage.value = result.meta.can_manage
        } catch (failure) {
            if (current === sequence) error.value = errorMessage(failure)
        } finally {
            if (current === sequence) loading.value = false
        }
    }

    function edit(status: OrderStatus) {
        editingId.value = status.id
        name.value = status.name
    }

    function cancel() {
        editingId.value = null
        name.value = ''
    }

    async function save() {
        const value = name.value.trim()
        if (!writable.value || busy.value || value.length < 2) return
        const id = tenantId.value
        busy.value = true
        try {
            if (editingId.value) await orderStatusesApi.update(id, editingId.value, value)
            else await orderStatusesApi.create(id, value)
            if (id !== tenantId.value) return
            toast.success(editingId.value ? 'Status atualizado.' : 'Status cadastrado.')
            cancel()
            await load()
        } catch (failure) {
            if (id === tenantId.value) toast.error(errorMessage(failure))
        } finally {
            busy.value = false
        }
    }

    async function setInitial(status: OrderStatus) {
        if (!writable.value || busy.value || status.is_initial) return
        const id = tenantId.value
        busy.value = true
        try {
            await orderStatusesApi.setInitial(id, status.id)
            if (id !== tenantId.value) return
            toast.success('Status inicial atualizado.')
            await load()
        } catch (failure) {
            if (id === tenantId.value) toast.error(errorMessage(failure))
        } finally {
            busy.value = false
        }
    }

    async function remove(status: OrderStatus) {
        if (!writable.value || busy.value || !window.confirm(`Excluir o status "${status.name}"?`)) return
        const id = tenantId.value
        busy.value = true
        try {
            await orderStatusesApi.remove(id, status.id)
            if (id !== tenantId.value) return
            toast.success('Status excluído.')
            if (editingId.value === status.id) cancel()
            await load()
        } catch (failure) {
            if (id === tenantId.value) toast.error(errorMessage(failure))
        } finally {
            busy.value = false
        }
    }

    watch(tenantId, () => {
        ++sequence
        tenant.value = undefined
        statuses.value = []
        canManage.value = false
        cancel()
        void load()
    }, { immediate: true })

    return { tenant, statuses, loading, busy, error, name, editingId, writable, load, edit, cancel, save, setInitial, remove }
}
