<script setup lang="ts">
import AppIcon from './AppIcon.vue'

withDefaults(defineProps<{
  busy?: boolean
  countLabel?: string
  columns?: 1 | 2 | 3 | 4
  title?: string
}>(), { columns: 4, title: 'Filtros' })

defineEmits<{ search: []; clear: [] }>()
</script>

<template>
  <form
    role="search"
    :aria-busy="busy"
    class="mb-5 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm"
    @submit.prevent="!busy && $emit('search')"
  >
    <div class="flex items-center gap-2 border-b border-stone-100 px-4 py-3 sm:px-5">
      <AppIcon name="search" class="size-4 text-orange-600" />
      <h2 class="text-sm font-semibold text-slate-800">{{ title }}</h2>
    </div>
    <div class="grid gap-3 px-4 py-4 sm:px-5" :class="columns === 1 ? 'grid-cols-1' : columns === 2 ? 'sm:grid-cols-2' : columns === 3 ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2 lg:grid-cols-4'">
      <slot />
    </div>
    <div class="flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 bg-stone-50/50 px-4 py-3 sm:px-5">
      <p class="text-sm text-slate-500" aria-live="polite">{{ countLabel || 'Filtre os resultados da listagem' }}</p>
      <div class="flex flex-wrap items-center gap-2">
        <slot name="actions" />
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
