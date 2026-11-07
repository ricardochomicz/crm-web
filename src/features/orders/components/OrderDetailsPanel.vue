<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { toast } from '@/services/toast'
import { errorMessage } from '@/lib/feedback'
import { ordersApi, type CommercialOrder } from '../api'
import TimelinePanel from '@/features/timeline/components/TimelinePanel.vue'
import OrderItemsSection from './OrderItemsSection.vue'
import { orderStatusesApi, type OrderStatus } from '@/features/order-statuses/api'

const props = defineProps<{ tenantId: string; orderId: string }>()
const emit = defineEmits<{ close: []; saved: [] }>()
const order = ref<CommercialOrder | null>(null)
const statuses = ref<OrderStatus[]>([])
const statusId = ref('')
const expected = ref('')
const loading = ref(false)
const saving = ref(false)
const selectedItems = ref<string[]>([])
const activationDate = ref(new Date().toLocaleDateString('en-CA'))
const moving = ref(false)
const timelineVersion = ref(0)
const showLineActivation = computed(() => statuses.value.find(status => status.id === statusId.value)?.name.trim().toLocaleLowerCase('pt-BR') === 'ativo')
const pendingItems = computed(() => order.value?.items?.filter(item => item.status === 'PENDING' && !item.activated_at && item.quantity === 1) ?? [])
const canComplete = computed(() => !!order.value?.items?.length && order.value.items.every(item => item.status === 'ACTIVE' && !!item.activated_at) && !order.value.administratively_completed_at)
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
        selectedItems.value = []
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
        timelineVersion.value++
        emit('saved')
    } catch (failure) {
        toast.error(errorMessage(failure))
    } finally {
        saving.value = false
    }
}
async function activateSelected() {
    if (!selectedItems.value.length || !activationDate.value || moving.value) return
    moving.value = true
    try {
        await ordersApi.activateItems(props.tenantId, props.orderId, {
            item_ids: selectedItems.value,
            activated_at: activationDate.value,
        })
        toast.success('Linhas ativadas com sucesso.')
        await load()
        emit('saved')
    } catch (failure) {
        toast.error(errorMessage(failure))
    } finally {
        moving.value = false
    }
}

async function completeOrder() {
    if (!canComplete.value || moving.value) return
    moving.value = true
    try {
        await ordersApi.complete(props.tenantId, props.orderId)
        toast.success('Pedido concluído.')
        await load()
        emit('saved')
    } catch (failure) {
        toast.error(errorMessage(failure))
    } finally {
        moving.value = false
    }
}

watch(() => [props.tenantId, props.orderId], () => { void load() }, { immediate: true })
</script>

