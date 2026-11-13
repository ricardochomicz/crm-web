<script setup lang="ts">
import { ref, watch } from 'vue'
import AppDialog from '@/components/ui/AppDialog.vue'
import ClientContractsPanel from './ClientContractsPanel.vue'
import ClientOverviewPanel from './ClientOverviewPanel.vue'
import ClientSellersHistory from './ClientSellersHistory.vue'
import ClientDetailsTabs from './ClientDetailsTabs.vue'
import type { ClientDetailsTab } from './ClientDetailsTabs.vue'
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
const activeTab = ref<ClientDetailsTab>('data')
const historyOrigin = ref<'client' | 'opportunity' | 'commercial_order' | 'protocol'>('client')
watch(() => props.client?.id, () => {
  consolidationOpen.value = false
  activeTab.value = props.initialTab ?? 'data'
  historyOrigin.value = 'client'
}, { immediate: true })
watch(() => props.initialTab, value => { activeTab.value = value ?? 'data' })
</script>
<template>
      <AppDialog :open="!!client" :title="client?.company_name ?? 'Detalhes do cliente'" description="Dados cadastrais, contratos, contatos e histórico do cliente." size="full" @close="emit('close')">
        <div v-if="client" class="space-y-4">
        <ClientDetailsTabs v-model="activeTab" />
        <ClientOverviewPanel v-if="activeTab === 'data'" :client="client" />
        <ClientOperatorClassifications v-if="activeTab === 'operators'" :client="client" :classes="classes" :writable="writable" :busy="busy" @save="(operatorId, classificationId) => emit('save-operator-classification', operatorId, classificationId)" />
        <ClientContractsPanel
          v-if="activeTab === 'contracts'"
          :client="client"
          :tenant-id="tenantId"
          :writable="writable"
          @consolidate="consolidationOpen = true"
        />
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
        <ClientSellersHistory
          v-if="activeTab === 'sellers'"
          :client="client"
          :sellers="sellers"
        />
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
