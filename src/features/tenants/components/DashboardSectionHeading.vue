<script setup lang="ts">
withDefaults(defineProps<{
  title: string
  description: string
  anchor?: string
  collapsible?: boolean
  expanded?: boolean
}>(), { collapsible: false, expanded: true })
defineEmits<{ toggle: [] }>()
</script>

<template>
  <div :id="anchor" class="flex flex-wrap items-end justify-between gap-2 border-b border-stone-200 pb-3 scroll-mt-24">
    <div>
      <h2 class="text-lg font-bold tracking-tight text-slate-900">{{ title }}</h2>
      <p class="mt-1 text-xs text-slate-500">{{ description }}</p>
    </div>
    <button v-if="collapsible" type="button" class="rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-orange-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-500" :aria-expanded="expanded" :aria-controls="anchor ? anchor + '-content' : undefined" @click="$emit('toggle')">
      {{ expanded ? 'Recolher' : 'Expandir' }} <span aria-hidden="true">{{ expanded ? '⌃' : '⌄' }}</span>
    </button>
    <slot v-else />
  </div>
</template>
