<script setup lang="ts">
import { computed } from 'vue'
import ListFilters from '@/components/ui/ListFilters.vue'
import SearchSelect from '@/components/ui/SearchSelect.vue'

const props = defineProps<{
  modelValue: string
  operators: { id: number; name: string }[]
  count: number
  busy?: boolean
}>()
const emit = defineEmits<{
  'update:modelValue': [value: string]
  search: []
  clear: []
}>()
const options = computed(() => [
  { value: '', label: 'Todas as operadoras' },
  ...props.operators.map(operator => ({ value: String(operator.id), label: operator.name })),
])
</script>

<template>
  <ListFilters
    :columns="1"
    :busy="busy"
    :count-label="`${count} resultado(s) encontrado(s)`"
    @search="emit('search')"
    @clear="emit('clear')"
  >
    <label class="text-xs font-semibold text-slate-600">
      Operadora
      <SearchSelect
        :model-value="modelValue"
        :options="options"
        @update:model-value="value => emit('update:modelValue', String(value ?? ''))"
      />
    </label>
  </ListFilters>
</template>
