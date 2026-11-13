<script setup lang="ts">
import { ref, watch } from 'vue'
import AppDialog from '@/components/ui/AppDialog.vue'
import ClientContractRenewals from './ClientContractRenewals.vue'
import ClientOrdersHistory from './ClientOrdersHistory.vue'
import ClientContractConsolidationDialog from './ClientContractConsolidationDialog.vue'
import ClientOperatorClassifications from './ClientOperatorClassifications.vue'
import TimelinePanel from '@/features/timeline/components/TimelinePanel.vue'
import ClientContactsPanel from './ClientContactsPanel.vue'
import ClientProtocolHistory from './ClientProtocolHistory.vue'
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
const contractsTab = ref<'orders' | 'renewals'>('orders')
const activeTab = ref<'data' | 'operators' | 'contracts' | 'contacts' | 'sellers' | 'history'>('data')
const historyOrigin = ref<'client' | 'opportunity' | 'commercial_order' | 'protocol'>('client')
watch(() => props.client?.id, () => {
  consolidationOpen.value = false
  contractsTab.value = 'orders'
  activeTab.value = props.initialTab ?? 'data'
  historyOrigin.value = 'client'
}, { immediate: true })
watch(() => props.initialTab, value => { activeTab.value = value ?? 'data' })
</script>
<template>
      <AppDialog :open="!!client" :title="client?.company_name ?? 'Detalhes do cliente'" description="Dados cadastrais, contratos, contatos e histórico do cliente." size="full" @close="emit('close')">
        <div v-if="client" class="space-y-4">
        <div class="flex flex-wrap gap-2">
          <button
            v-for="item in [
              { id: 'data', label: 'Dados' },
              { id: 'contacts', label: 'Pessoas de contato' },
              { id: 'contracts', label: 'Contratos e renovações' },
              { id: 'operators', label: 'Operadoras e classificações' },
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
        <section v-if="activeTab === 'contracts'" class="space-y-4">
          <div class="flex flex-wrap gap-2" role="group" aria-label="Informações contratuais">
            <button
              type="button"
              class="rounded-lg px-4 py-2 text-sm font-medium"
              :class="contractsTab === 'orders' ? 'bg-orange-100 text-orange-900' : 'bg-stone-100 text-slate-700'"
              :aria-pressed="contractsTab === 'orders'"
              @click="contractsTab = 'orders'"
            >
              Histórico de pedidos
            </button>
            <button
              type="button"
              class="rounded-lg px-4 py-2 text-sm font-medium"
              :class="contractsTab === 'renewals' ? 'bg-orange-100 text-orange-900' : 'bg-stone-100 text-slate-700'"
              :aria-pressed="contractsTab === 'renewals'"
              @click="contractsTab = 'renewals'"
            >
              Renovações
            </button>
          </div>
          <ClientOrdersHistory
            v-if="contractsTab === 'orders'"
            :tenant-id="tenantId"
            :client-id="client.id"
          />
          <ClientContractRenewals
            v-else
            :contracts="client.contract_renewals ?? []"
          />
        </section>
        <ClientContactsPanel
          v-if="activeTab === 'contacts'"
          :contacts="client.contacts ?? []"
          :writable="writable"
          @edit="(contact) => emit('edit-contact', contact)"
        />
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
              @click="historyOrigin = category.id"
            >
              {{ category.label }}
            </button>
          </div>
          <TimelinePanel v-if="historyOrigin !== 'protocol'" :tenant-id="tenantId" type="client" :subject-id="client.id" :origin-filter="historyOrigin" :can-write="writable && historyOrigin === 'client'" />
          <ClientProtocolHistory
            v-else
            :tenant-id="tenantId"
            :client-id="client.id"
          />
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
