<script setup lang="ts">
import SearchSelect from '@/components/ui/SearchSelect.vue'
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
  <form class="flex flex-wrap items-end gap-3 rounded-xl border border-stone-200 bg-white p-4" @submit.prevent="emit('search')">
    <label class="text-sm text-slate-700">De
      <input :value="from" type="date" class="mt-1 block rounded-lg border border-stone-300 px-3 py-2" @input="emit('update:from', ($event.target as HTMLInputElement).value)" />
    </label>
    <label class="text-sm text-slate-700">Até
      <input :value="to" type="date" class="mt-1 block rounded-lg border border-stone-300 px-3 py-2" @input="emit('update:to', ($event.target as HTMLInputElement).value)" />
    </label>
    <label class="text-sm text-slate-700">Consultor
      <SearchSelect :model-value="consultantId" class="mt-1" :options="[{ value: '', label: 'Todos os consultores' }, ...consultants.map(person => ({ value: person.id, label: person.name }))]" placeholder="Todos os consultores" @update:model-value="emit('update:consultantId', String($event))" />
    </label>
    <button type="submit" class="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" :disabled="loading">Buscar</button>
    <button type="button" class="rounded-lg border border-stone-300 px-4 py-2 text-sm" :disabled="loading" @click="emit('clear')">Limpar filtros</button>
  </form>
</template>
