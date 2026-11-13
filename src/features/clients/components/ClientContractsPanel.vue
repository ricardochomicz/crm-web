<script setup lang="ts">
import { ref, watch } from 'vue'
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
    <div class="flex flex-wrap gap-2" role="group" aria-label="Informações contratuais">
      <button
        v-for="tab in [
          { id: 'orders', label: 'Histórico de pedidos' },
          { id: 'renewals', label: 'Renovações' },
        ] as const"
        :key="tab.id"
        type="button"
        class="rounded-lg px-4 py-2 text-sm font-medium"
        :class="activeTab === tab.id ? 'bg-orange-100 text-orange-900' : 'bg-stone-100 text-slate-700'"
        :aria-pressed="activeTab === tab.id"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </div>
    <ClientOrdersHistory
      v-if="activeTab === 'orders'"
      :tenant-id="tenantId"
      :client-id="client.id"
    />
    <ClientContractRenewals v-else :contracts="client.contract_renewals ?? []" />
  </section>
</template>
