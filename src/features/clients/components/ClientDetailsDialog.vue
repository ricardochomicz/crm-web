<script setup lang="ts">
import { ref, watch } from 'vue'
import AppDialog from '@/components/ui/AppDialog.vue'
import ClientContractsPanel from './ClientContractsPanel.vue'
import ClientOverviewPanel from './ClientOverviewPanel.vue'
import ClientSellersHistory from './ClientSellersHistory.vue'
import ClientDetailsTabs from './ClientDetailsTabs.vue'
import ClientContractConsolidationDialog from './ClientContractConsolidationDialog.vue'
import ClientOperatorClassifications from './ClientOperatorClassifications.vue'
import ClientHistoryPanel from './ClientHistoryPanel.vue'
import ClientContactsPanel from './ClientContactsPanel.vue'
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
const activeTab = ref<'data' | 'contacts' | 'contracts' | 'operators' | 'sellers' | 'history'>('data')
watch(() => props.client?.id, () => {
  consolidationOpen.value = false
  activeTab.value = props.initialTab ?? 'data'
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
        <ClientHistoryPanel
          v-if="activeTab === 'history'"
          :tenant-id="tenantId"
          :client-id="client.id"
          :writable="writable"
        />
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
