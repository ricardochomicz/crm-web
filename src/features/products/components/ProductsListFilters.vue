<script setup lang="ts">
import { computed } from 'vue'
import ListFilters from '@/components/ui/ListFilters.vue'
import SearchSelect from '@/components/ui/SearchSelect.vue'
import AppSearchInput from '@/components/ui/AppSearchInput.vue'

const name = defineModel<string>('name', { required: true })
const operator = defineModel<string>('operator', { required: true })
const category = defineModel<string>('category', { required: true })
const status = defineModel<string>('status', { required: true })
const props = defineProps<{
  total: number
  busy?: boolean
  operators: { id: number; name: string }[]
  categories: string[][]
}>()
const emit = defineEmits<{ search: []; clear: [] }>()
const operatorOptions = computed(() => [
  { value: '', label: 'Todas as operadoras' },
  ...props.operators.map(o => ({ value: String(o.id), label: o.name })),
])
const categoryOptions = computed(() => [
  { value: '', label: 'Todas as categorias' },
  ...props.categories.map(c => ({ value: c[0], label: c[1] })),
])
const statusOptions = [
  { value: '', label: 'Todos' },
  { value: 'active', label: 'Ativos' },
  { value: 'inactive', label: 'Inativos' },
]
</script>
<template>
  <ListFilters :busy="busy" :count-label="`${total} produto(s) encontrado(s)`"
    @search="emit('search')" @clear="emit('clear')">
    <label class="text-xs font-semibold text-slate-600">Buscar por nome
      <AppSearchInput v-model="name" placeholder="Nome do produto" />
    </label>
    <label class="text-xs font-semibold text-slate-600">Operadora
      <SearchSelect v-model="operator" :options="operatorOptions" />
    </label>
    <label class="text-xs font-semibold text-slate-600">Categoria
      <SearchSelect v-model="category" :options="categoryOptions" />
    </label>
    <label class="text-xs font-semibold text-slate-600">Situação
      <SearchSelect v-model="status" :options="statusOptions" />
    </label>
  </ListFilters>
</template>
