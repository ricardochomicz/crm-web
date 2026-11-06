<script setup lang="ts">
import AppIcon from './AppIcon.vue'
withDefaults(defineProps<{
  busy?: boolean
  countLabel?: string
  columns?: 1 | 2 | 3 | 4
}>(), { columns: 4 })
defineEmits<{ search: []; clear: [] }>()
</script>
<template>
  <form role="search" class="mb-5 rounded-2xl border border-stone-200 bg-white p-4 sm:p-5" @submit.prevent="$emit('search')">
    <div class="grid gap-3" :class="columns === 1 ? 'grid-cols-1' : columns === 2 ? 'sm:grid-cols-2' : columns === 3 ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2 lg:grid-cols-4'">
      <slot />
    </div>
    <div class="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 pt-3">
      <p class="text-sm text-slate-500">{{ countLabel || 'Filtre os resultados da listagem' }}</p>
      <div class="flex flex-wrap items-center gap-2">
        <button type="button" class="secondary-button inline-flex w-auto items-center gap-2" :disabled="busy" @click="$emit('clear')">
          <AppIcon name="clear" class="size-4" /> Limpar filtros
        </button>
        <button type="submit" class="primary-button inline-flex w-auto items-center gap-2" :disabled="busy">
          <AppIcon name="search" class="size-4" /> {{ busy ? 'Buscando…' : 'Buscar' }}
        </button>
      </div>
    </div>
  </form>
</template>
