<script setup lang="ts">
import SearchSelect from '@/components/ui/SearchSelect.vue'
import ListFilters from '@/components/ui/ListFilters.vue'

defineProps<{
  from: string
  to: string
  consultantId: string
  consultants: { id: string; name: string }[]
  loading: boolean
}>()
const emit = defineEmits<{
  'update:from': [value: string]
  'update:to': [value: string]
  'update:consultantId': [value: string]
  search: []
  clear: []
}>()
</script>

<template>
  <ListFilters :busy="loading" :columns="3" title="Filtros de produtividade" @search="emit('search')" @clear="emit('clear')">
    <div>
      <label for="productivity-from" class="mb-1 block text-xs font-semibold text-slate-600">De</label>
      <input id="productivity-from" :value="from" type="date" class="field w-full" @input="emit('update:from', ($event.target as HTMLInputElement).value)" />
    </div>
    <div>
      <label for="productivity-to" class="mb-1 block text-xs font-semibold text-slate-600">Até</label>
      <input id="productivity-to" :value="to" type="date" class="field w-full" @input="emit('update:to', ($event.target as HTMLInputElement).value)" />
    </div>
    <div>
      <label class="mb-1 block text-xs font-semibold text-slate-600">Consultor</label>
      <SearchSelect :model-value="consultantId" :options="[{ value: '', label: 'Todos os consultores' }, ...consultants.map(person => ({ value: person.id, label: person.name }))]" placeholder="Todos os consultores" @update:model-value="emit('update:consultantId', String($event))" />
    </div>
  </ListFilters>
</template>
