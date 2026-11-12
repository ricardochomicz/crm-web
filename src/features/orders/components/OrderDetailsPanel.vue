<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { formatCustomerDocument } from '../utils/formatCustomerDocument'
import { toast } from '@/services/toast'
import { errorMessage } from '@/lib/feedback'
import { ordersApi, type CommercialOrder } from '../api'
import TimelinePanel from '@/features/timeline/components/TimelinePanel.vue'
import ClientDocumentsPanel from '@/features/opportunities/components/ClientDocumentsPanel.vue'
import OrderItemsSection from './OrderItemsSection.vue'
import OrderCommissionsPanel from './OrderCommissionsPanel.vue'
import { tenantApi } from '@/features/tenants/api'
import { can, type Tenant } from '@/features/tenants/types'
import AppCheckbox from '@/components/ui/AppCheckbox.vue'
import AppDialog from '@/components/ui/AppDialog.vue'
import SearchSelect from '@/components/ui/SearchSelect.vue'
import { orderStatusesApi, type OrderStatus } from '@/features/order-statuses/api'

const props = defineProps<{ tenantId: string; orderId: string; canManage?: boolean }>()
const emit = defineEmits<{ close: []; saved: [] }>()
const order = ref<CommercialOrder | null>(null)
const formattedDocument = computed(() => formatCustomerDocument(order.value?.customer_document))
const activeTab = ref<'workflow' | 'documents' | 'commissions'>('workflow')
const tenant = ref<Tenant>()
const isCommissionManager = computed(
  () => tenant.value?.role === 'OWNER' || tenant.value?.role === 'MANAGER',
)
const canViewCommissions = computed(
  () => isCommissionManager.value && can(tenant.value, 'commissions.view'),
)
const canReviseCommissions = computed(
  () =>
    isCommissionManager.value &&
    can(tenant.value, 'commissions.manage') &&
    !!tenant.value?.access?.allows_operational_writes,
)
const statuses = ref<OrderStatus[]>([])
const statusId = ref('')
const loading = ref(false)
const saving = ref(false)
const selectedItems = ref<string[]>([])
const confirmationOpen = ref(false)
const correctionOpen = ref(false)
const correctionReason = ref('')
const correctionStatusId = ref('')
const activationDate = ref('')
const moving = ref(false)
const timelineVersion = ref(0)
const activationStatuses = ['ativo', 'parcialmente ativado']
const statusOptions = computed(() =>
  statuses.value
    .filter(
      (status) =>
        !['concluido', 'concluído'].includes(status.name.trim().toLocaleLowerCase('pt-BR')),
    )
    .map((status) => ({ value: status.id, label: status.name })),
)
const activeCount = computed(
  () =>
    order.value?.items
      ?.filter((item) => item.status === 'ACTIVE')
      .reduce((total, item) => total + item.quantity, 0) ?? 0,
)
const pendingCount = computed(
  () =>
    order.value?.items
      ?.filter((item) => item.status === 'PENDING')
      .reduce((total, item) => total + item.quantity, 0) ?? 0,
)
const canEditWorkflow = computed(() => !!props.canManage && !orderLocked.value)
function today() {
  const date = new Date()
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}
const validActivation = computed(
  () => selectedItems.value.length > 0 && !!activationDate.value && activationDate.value <= today(),
)

const allPendingSelected = computed(
  () =>
    pendingItems.value.length > 0 &&
    pendingItems.value.every((item) => selectedItems.value.includes(item.id)),
)
const somePendingSelected = computed(
  () => selectedItems.value.length > 0 && !allPendingSelected.value,
)
function toggleAllPending(checked: boolean) {
  selectedItems.value = checked ? pendingItems.value.map((item) => item.id) : []
}
function togglePending(id: string, checked: boolean) {
  selectedItems.value = checked
    ? [...selectedItems.value.filter((value) => value !== id), id]
    : selectedItems.value.filter((value) => value !== id)
}
const pendingItems = computed(
  () =>
    order.value?.items?.filter(
      (item) => item.status === 'PENDING' && !item.activated_at && item.quantity === 1,
    ) ?? [],
)
const allLinesWillBeActive = computed(
  () =>
    !!order.value?.items?.length &&
    order.value.items.every(
      (item) =>
        (item.status === 'ACTIVE' && !!item.activated_at) || selectedItems.value.includes(item.id),
    ),
)
const canComplete = computed(
  () =>
    !!order.value?.items?.length &&
    order.value.items.every((item) => item.status === 'ACTIVE' && !!item.activated_at) &&
    !order.value.administratively_completed_at,
)
const orderLocked = computed(() => !!order.value?.administratively_completed_at)
const error = ref('')
let sequence = 0

