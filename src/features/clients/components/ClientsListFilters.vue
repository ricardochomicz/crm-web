<script setup lang="ts">
import { computed } from 'vue'
import ListFilters from '@/components/ui/ListFilters.vue'
import SearchSelect from '@/components/ui/SearchSelect.vue'

const props = defineProps<{
  search: string
  operatorFilter: string
  operators: { id: number; name: string }[]
  count: number
}>()

const emit = defineEmits<{
  'update:search': [value: string]
  'update:operatorFilter': [value: string]
  search: []
  clear: []
}>()

const operatorOptions = computed(() => [
  { value: '', label: 'Todas as operadoras' },
  ...props.operators.map((operator) => ({
    value: String(operator.id),
    label: operator.name,
  })),
])
</script>

<template>
  <ListFilters
    :columns="2"
    :count-label="`${count} cliente(s) encontrado(s)`"
    @search="emit('search')"
    @clear="emit('clear')"
  >
    <label class="text-xs font-semibold text-slate-600">
      Buscar cliente
      <input
        :value="search"
        type="search"
        class="field"
        placeholder="Nome, documento ou e-mail"
        @input="emit('update:search', ($event.target as HTMLInputElement).value)"
      />
    </label>
    <label class="text-xs font-semibold text-slate-600">
      Operadora
      <SearchSelect
        :model-value="operatorFilter"
        :options="operatorOptions"
        @update:model-value="value => emit('update:operatorFilter', String(value ?? ''))"
      />
    </label>
  </ListFilters>
</template>
