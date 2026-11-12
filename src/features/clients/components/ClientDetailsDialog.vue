<script setup lang="ts">
import { ref, watch } from 'vue'
import AppDialog from '@/components/ui/AppDialog.vue'
import ClientContractRenewals from './ClientContractRenewals.vue'
import ClientContractConsolidationDialog from './ClientContractConsolidationDialog.vue'
import ClientOperatorClassifications from './ClientOperatorClassifications.vue'
import TimelinePanel from '@/features/timeline/components/TimelinePanel.vue'
import { protocolApi, type Protocol } from '@/features/after-sales/api'
import type { Client, Classification, Contact, Seller } from '../api'

const props = defineProps<{
  client: Client | null
  tenantId: string
  writable: boolean
  sellers: Seller[]
  classes: Classification[]
  busy: boolean
  initialTab?: 'data' | 'history'
}>()
const emit = defineEmits<{
  close: []
  'save-operator-classification': [operatorId: number, classificationId: number]
  'edit-contact': [contact?: Contact]
  consolidated: []
}>()
const consolidationOpen = ref(false)
const activeTab = ref<'data' | 'operators' | 'contracts' | 'contacts' | 'sellers' | 'history'>('data')
const historyOrigin = ref<'client' | 'opportunity' | 'commercial_order' | 'protocol'>('client')
const clientProtocols = ref<Protocol[]>([])
const protocolPage = ref(1)
const protocolLastPage = ref(1)
const protocolsLoading = ref(false)
const protocolsError = ref('')
const formatCpf = (cpf: string | null) => cpf && /^\d{11}$/.test(cpf) ? cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4') : cpf
const formatBirthDate = (value: string | null) => value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value.split('-').reverse().join('/') : value
const protocolStatuses: Record<string, string> = {
  open: 'Aberto', in_progress: 'Em atendimento', waiting: 'Aguardando retorno',
  resolved: 'Resolvido', cancelled: 'Cancelado', reopened: 'Reaberto',
}
watch(() => props.client?.id, () => {
  consolidationOpen.value = false
  activeTab.value = props.initialTab ?? 'data'
  historyOrigin.value = 'client'
  protocolPage.value = 1
}, { immediate: true })
watch(() => props.initialTab, value => { activeTab.value = value ?? 'data' })
let requestVersion = 0
async function loadClientProtocols() {
  const clientId = props.client?.id
  const version = ++requestVersion
  if (!clientId || activeTab.value !== 'history' || historyOrigin.value !== 'protocol') return
  protocolsLoading.value = true
  protocolsError.value = ''
  try {
    const response = await protocolApi.list(props.tenantId, { client_id: clientId, page: String(protocolPage.value) })
    if (version !== requestVersion || props.client?.id !== clientId) return
    clientProtocols.value = response.data
    protocolLastPage.value = response.last_page
  } catch (error) {
    if (version === requestVersion) protocolsError.value = error instanceof Error ? error.message : 'Erro ao carregar protocolos.'
  } finally {
    if (version === requestVersion) protocolsLoading.value = false
  }
}
watch([() => props.client?.id, () => props.tenantId, activeTab, historyOrigin, protocolPage], () => { void loadClientProtocols() }, { immediate: true })
</script>
<template>
      <AppDialog :open="!!client" :title="client?.company_name ?? 'Detalhes do cliente'" description="Dados cadastrais, contratos, contatos e histórico do cliente." size="full" @close="emit('close')">
        <div v-if="client" class="space-y-4">
        <div class="flex flex-wrap gap-2">
          <button
            v-for="item in [
              { id: 'data', label: 'Dados' },
              { id: 'contacts', label: 'Pessoas de contato' },
              { id: 'operators', label: 'Operadoras e classificações' },
              { id: 'contracts', label: 'Contratos e renovações' },
              { id: 'sellers', label: 'Histórico de vendedores' },
              { id: 'history', label: 'Histórico' },
            ] as const"
            :key="item.id"
            class="rounded-lg px-3 py-2 text-sm"
            :class="activeTab === item.id ? 'bg-orange-100 text-orange-900' : 'bg-stone-100'"
            @click="activeTab = item.id"
          >
            {{ item.label }}
          </button>
        </div>
        <div v-if="activeTab === 'data'" class="space-y-2 text-sm">
          <p>
            <strong>Operadora atual:</strong> {{ client.operator?.name ?? '—' }}
          </p>
          <p><strong>Contato:</strong> {{ client.phone ?? '—' }} · {{ client.email ?? '—' }}</p>
          <p>
            <strong>Endereço:</strong>
            {{
              [
                client.address,
                client.address_number,
                client.neighborhood,
                client.city,
                client.state,
              ]
                .filter(Boolean)
                .join(', ')
            }}
          </p>
          <p>
            <strong>Contrato:</strong> {{ client.contract_started_on ?? '—' }} até
            {{ client.contract_ends_on ?? '—' }}
          </p>
        </div>
        <ClientOperatorClassifications v-if="activeTab === 'operators'" :client="client" :classes="classes" :writable="writable" :busy="busy" @save="(operatorId, classificationId) => emit('save-operator-classification', operatorId, classificationId)" />
        <button
          v-if="activeTab === 'contracts' && writable"
          type="button"
          class="secondary-button mb-4 inline-flex w-auto"
          @click="consolidationOpen = true"
        >
          Consolidar pedidos deste cliente
        </button>
        <ClientContractRenewals
          v-if="activeTab === 'contracts'"
          :contracts="client.contract_renewals ?? []"
        />
        <div v-if="activeTab === 'contacts'">
          <button v-if="writable" class="mb-4 rounded-lg border px-3 py-2" @click="emit('edit-contact')">
            + Pessoa de contato
          </button>
          <div
            v-for="c in client.contacts"
            :key="c.id"
            class="flex items-center justify-between border-b py-3 text-sm"
          >
            <div>
              <strong>{{ c.name }}</strong> {{ c.is_primary ? '· Principal' : '' }}
              <p class="text-slate-500">
                {{ [c.position, c.phone, c.email].filter(Boolean).join(' · ') }}
              </p>
              <p v-if="c.cpf || c.birth_date" class="mt-1 text-xs text-slate-500">
                <span v-if="c.cpf">CPF: {{ formatCpf(c.cpf) }}</span>
                <span v-if="c.cpf && c.birth_date"> · </span>
                <span v-if="c.birth_date">Nascimento: {{ formatBirthDate(c.birth_date) }}</span>
              </p>
            </div>
            <button v-if="writable" class="rounded-lg border px-3 py-1.5" @click="emit('edit-contact', c)">
              Editar
            </button>
          </div>
          <p v-if="!client.contacts?.length" class="text-sm text-slate-500">
            Nenhum contato cadastrado.
          </p>
        </div>
        <div v-if="activeTab === 'history' && client" class="space-y-4">
          <div class="flex flex-wrap gap-2 border-b border-stone-200 pb-3" aria-label="Filtrar histórico por origem">
            <button
              v-for="category in [
                { id: 'client', label: 'Cliente' },
                { id: 'opportunity', label: 'Oportunidades' },
                { id: 'commercial_order', label: 'Pedidos' },
                { id: 'protocol', label: 'Protocolos' },
              ] as const"
              :key="category.id"
              type="button"
              class="rounded-lg px-4 py-2 text-sm font-medium transition-colors"
              :class="historyOrigin === category.id ? 'bg-orange-100 text-orange-900' : 'bg-stone-100 text-slate-600 hover:bg-stone-200'"
              :aria-pressed="historyOrigin === category.id"
              @click="historyOrigin = category.id; if (category.id === 'protocol') protocolPage = 1"
            >
              {{ category.label }}
            </button>
          </div>
          <TimelinePanel v-if="historyOrigin !== 'protocol'" :tenant-id="tenantId" type="client" :subject-id="client.id" :origin-filter="historyOrigin" :can-write="writable && historyOrigin === 'client'" />
          <div v-else class="space-y-3">
            <p v-if="protocolsLoading" class="py-6 text-center text-sm text-slate-500">Carregando protocolos…</p>
            <p v-else-if="protocolsError" class="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{{ protocolsError }} <button type="button" class="underline" @click="loadClientProtocols">Tentar novamente</button></p>
            <template v-else>
              <div v-for="protocol in clientProtocols" :key="protocol.id" class="rounded-xl border border-stone-200 bg-white p-4">
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <span class="font-semibold text-slate-800">{{ protocol.code }} · {{ protocol.title }}</span>
                  <span class="rounded-lg bg-stone-100 px-2 py-1 text-xs font-medium text-slate-700">{{ protocolStatuses[protocol.status] ?? protocol.status }}</span>
                </div>
                <p class="mt-2 text-sm text-slate-600">Responsável: {{ protocol.assignee_name || 'Não atribuído' }} · Aberto em {{ new Date(protocol.created_at).toLocaleDateString('pt-BR') }}</p>
                <p v-if="protocol.status === 'resolved' && protocol.resolved_at" class="mt-1 text-sm font-medium text-emerald-700">Resolvido em: {{ new Date(protocol.resolved_at).toLocaleString('pt-BR') }}</p>
                <p v-if="protocol.due_at" class="mt-1 text-xs text-slate-500">Prazo: {{ new Date(protocol.due_at).toLocaleString('pt-BR') }}</p>
                <p v-if="protocol.description" class="mt-2 whitespace-pre-line text-sm text-slate-600">{{ protocol.description }}</p>
              </div>
              <p v-if="!clientProtocols.length" class="rounded-xl border border-dashed border-stone-200 p-6 text-center text-sm text-slate-500">Nenhum protocolo registrado para este cliente.</p>
              <div v-if="protocolLastPage > 1" class="flex items-center justify-end gap-3 text-sm">
                <button type="button" class="secondary-button w-auto" :disabled="protocolPage <= 1" @click="protocolPage--">Anterior</button>
                <span>{{ protocolPage }} / {{ protocolLastPage }}</span>
                <button type="button" class="secondary-button w-auto" :disabled="protocolPage >= protocolLastPage" @click="protocolPage++">Próximo</button>
              </div>
            </template>
          </div>
        </div>
        <div v-if="activeTab === 'sellers'" class="space-y-2">
          <p v-for="s in client.sellers" :key="s.id" class="border-b py-2 text-sm">
            {{
              sellers.find((m) => m.id === s.tenant_user_id)?.name ??
              s.membership?.user?.name ??
              s.tenant_user_id
            }}
            · {{ new Date(s.started_at).toLocaleDateString('pt-BR') }} até
            {{ s.ended_at ? new Date(s.ended_at).toLocaleDateString('pt-BR') : 'Atual' }}
            {{ s.reason ? '· ' + s.reason : '' }}
          </p>
          <p v-if="!client.sellers?.length" class="text-sm text-slate-500">
            Nenhuma atribuição registrada.
          </p>
        </div>
        </div>
      </AppDialog>
  <ClientContractConsolidationDialog
    :open="consolidationOpen && !!client"
    :tenant-id="tenantId"
    :client-id="client?.id ?? null"
    :client-name="client?.company_name"
    @close="consolidationOpen = false"
    @consolidated="emit('consolidated')"
  />
</template>
