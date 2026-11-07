<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { toast } from '@/services/toast'
import { errorMessage } from '@/lib/feedback'
import { ordersApi, type CommercialOrder } from '../api'
import TimelinePanel from '@/features/timeline/components/TimelinePanel.vue'
import OrderItemsSection from './OrderItemsSection.vue'
import AppCheckbox from '@/components/ui/AppCheckbox.vue'
import AppDialog from '@/components/ui/AppDialog.vue'
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
const confirmationOpen = ref(false)
const activationDate = ref('')
const moving = ref(false)
const timelineVersion = ref(0)
const selectedStatusName = computed(() => statuses.value.find(status => status.id === statusId.value)?.name.trim().toLocaleLowerCase('pt-BR') ?? '')
const showLineActivation = computed(() => ['ativo', 'parcialmente ativado'].includes(selectedStatusName.value))

const allPendingSelected = computed(() => pendingItems.value.length > 0 && pendingItems.value.every(item => selectedItems.value.includes(item.id)))
const somePendingSelected = computed(() => selectedItems.value.length > 0 && !allPendingSelected.value)
function toggleAllPending(checked: boolean) { selectedItems.value = checked ? pendingItems.value.map(item => item.id) : [] }
function togglePending(id: string, checked: boolean) {
    selectedItems.value = checked ? [...selectedItems.value.filter(value => value !== id), id] : selectedItems.value.filter(value => value !== id)
}
const pendingItems = computed(() => order.value?.items?.filter(item => item.status === 'PENDING' && !item.activated_at && item.quantity === 1) ?? [])
const allLinesWillBeActive = computed(() => !!order.value?.items?.length && order.value.items.every(item => (item.status === 'ACTIVE' && !!item.activated_at) || selectedItems.value.includes(item.id)))
const canComplete = computed(() => !!order.value?.items?.length && order.value.items.every(item => item.status === 'ACTIVE' && !!item.activated_at) && !order.value.administratively_completed_at)
const orderLocked = computed(() => !!order.value?.administratively_completed_at || ['concluido', 'concluído'].includes(selectedStatusName.value))
const displayActivationDate = computed(() => order.value?.activated_at?.slice(0, 10) || order.value?.items?.filter(item => item.activated_at).map(item => item.activated_at!.slice(0, 10)).sort().at(-1) || '')
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
        confirmationOpen.value = false
        statuses.value = options.data
        statusId.value = detail.data.order_status_id ?? ''
        expected.value = detail.data.activated_at?.slice(0, 10) || detail.data.items?.filter(item => item.activated_at).map(item => item.activated_at!.slice(0, 10)).sort().at(-1) || ''
    } catch (failure) {
        if (current === sequence) error.value = errorMessage(failure)
    } finally {
        if (current === sequence) loading.value = false
    }
}

