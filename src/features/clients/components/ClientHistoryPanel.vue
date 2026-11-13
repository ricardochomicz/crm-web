<script setup lang="ts">
import { ref, watch } from 'vue'
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
</script>

<template>
  <section class="space-y-4">
    <nav
      class="flex flex-wrap gap-2 border-b border-stone-200 pb-3"
      aria-label="Filtrar histórico por origem"
    >
      <button
        v-for="category in categories"
        :key="category.id"
        type="button"
        class="rounded-lg px-4 py-2 text-sm font-medium transition-colors"
        :class="historyOrigin === category.id
          ? 'bg-orange-100 text-orange-900'
          : 'bg-stone-100 text-slate-600 hover:bg-stone-200'"
        :aria-pressed="historyOrigin === category.id"
        @click="historyOrigin = category.id"
      >
        {{ category.label }}
      </button>
    </nav>

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