<template>
    <section class="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <header class="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
                <p class="eyebrow">PEDIDO COMERCIAL</p>
                <h2 class="mt-2 text-xl font-semibold text-slate-800">Detalhes do pedido</h2>
            </div>
            <button type="button" class="secondary-button w-auto" @click="emit('close')">Fechar</button>
        </header>
        <p v-if="loading" class="text-sm text-slate-500">Carregando pedido…</p>
        <p v-else-if="error" class="text-sm text-rose-700">{{ error }}</p>
        <div v-else-if="order" class="grid items-start gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,1fr)]">
            <div class="min-w-0 space-y-5">
                <section class="rounded-xl border border-stone-200 bg-stone-50/60 p-5">
                    <h3 class="mb-4 font-semibold text-slate-800">Resumo comercial</h3>
                    <dl class="grid gap-x-5 gap-y-4 sm:grid-cols-2">
                        <div class="min-w-0">
                            <dt class="text-xs font-medium text-slate-500">Pedido</dt>
                            <dd class="mt-1 break-all text-sm font-semibold text-slate-800">{{ order.code || order.id.slice(0, 8) }}</dd>
                        </div>
                        <div class="min-w-0">
                            <dt class="text-xs font-medium text-slate-500">Cliente</dt>
                            <dd class="mt-1 text-sm font-semibold text-slate-800">{{ order.customer_name }}</dd>
                        </div>
                        <div>
                            <dt class="text-xs font-medium text-slate-500">Quantidade de linhas</dt>
                            <dd class="mt-1 text-lg font-semibold text-slate-800">{{ order.line_quantity }}</dd>
                        </div>
                        <div>
                            <dt class="text-xs font-medium text-slate-500">Mensalidade total</dt>
                            <dd class="mt-1 text-lg font-semibold text-slate-800">{{ Number(order.monthly_amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }}</dd>
                        </div>
                    </dl>
                </section>

                <form class="rounded-xl border border-stone-200 p-5" @submit.prevent="save">
                    <h3 class="mb-4 font-semibold text-slate-800">Acompanhamento do pedido</h3>
                    <div class="grid gap-4 sm:grid-cols-2">
                        <label class="text-sm font-semibold text-slate-700">Status do pedido
                            <select v-model="statusId" class="field mt-2 w-full" required>
                                <option value="" disabled>Selecione</option>
                                <option v-for="status in statuses" :key="status.id" :value="status.id">{{ status.name }}</option>
                            </select>
                        </label>
                        <label class="text-sm font-semibold text-slate-700">Data de ativação
                            <input v-model="expected" type="date" class="field mt-2 w-full" />
                        </label>
                    </div>
                    <div class="mt-4 flex justify-end">
                        <button type="submit" class="primary-button w-auto" :disabled="saving || !statusId || !!order.administratively_completed_at">{{ saving ? 'Salvando…' : 'Salvar alterações' }}</button>
                    </div>
                </form>

                <section v-if="showLineActivation" class="rounded-xl border border-stone-200 p-5">
                    <h3 class="font-semibold text-slate-800">Ativação das linhas</h3>
                    <p class="mt-2 text-sm text-slate-600">
                        {{ order.activation_summary?.active ?? order.items?.filter(item => item.status === 'ACTIVE').length ?? 0 }}
                        ativas de {{ order.activation_summary?.total ?? order.line_quantity }} linhas.
                    </p>
                    <div v-if="!order.administratively_completed_at && pendingItems.length" class="mt-4 space-y-3">
                        <label class="block text-sm font-semibold text-slate-700">Data de ativação das linhas selecionadas
                            <input v-model="activationDate" type="date" class="field mt-2 w-full" :max="new Date().toLocaleDateString('en-CA')" />
                        </label>
                        <p class="text-xs text-slate-500">Selecione apenas as linhas que deseja ativar agora.</p>
                        <div class="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-stone-200 p-3">
                            <label v-for="item in pendingItems" :key="item.id" class="flex items-center gap-3 text-sm text-slate-700">
                                <input v-model="selectedItems" type="checkbox" :value="item.id" />
                                <span>{{ item.line_number || 'Linha' }} — {{ item.description || item.id.slice(0, 8) }}</span>
                            </label>
                        </div>
                        <button type="button" class="primary-button w-auto" :disabled="moving || !selectedItems.length || !activationDate" @click="activateSelected">
                            {{ moving ? 'Processando…' : `Ativar ${selectedItems.length} linha(s)` }}
                        </button>
                    </div>
                    <p v-else-if="order.administratively_completed_at" class="mt-3 text-sm text-slate-600">Pedido concluído administrativamente.</p>
                    <button v-if="canComplete" type="button" class="primary-button mt-4 w-auto" :disabled="moving" @click="completeOrder">
                        Concluir pedido
                    </button>
                </section>
                <OrderItemsSection :items="order.items || []" :count="order.line_quantity" />
            </div>

            <aside class="min-w-0 rounded-xl border border-stone-200 p-5">
                <h3 class="mb-4 font-semibold text-slate-800">Timeline do pedido</h3>
                <TimelinePanel :key="timelineVersion" :tenant-id="tenantId" type="commercial_order" :subject-id="order.id" :can-write="true" />
            </aside>
        </div>
    </section>
</template>