async function save() {
    if (!statusId.value || saving.value || orderLocked.value) return
    if (showLineActivation.value) {
        saving.value = true
        try {
            // Reconsulta o banco antes de selecionar linhas para evitar dados antigos.
            const detail = await ordersApi.show(props.tenantId, props.orderId)
            order.value = detail.data
            if (detail.data.administratively_completed_at) {
                toast.error('Este pedido já está concluído.')
                return
            }
            const pending = detail.data.items?.filter(item => item.status === 'PENDING' && !item.activated_at && item.quantity === 1) ?? []
            const active = detail.data.items?.length && detail.data.items.every(item => item.status === 'ACTIVE' && !!item.activated_at)
            if (!pending.length && !active) {
                toast.error('Não há linhas pendentes disponíveis para ativação. Confira os status das linhas.')
                return
            }
            if (pending.length && !expected.value) {
                toast.error('Informe a data de ativação.')
                return
            }
            if (expected.value && expected.value > new Date().toLocaleDateString('en-CA')) {
                toast.error('A data de ativação não pode ser futura.')
                return
            }
            activationDate.value = expected.value
            selectedItems.value = pending.map(item => item.id)
            confirmationOpen.value = true
        } catch (failure) {
            toast.error(errorMessage(failure))
        } finally {
            saving.value = false
        }
        return
    }
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
    if (moving.value || (!selectedItems.value.length && !canComplete.value) || (selectedItems.value.length > 0 && !activationDate.value)) return
    moving.value = true
    try {
        if (selectedItems.value.length) {
            await ordersApi.activateItems(props.tenantId, props.orderId, {
                item_ids: selectedItems.value,
                activated_at: activationDate.value,
            })
        } else if (canComplete.value) {
            // Pedidos ativados antes da conclusão automática.
            await ordersApi.complete(props.tenantId, props.orderId)
        }
        if (allLinesWillBeActive.value) {
            toast.success('Todas as linhas ativadas. Pedido concluído.')
        } else {
            toast.success('Linhas selecionadas ativadas. As demais continuam pendentes.')
        }
        confirmationOpen.value = false
        await load()
        timelineVersion.value++
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
                            <select v-model="statusId" class="field mt-2 w-full" required :disabled="orderLocked">
                                <option value="" disabled>Selecione</option>
                                <option v-for="status in statuses" :key="status.id" :value="status.id">{{ status.name }}</option>
                            </select>
                        </label>
                        <label class="text-sm font-semibold text-slate-700">Data de ativação
                            <input v-model="expected" type="date" class="field mt-2 w-full" :max="new Date().toLocaleDateString('en-CA')" :disabled="orderLocked" />
                        </label>
                    </div>
                    <div class="mt-4 flex justify-end">
                        <button type="submit" class="primary-button w-auto" :disabled="saving || !statusId || orderLocked">{{ saving ? 'Salvando…' : 'Salvar alterações' }}</button>
                    </div>
                </form>

                <p v-if="orderLocked" class="text-sm font-medium text-slate-600">Pedido concluído. Status e data de ativação bloqueados para edição.</p>
                <p v-if="displayActivationDate" class="text-sm text-slate-600">Última ativação registrada: <strong>{{ displayActivationDate.split('-').reverse().join('/') }}</strong></p>
                <OrderItemsSection :items="order.items || []" :count="order.line_quantity" />
            </div>

            <aside class="min-w-0 rounded-xl border border-stone-200 p-5">
                <h3 class="mb-4 font-semibold text-slate-800">Timeline do pedido</h3>
                <TimelinePanel :key="timelineVersion" :tenant-id="tenantId" type="commercial_order" :subject-id="order.id" :can-write="true" />
            </aside>
        </div>
        <AppDialog :open="confirmationOpen" title="Confirmar ativação das linhas" size="wide" :busy="moving" @close="confirmationOpen = false">
            <div class="space-y-4">
                <p v-if="pendingItems.length" class="text-sm text-slate-700">Confirma a data de ativação <strong>{{ activationDate.split('-').reverse().join('/') }}</strong> para as linhas selecionadas?</p>
                <p v-else class="text-sm text-slate-700">Todas as linhas já estão ativadas. Confirma a conclusão do pedido?</p>
                <p v-if="pendingItems.length" class="text-sm text-slate-500">Todas as linhas pendentes estão selecionadas. Desmarque as que ainda não foram ativadas.</p>
                <p v-if="pendingItems.length" class="text-sm font-semibold text-slate-700">{{ selectedItems.length }} de {{ pendingItems.length }} linhas selecionadas</p>
                <p v-if="allLinesWillBeActive" class="rounded-lg bg-orange-50 p-3 text-sm font-medium text-orange-800">Todas as linhas estarão ativas. Ao confirmar, o pedido também será concluído.</p>
                        <div v-if="pendingItems.length" class="overflow-hidden rounded-lg border border-stone-200">
                            <div class="flex items-center gap-3 border-b border-stone-200 bg-stone-50 px-3 py-2">
                                <AppCheckbox :model-value="allPendingSelected" :indeterminate="somePendingSelected"
                                    label="Selecionar todas as linhas" @update:model-value="toggleAllPending" />
                            </div>
                            <div class="max-h-48 overflow-y-auto">
                                <div v-for="item in pendingItems" :key="item.id" class="flex items-center gap-3 border-b border-stone-100 px-3 py-2 last:border-b-0">
                                    <AppCheckbox :model-value="selectedItems.includes(item.id)"
                                        :label="item.line_number || item.description || 'Linha ' + item.id.slice(0, 8)"
                                        :show-label="false" @update:model-value="checked => togglePending(item.id, checked)" />
                                    <span class="text-sm text-slate-700">{{ item.line_number || 'Linha' }} — {{ item.description || item.id.slice(0, 8) }}</span>
                                </div>
                            </div>
                        </div>
                <p v-if="pendingItems.length && !selectedItems.length" class="text-sm text-rose-700">Selecione pelo menos uma linha para continuar.</p>
                <div class="flex flex-wrap justify-end gap-2 border-t border-stone-200 pt-4">
                    <button type="button" class="secondary-button w-auto" :disabled="moving" @click="confirmationOpen = false">Cancelar</button>
                    <button type="button" class="primary-button w-auto" :disabled="moving || (!selectedItems.length && !canComplete)" @click="activateSelected">
                        {{ moving ? 'Confirmando…' : allLinesWillBeActive ? 'Confirmar e concluir pedido' : 'Confirmar ativação' }}
                    </button>
                </div>
            </div>
        </AppDialog>
    </section>
</template>
