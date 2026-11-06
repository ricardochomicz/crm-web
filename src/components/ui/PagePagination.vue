<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from './AppIcon.vue'
const props = withDefaults(defineProps<{
  page: number
  lastPage: number
  total: number
  busy?: boolean
  perPage?: number
}>(), { perPage: 15 })
defineEmits<{ change: [page: number] }>()
const pages = computed(() => {
  const from = Math.max(1, Math.min(props.page - 2, props.lastPage - 4))
  return Array.from({ length: Math.min(5, props.lastPage) }, (_, i) => from + i)
})
</script>
<template>
  <nav v-if="total > 0" aria-label="Paginação" class="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm">
    <p class="text-slate-500">{{ total }} resultado(s) · Página {{ page }} de {{ Math.max(1, lastPage) }}</p>
    <div v-if="lastPage > 1" class="flex items-center gap-1.5">
      <button type="button" class="inline-flex size-9 items-center justify-center rounded-lg border border-stone-200 text-slate-600 hover:bg-stone-50 disabled:opacity-40" :disabled="busy || page <= 1" aria-label="Página anterior" title="Página anterior" @click="$emit('change', page - 1)"><AppIcon name="chevronLeft" class="size-4" /></button>
      <button v-for="number in pages" :key="number" type="button" class="size-9 rounded-lg border text-sm font-semibold" :class="number === page ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-stone-200 text-slate-600 hover:bg-stone-50'" :disabled="busy" :aria-label="`Página ${number}`" :aria-current="number === page ? 'page' : undefined" @click="$emit('change', number)">{{ number }}</button>
      <button type="button" class="inline-flex size-9 items-center justify-center rounded-lg border border-stone-200 text-slate-600 hover:bg-stone-50 disabled:opacity-40" :disabled="busy || page >= lastPage" aria-label="Próxima página" title="Próxima página" @click="$emit('change', page + 1)"><AppIcon name="chevronRight" class="size-4" /></button>
    </div>
  </nav>
</template>