async function load() {
  const current = ++sequence
  loading.value = true
  error.value = ''
  try {
    const [detail, company, options] = await Promise.all([
      ordersApi.show(props.tenantId, props.orderId),
      tenantApi.show(props.tenantId),
      props.canManage
        ? orderStatusesApi.list(props.tenantId)
        : Promise.resolve({ data: [] as OrderStatus[] }),
    ])
    if (current !== sequence) return
    order.value = detail.data
    tenant.value = company.data
    if (!canViewCommissions.value && activeTab.value === 'commissions') activeTab.value = 'workflow'
    selectedItems.value = []
    confirmationOpen.value = false
    statuses.value = options.data
    statusId.value = statusOptions.value.some(
      (status) => status.value === detail.data.order_status_id,
    )
      ? (detail.data.order_status_id ?? '')
      : ''
  } catch (failure) {
    if (current === sequence) error.value = errorMessage(failure)
  } finally {
    if (current === sequence) loading.value = false
  }
}

async function openActivation() {
  if (!props.canManage || saving.value || moving.value || orderLocked.value) return
  saving.value = true
  try {
    const detail = await ordersApi.show(props.tenantId, props.orderId)
    order.value = detail.data
    if (orderLocked.value) {
      toast.error('Este pedido já está concluído.')
      return
    }
    if (!pendingItems.value.length && !canComplete.value) {
      toast.error('Não há linhas pendentes disponíveis para ativação.')
      return
    }
    selectedItems.value = []
    activationDate.value = ''
    confirmationOpen.value = true
  } catch (failure) {
    toast.error(errorMessage(failure))
  } finally {
    saving.value = false
  }
}

async function selectStatus(value: string | number) {
  if (saving.value || moving.value || orderLocked.value) return
  const selected = statuses.value.find((status) => status.id === String(value))
  if (!selected) return
  if (activationStatuses.includes(selected.name.trim().toLocaleLowerCase('pt-BR'))) {
    await openActivation()
    return
  }
  if (selected.id === order.value?.order_status_id) return
  if (selected.name.trim().toLocaleLowerCase('pt-BR') === 'para correção') {
    correctionStatusId.value = selected.id
    correctionReason.value = ''
    correctionOpen.value = true
    return
  }
  statusId.value = selected.id
  await save()
}

async function submitCorrection() {
  if (!correctionReason.value.trim() || saving.value || !correctionStatusId.value) return
  statusId.value = correctionStatusId.value
  await save(correctionReason.value.trim())
  if (order.value?.order_status_id === correctionStatusId.value) correctionOpen.value = false
}

