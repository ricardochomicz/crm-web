<script setup lang="ts">
export type ClientDetailsTab = 'data' | 'contacts' | 'contracts' | 'operators' | 'sellers' | 'history'

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
</script>

<template>
  <nav class="flex flex-wrap gap-2" aria-label="Seções do cliente">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      type="button"
      class="rounded-lg px-3 py-2 text-sm"
      :class="modelValue === tab.id ? 'bg-orange-100 text-orange-900' : 'bg-stone-100'"
      :aria-current="modelValue === tab.id ? 'page' : undefined"
      @click="emit('update:modelValue', tab.id)"
    >
      {{ tab.label }}
    </button>
  </nav>
</template>
