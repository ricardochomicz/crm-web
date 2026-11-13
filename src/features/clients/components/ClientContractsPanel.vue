<script setup lang="ts">
import { ref, watch } from 'vue'
import AppTabs from '@/components/ui/AppTabs.vue'
import type { Client } from '../api'
import ClientOrdersHistory from './ClientOrdersHistory.vue'
import ClientContractRenewals from './ClientContractRenewals.vue'

const props = defineProps<{
  client: Client
  tenantId: string
  writable: boolean
}>()

const emit = defineEmits<{ consolidate: [] }>()
const activeTab = ref<'orders' | 'renewals'>('orders')

watch(() => [props.client.id, props.tenantId], () => { activeTab.value = 'orders' })
const contractTabs = [
  { id: 'orders', label: 'Histórico de pedidos' },
  { id: 'renewals', label: 'Renovações' },
] as const

function selectTab(value: string) {
  if (value === 'orders' || value === 'renewals') activeTab.value = value
}
</script>

<template>
  <section class="space-y-4">
    <button
      v-if="writable"
      type="button"
      class="secondary-button inline-flex w-auto"
      @click="emit('consolidate')"
    >
      Consolidar pedidos deste cliente
    </button>
    <AppTabs
      :model-value="activeTab"
      :options="contractTabs"
      aria-label="Informações contratuais"
      @update:model-value="selectTab"
    />
    <ClientOrdersHistory
      v-if="activeTab === 'orders'"
      :tenant-id="tenantId"
      :client-id="client.id"
    />
    <ClientContractRenewals v-else :contracts="client.contract_renewals ?? []" />
  </section>
</template>