async function save(correctionReason?: string) {
  if (!props.canManage || !statusId.value || saving.value || moving.value || !canEditWorkflow.value)
    return
  saving.value = true
  try {
    await ordersApi.updateWorkflow(props.tenantId, props.orderId, {
      order_status_id: statusId.value,
      expected_activation_at: order.value?.expected_activation_at?.slice(0, 10) || null,
      ...(correctionReason ? { correction_reason: correctionReason } : {}),
    })
    toast.success('Pedido atualizado.')
    await load()
    timelineVersion.value++
    emit('saved')
  } catch (failure) {
    statusId.value = order.value?.order_status_id ?? ''
    toast.error(errorMessage(failure))
  } finally {
    saving.value = false
  }
}
async function activateSelected() {
  if (
    !props.canManage ||
    moving.value ||
    orderLocked.value ||
    (!validActivation.value && !canComplete.value)
  )
    return
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

watch(
  () => [props.tenantId, props.orderId],
  () => {
    activeTab.value = 'workflow'
    void load()
  },
  { immediate: true },
)
</script>

<template>
  <section class="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
    <header class="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div>
        <p class="eyebrow">PEDIDO COMERCIAL</p>
        <h2 class="mt-2 text-xl font-semibold text-slate-800">Detalhes do pedido</h2>
        <div v-if="order && !loading" class="mt-3 space-y-1">
          <p class="text-sm font-semibold text-slate-800">{{ order.customer_name }}</p>
          <p class="text-xs text-slate-500">
            {{
              (order.customer_document || '').replace(/\\D/g, '').length === 11
                ? 'CPF'
                : 'CNPJ/CPF'
            }}: {{ formattedDocument }}
          </p>
        </div>
      </div>
      <button type="button" class="secondary-button w-auto" @click="emit('close')">Fechar</button>
    </header>
    <p v-if="loading" class="text-sm text-slate-500">Carregando pedido…</p>
    <p v-else-if="error" class="text-sm text-rose-700">{{ error }}</p>
    <nav
      v-if="order && !loading"
      class="mb-5 flex flex-wrap gap-2 border-b border-stone-200 pb-3"
      aria-label="Seções do pedido"
    >
      <button
        type="button"
        class="rounded-lg px-4 py-2 text-sm font-semibold"
        :class="activeTab === 'workflow' ? 'bg-orange-50 text-orange-700' : 'text-slate-600'"
        @click="activeTab = 'workflow'"
      >
        Andamento do pedido
      </button>
      <button
        v-if="order.client_id"
        type="button"
        class="rounded-lg px-4 py-2 text-sm font-semibold"
        :class="activeTab === 'documents' ? 'bg-orange-50 text-orange-700' : 'text-slate-600'"
        @click="activeTab = 'documents'"
      >
        Anexos do Cliente
      </button>
      <button
        v-if="canViewCommissions"
        type="button"
        class="rounded-lg px-4 py-2 text-sm font-semibold"
        :class="activeTab === 'commissions' ? 'bg-orange-50 text-orange-700' : 'text-slate-600'"
        @click="activeTab = 'commissions'"
      >
        Comissões
      </button>
    </nav>
    <OrderCommissionsPanel
      v-if="order && !loading && !error && activeTab === 'commissions' && canViewCommissions"
      :key="tenantId + ':' + orderId"
      :tenant-id="tenantId"
      :order-id="orderId"
      :writable="canReviseCommissions"
    />
    <ClientDocumentsPanel
      v-if="order && !loading && activeTab === 'documents' && order.client_id"
      :tenant-id="tenantId"
      :client-id="order.client_id"
      :can-upload="false"
    />
    <div
      v-else-if="order && activeTab === 'workflow'"
      class="grid items-start gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,1fr)]"
    >
      <div class="min-w-0 space-y-5">
        <section class="rounded-xl border border-stone-200 bg-stone-50/60 p-5">
          <h3 class="mb-4 font-semibold text-slate-800">Resumo comercial</h3>
          <dl class="grid gap-x-5 gap-y-4 sm:grid-cols-2">
            <div class="min-w-0">
              <dt class="text-xs font-medium text-slate-500">Pedido</dt>
              <dd class="mt-1 break-all text-sm font-semibold text-slate-800">
                {{ order.code || order.id.slice(0, 8) }}
              </dd>
            </div>
            <div class="min-w-0">
              <dt class="text-xs font-medium text-slate-500">Cliente</dt>
              <dd class="mt-1 text-sm font-semibold text-slate-800">{{ order.customer_name }}</dd>
            </div>
            <div class="min-w-0">
              <dt class="text-xs font-medium text-slate-500">Tipo de negociação</dt>
              <dd class="mt-1 text-sm font-semibold text-slate-800">
                {{
                  order.order_type
                    ? order.order_type
                        .replace(/[_-]/g, ' ')
                        .toLocaleLowerCase('pt-BR')
                        .replace(/(^|\\s)\\S/g, (letter) => letter.toLocaleUpperCase('pt-BR'))
                    : 'Não informado'
                }}
              </dd>
            </div>
            <div class="min-w-0">
              <dt class="text-xs font-medium text-slate-500">Consultor responsável</dt>
              <dd class="mt-1 text-sm font-semibold text-slate-800">
                {{ order.consultant_name || 'Não informado' }}
              </dd>
            </div>
            <div>
              <dt class="text-xs font-medium text-slate-500">Quantidade de linhas</dt>
              <dd class="mt-1 text-lg font-semibold text-slate-800">{{ order.line_quantity }}</dd>
            </div>
            <div>
              <dt class="text-xs font-medium text-slate-500">Mensalidade total</dt>
              <dd class="mt-1 text-lg font-semibold text-slate-800">
                {{
                  Number(order.monthly_amount).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })
                }}
              </dd>
            </div>
          </dl>
        </section>

        <section v-if="canEditWorkflow" class="rounded-xl border border-stone-200 p-5">
          <h3 class="mb-4 font-semibold text-slate-800">Acompanhamento do pedido</h3>
          <label class="block text-sm font-semibold text-slate-700">
            Status do pedido
            <SearchSelect
              :model-value="statusId"
              :options="statusOptions"
              placeholder="Selecione o status"
              :disabled="saving || moving"
              class="mt-2"
              @update:model-value="selectStatus"
            />
          </label>
          <p v-if="saving" class="mt-3 text-xs text-slate-500" role="status">Atualizando pedido…</p>
        </section>

        <section v-if="!canManage" class="rounded-xl border border-stone-200 bg-stone-50 p-5">
          <h3 class="font-semibold text-slate-800">Andamento do pedido</h3>
          <p class="mt-2 text-sm text-slate-700">
            Status atual:
            <strong>{{ order.order_status || order.status || 'Não informado' }}</strong>
          </p>
          <p v-if="order.expected_activation_at" class="mt-1 text-sm text-slate-600">
            Previsão de ativação:
            {{ new Date(order.expected_activation_at).toLocaleDateString('pt-BR') }}
          </p>
          <p class="mt-2 text-xs text-slate-500">
            Consulta somente leitura. A movimentação é realizada pela equipe responsável.
          </p>
        </section>
        <section class="space-y-4 rounded-xl border border-stone-200 p-5">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h3 class="font-semibold text-slate-800">Ativação das linhas</h3>
              <p class="mt-1 text-sm font-medium text-slate-700">
                {{
                  activeCount === 0
                    ? 'Aguardando ativação'
                    : pendingCount > 0
                      ? 'Parcialmente ativado'
                      : 'Linhas ativadas'
                }}
              </p>
            </div>
            <button
              v-if="
                canManage && !orderLocked && activeCount > 0 && (pendingItems.length || canComplete)
              "
              type="button"
              class="primary-button w-auto"
              :disabled="saving || moving"
              @click="openActivation"
            >
              {{ saving ? 'Carregando…' : canComplete ? 'Concluir pedido' : 'Registrar ativação' }}
            </button>
          </div>
          <dl class="grid grid-cols-3 gap-3">
            <div class="rounded-lg bg-stone-50 p-3">
              <dt class="text-xs text-slate-500">Total de linhas</dt>
              <dd class="mt-1 text-xl font-semibold">{{ order.line_quantity }}</dd>
            </div>
            <div class="rounded-lg bg-emerald-50 p-3">
              <dt class="text-xs text-emerald-700">Ativas</dt>
              <dd class="mt-1 text-xl font-semibold text-emerald-700">{{ activeCount }}</dd>
            </div>
            <div class="rounded-lg bg-amber-50 p-3">
              <dt class="text-xs text-amber-800">Pendentes</dt>
              <dd class="mt-1 text-xl font-semibold text-amber-800">{{ pendingCount }}</dd>
            </div>
          </dl>
          <p class="text-sm text-slate-500">
            Cada linha mantém sua data de ativação. Registre as próximas ativações selecionando
            apenas as linhas que foram efetivadas.
          </p>
          <p v-if="orderLocked" class="text-sm font-medium text-slate-600">
            Pedido concluído. Consulte abaixo as datas de cada linha.
          </p>
          <p v-else-if="pendingCount && !pendingItems.length" class="text-sm text-amber-800">
            Existem itens pendentes que precisam ser individualizados antes de registrar a ativação.
          </p>
        </section>

        <OrderItemsSection :items="order.items || []" :count="order.line_quantity" />
      </div>

      <aside class="min-w-0 rounded-xl border border-stone-200 p-5">
        <h3 class="mb-4 font-semibold text-slate-800">Timeline do pedido</h3>
        <TimelinePanel
          :key="timelineVersion"
          :tenant-id="tenantId"
          type="commercial_order"
          :subject-id="order.id"
          :can-write="!!canManage"
        />
      </aside>
    </div>
    <AppDialog
      :open="!!canManage && correctionOpen"
      title="Devolver pedido para correção"
      :busy="saving"
      @close="correctionOpen = false"
    >
      <form class="space-y-4" @submit.prevent="submitCorrection">
        <p class="text-sm text-slate-600">
          Informe o que o consultor precisa corrigir. A oportunidade retornará ao Kanban na coluna
          Para Correção.
        </p>
        <label class="block text-sm font-semibold text-slate-700"
          >Motivo da devolução
          <textarea
            v-model="correctionReason"
            class="field mt-2 min-h-28 w-full"
            maxlength="2000"
            required
            placeholder="Ex.: Renegociar o plano e confirmar o valor mensal."
          />
        </label>
        <div class="flex justify-end gap-2">
          <button
            type="button"
            class="secondary-button w-auto"
            :disabled="saving"
            @click="correctionOpen = false"
          >
            Cancelar</button
          ><button
            type="submit"
            class="primary-button w-auto"
            :disabled="saving || !correctionReason.trim()"
          >
            Confirmar devolução
          </button>
        </div>
      </form>
    </AppDialog>
    <AppDialog
      :open="!!canManage && confirmationOpen"
      :title="canComplete ? 'Concluir pedido' : 'Registrar ativação'"
      size="wide"
      :busy="moving"
      @close="confirmationOpen = false"
    >
      <form class="space-y-4" @submit.prevent="activateSelected">
        <label v-if="pendingItems.length" class="block text-sm font-semibold text-slate-700"
          >Data efetiva da ativação
          <input
            v-model="activationDate"
            type="date"
            class="field mt-2"
            :max="today()"
            :disabled="moving"
            required
          />
          <span class="mt-2 block text-xs font-normal text-slate-500"
            >Esta data será registrada somente nas linhas selecionadas.</span
          >
        </label>
        <p v-else class="text-sm text-slate-700">
          Todas as linhas já estão ativadas. Confirma a conclusão do pedido?
        </p>
        <p v-if="pendingItems.length" class="text-sm text-slate-500">
          Selecione somente as linhas cuja ativação ou portabilidade foi confirmada nesta data.
        </p>
        <p v-if="pendingItems.length" class="text-sm font-semibold text-slate-700">
          {{ selectedItems.length }} de {{ pendingItems.length }} linhas selecionadas
        </p>
        <p
          v-if="allLinesWillBeActive"
          class="rounded-lg bg-orange-50 p-3 text-sm font-medium text-orange-800"
        >
          Todas as linhas estarão ativas. Ao confirmar, o pedido também será concluído.
        </p>
        <div v-if="pendingItems.length" class="overflow-hidden rounded-lg border border-stone-200">
          <div class="flex items-center gap-3 border-b border-stone-200 bg-stone-50 px-3 py-2">
            <AppCheckbox
              :disabled="moving"
              :model-value="allPendingSelected"
              :indeterminate="somePendingSelected"
              label="Selecionar todas as linhas"
              @update:model-value="toggleAllPending"
            />
          </div>
          <div class="max-h-48 overflow-y-auto">
            <div
              v-for="item in pendingItems"
              :key="item.id"
              class="flex items-center gap-3 border-b border-stone-100 px-3 py-2 last:border-b-0"
            >
              <AppCheckbox
                :disabled="moving"
                :model-value="selectedItems.includes(item.id)"
                :label="item.line_number || item.description || 'Linha ' + item.id.slice(0, 8)"
                :show-label="false"
                @update:model-value="(checked) => togglePending(item.id, checked)"
              />
              <span class="text-sm text-slate-700"
                >{{ item.line_number || 'Linha' }} —
                {{ item.description || item.id.slice(0, 8) }}</span
              >
            </div>
          </div>
        </div>
        <p v-if="pendingItems.length && !selectedItems.length" class="text-sm text-rose-700">
          Selecione pelo menos uma linha para continuar.
        </p>
        <div class="flex flex-wrap justify-end gap-2 border-t border-stone-200 pt-4">
          <button
            type="button"
            class="secondary-button w-auto"
            :disabled="moving"
            @click="confirmationOpen = false"
          >
            Cancelar
          </button>
          <button
            type="submit"
            class="primary-button w-auto"
            :disabled="moving || (!validActivation && !canComplete)"
          >
            {{
              moving
                ? 'Confirmando…'
                : allLinesWillBeActive
                  ? 'Confirmar e concluir pedido'
                  : 'Confirmar ativação'
            }}
          </button>
        </div>
      </form>
    </AppDialog>
  </section>
</template>
