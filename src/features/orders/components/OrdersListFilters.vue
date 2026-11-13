<script setup lang="ts">
import { computed } from 'vue'
import ListFilters from '@/components/ui/ListFilters.vue'
import SearchSelect from '@/components/ui/SearchSelect.vue'
import AppSearchInput from '@/components/ui/AppSearchInput.vue'

const search = defineModel<string>('search', { required: true })
const status = defineModel<string>('status', { required: true })
const month = defineModel<string>('month', { required: true })
const consultant = defineModel<string>('consultant', { required: true })
const team = defineModel<string>('team', { required: true })
const dateField = defineModel<string>('dateField', { required: true })
const props = defineProps<{
  total: number
  busy?: boolean
  statuses: string[]
  consultants: string[]
  teams: { id: string; name: string }[]
}>()
const emit = defineEmits<{ search: []; clear: []; all: [] }>()
const statusOptions = computed(() => [{ value: '', label: 'Todos os status' }, ...props.statuses.map(value => ({ value, label: value }))])
const consultantOptions = computed(() => [{ value: '', label: 'Todos os consultores' }, ...props.consultants.map(value => ({ value, label: value }))])
const teamOptions = computed(() => [{ value: '', label: 'Todas as equipes' }, ...props.teams.map(value => ({ value: value.id, label: value.name }))])
const dateOptions = [
  { value: 'created_at', label: 'Data de criação' },
  { value: 'activated_at', label: 'Data de ativação' },
  { value: 'administratively_completed_at', label: 'Data de conclusão' },
]
</script>
<template>
  <ListFilters :busy="busy" :count-label="total + ' pedido(s) encontrado(s)'" :columns="3"
    collapsible initially-collapsed @search="emit('search')" @clear="emit('clear')">
    <label class="text-xs font-semibold text-slate-600">Empresa, CPF ou CNPJ
      <AppSearchInput v-model="search" placeholder="Nome, razão social ou documento" />
    </label>
    <label class="text-xs font-semibold text-slate-600">Status do pedido
      <SearchSelect v-model="status" :options="statusOptions" />
    </label>
    <label class="text-xs font-semibold text-slate-600">Mês de referência
      <input v-model="month" type="month" class="field w-full" />
    </label>
    <label class="text-xs font-semibold text-slate-600">Consultor
      <SearchSelect v-model="consultant" :options="consultantOptions" />
    </label>
    <label class="text-xs font-semibold text-slate-600">Equipe
      <SearchSelect v-model="team" :options="teamOptions" />
    </label>
    <label class="text-xs font-semibold text-slate-600">Mês considerado pela
      <SearchSelect v-model="dateField" :options="dateOptions" />
    </label>
    <template #actions>
      <button type="button" class="secondary-button w-auto" @click="emit('all')">Todos os pedidos</button>
    </template>
  </ListFilters>
</template>
