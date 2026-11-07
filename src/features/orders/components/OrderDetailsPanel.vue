<script setup lang="ts">
import { ref, watch } from 'vue'
import { toast } from '@/services/toast'
import { errorMessage } from '@/lib/feedback'
import { ordersApi, type CommercialOrder } from '../api'
import { orderStatusesApi, type OrderStatus } from '@/features/order-statuses/api'

const props = defineProps<{ tenantId: string; orderId: string }>()
const emit = defineEmits<{ close: []; saved: [] }>()
const order = ref<CommercialOrder | null>(null)
const statuses = ref<OrderStatus[]>([])
const statusId = ref('')
const expected = ref('')
const loading = ref(false)
const saving = ref(false)
const error = ref('')
let sequence = 0

async function load() {
    const current = ++sequence
    loading.value = true
    error.value = ''
    try {
        const [detail, options] = await Promise.all([
            ordersApi.show(props.tenantId, props.orderId),
            orderStatusesApi.list(props.tenantId),
        ])
        if (current !== sequence) return
        order.value = detail.data
        statuses.value = options.data
        statusId.value = detail.data.order_status_id ?? ''
        expected.value = detail.data.expected_activation_at?.slice(0, 10) ?? ''
    } catch (failure) {
        if (current === sequence) error.value = errorMessage(failure)
    } finally {
        if (current === sequence) loading.value = false
    }
}

async function save() {
    if (!statusId.value || saving.value) return
    saving.value = true
    try {
        await ordersApi.updateWorkflow(props.tenantId, props.orderId, {
            order_status_id: statusId.value,
            expected_activation_at: expected.value || null,
        })
        toast.success('Pedido atualizado.')
        await load()
        emit('saved')
    } catch (failure) {
        toast.error(errorMessage(failure))
    } finally {
        saving.value = false
    }
}
watch(() => [props.tenantId, props.orderId], () => { void load() }, { immediate: true })
</script>

<template>
    <section class="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <div class="mb-5 flex items-center justify-between gap-3">
            <h2 class="text-lg font-semibold">Detalhes do pedido</h2>
            <button type="button" class="secondary-button w-auto" @click="emit('close')">Fechar</button>
        </div>
        <p v-if="loading" class="text-sm text-slate-500">Carregando pedido…</p>
        <p v-else-if="error" class="text-sm text-rose-700">{{ error }}</p>
        <div v-else-if="order" class="space-y-5">
            <div class="grid gap-3 text-sm sm:grid-cols-3">
                <p><span class="block text-slate-500">Código</span><strong>{{ order.code || order.id.slice(0, 8) }}</strong></p>
                <p><span class="block text-slate-500">Cliente</span><strong>{{ order.customer_name }}</strong></p>
                <p><span class="block text-slate-500">Linhas</span><strong>{{ order.line_quantity }}</strong></p>
            </div>
            <section class="border-t border-stone-100 pt-5">
                <h3 class="mb-3 font-semibold text-slate-800">Itens negociados</h3>
                <div class="overflow-x-auto rounded-xl border border-stone-200">
                    <table class="w-full min-w-[600px] text-left text-sm">
                        <thead class="bg-stone-50 text-xs uppercase text-slate-500">
                            <tr><th class="p-3">Linha</th><th class="p-3">Descrição</th><th class="p-3">Quantidade</th><th class="p-3">Mensalidade unitária</th></tr>
                        </thead>
                        <tbody>
                            <tr v-for="item in order.items || []" :key="item.id" class="border-t border-stone-100">
                                <td class="p-3">{{ item.line_number || '—' }}</td>
                                <td class="p-3">{{ item.description || '—' }}</td>
                                <td class="p-3">{{ item.quantity }}</td>
                                <td class="p-3">{{ Number(item.monthly_unit_amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }}</td>
                            </tr>
                        </tbody>
                    </table>
                    <p v-if="!order.items?.length" class="p-4 text-sm text-slate-500">Nenhum item registrado.</p>
                </div>
            </section>
            <form class="grid gap-4 border-t border-stone-100 pt-5 sm:grid-cols-2" @submit.prevent="save">
                <label class="text-sm font-semibold">Status operacional
                    <select v-model="statusId" class="field mt-2 w-full" required>
                        <option value="" disabled>Selecione</option>
                        <option v-for="status in statuses" :key="status.id" :value="status.id">{{ status.name }}</option>
                    </select>
                </label>
                <label class="text-sm font-semibold">Previsão de ativação
                    <input v-model="expected" type="date" class="field mt-2 w-full" />
                </label>
                <div class="sm:col-span-2">
                    <button type="submit" class="primary-button w-auto" :disabled="saving || !statusId">{{ saving ? 'Salvando…' : 'Salvar alterações' }}</button>
                </div>
            </form>
        </div>
    </section>
</template>
