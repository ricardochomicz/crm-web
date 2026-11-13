<script setup lang="ts">
type OpportunityDialogTab = 'details' | 'documents' | 'history' | 'appointments' | 'comparison' | 'proposal'

defineProps<{ modelValue: OpportunityDialogTab }>()
const emit = defineEmits<{ 'update:modelValue': [tab: OpportunityDialogTab] }>()
const tabs: { id: OpportunityDialogTab; label: string }[] = [
  { id: 'details', label: 'Dados da oportunidade' },
  { id: 'documents', label: 'Anexos do Cliente' },
  { id: 'history', label: 'Histórico' },
  { id: 'appointments', label: 'Agendamentos' },
  { id: 'comparison', label: 'Comparativo de operadoras' },
  { id: 'proposal', label: 'Proposta comercial' },
]
</script>

<template>
  <nav class="mb-5 flex gap-2 overflow-x-auto border-b border-stone-200 pb-3" aria-label="Seções da oportunidade">
    <button v-for="tab in tabs" :key="tab.id" type="button"
      class="shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition-colors"
      :class="modelValue === tab.id ? 'bg-orange-50 text-orange-700' : 'text-slate-600 hover:bg-stone-50'"
      :aria-current="modelValue === tab.id ? 'page' : undefined"
      @click="emit('update:modelValue', tab.id)">
      {{ tab.label }}
    </button>
  </nav>
</template>
