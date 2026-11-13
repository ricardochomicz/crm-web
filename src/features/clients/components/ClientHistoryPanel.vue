<script setup lang="ts">
import { ref, watch } from 'vue'
import AppTabs from '@/components/ui/AppTabs.vue'
import TimelinePanel from '@/features/timeline/components/TimelinePanel.vue'
import ClientProtocolHistory from './ClientProtocolHistory.vue'

const props = defineProps<{
  tenantId: string
  clientId: string
  writable: boolean
}>()

type HistoryOrigin = 'client' | 'opportunity' | 'commercial_order' | 'protocol'

const historyOrigin = ref<HistoryOrigin>('client')
const categories: { id: HistoryOrigin; label: string }[] = [
  { id: 'client', label: 'Cliente' },
  { id: 'opportunity', label: 'Oportunidades' },
  { id: 'commercial_order', label: 'Pedidos' },
  { id: 'protocol', label: 'Protocolos' },
]

watch(
  () => [props.tenantId, props.clientId],
  () => { historyOrigin.value = 'client' },
)
function selectOrigin(value: string) {
  const category = categories.find((item) => item.id === value)
  if (category) historyOrigin.value = category.id
}
</script>

<template>
  <section class="space-y-4">
    <AppTabs
      :model-value="historyOrigin"
      :options="categories"
      aria-label="Filtrar histórico por origem"
      variant="underlined"
      @update:model-value="selectOrigin"
    />

    <TimelinePanel
      v-if="historyOrigin !== 'protocol'"
      :tenant-id="tenantId"
      type="client"
      :subject-id="clientId"
      :origin-filter="historyOrigin"
      :can-write="writable && historyOrigin === 'client'"
    />
    <ClientProtocolHistory
      v-else
      :tenant-id="tenantId"
      :client-id="clientId"
    />
  </section>
</template>
