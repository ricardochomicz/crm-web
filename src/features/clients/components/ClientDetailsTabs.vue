<script setup lang="ts">
import AppTabs from '@/components/ui/AppTabs.vue'

type ClientDetailsTab = 'data' | 'contacts' | 'contracts' | 'operators' | 'sellers' | 'history'

defineProps<{ modelValue: ClientDetailsTab }>()
const emit = defineEmits<{ 'update:modelValue': [tab: ClientDetailsTab] }>()

const tabs: { id: ClientDetailsTab; label: string }[] = [
  { id: 'data', label: 'Dados' },
  { id: 'contacts', label: 'Pessoas de contato' },
  { id: 'contracts', label: 'Contratos e renovações' },
  { id: 'operators', label: 'Operadoras e classificações' },
  { id: 'sellers', label: 'Histórico de vendedores' },
  { id: 'history', label: 'Histórico' },
]

function selectTab(value: string) {
  const tab = tabs.find((item) => item.id === value)
  if (tab) emit('update:modelValue', tab.id)
}
</script>

<template>
  <AppTabs
    :model-value="modelValue"
    :options="tabs"
    aria-label="Seções do cliente"
    @update:model-value="selectTab"
  />
</template>
