<script setup lang="ts">
import { computed } from 'vue'
import ListFilters from '@/components/ui/ListFilters.vue'
import SearchSelect from '@/components/ui/SearchSelect.vue'

const search = defineModel<string>('search', { required: true })
const operatorFilter = defineModel<string>('operatorFilter', { required: true })
const renewalMonth = defineModel<string>('renewalMonth', { required: true })
const renewalYear = defineModel<string>('renewalYear', { required: true })

const props = defineProps<{
  operators: { id: number; name: string }[]
  total: number
  activeCount: number
  busy?: boolean
}>()

const emit = defineEmits<{ search: []; clear: [] }>()

const operatorOptions = computed(() => [
  { value: '', label: 'Todas as operadoras' },
  ...props.operators.map((operator) => ({ value: String(operator.id), label: operator.name })),
])

const monthOptions = [
  { value: '', label: 'Todos os meses' },
  ...[
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ].map((name, index) => ({ value: String(index + 1), label: name })),
]
</script>

<template>
  <ListFilters
    :columns="4"
    collapsible
    initially-collapsed
    :busy="busy"
    :active-count="activeCount"
    :count-label="`${total} contrato(s) encontrado(s)`"
    @search="emit('search')"
    @clear="emit('clear')"
  >
    <label class="text-xs font-semibold text-slate-600">
      Buscar cliente
      <input v-model="search" class="field" type="search" placeholder="Nome, CPF ou CNPJ" />
    </label>
    <label class="text-xs font-semibold text-slate-600">
      Operadora
      <SearchSelect v-model="operatorFilter" :options="operatorOptions" />
    </label>
    <label class="text-xs font-semibold text-slate-600">
      Mês da renovação
      <SearchSelect v-model="renewalMonth" :options="monthOptions" />
    </label>
    <label class="text-xs font-semibold text-slate-600">
      Ano da renovação
      <input
        v-model="renewalYear"
        class="field"
        type="number"
        min="2000"
        max="2200"
        placeholder="Ex.: 2028"
      />
    </label>
  </ListFilters>
</template>
