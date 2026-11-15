<script setup lang="ts">
defineProps<{
  title: string
  description: string
  anchor?: string
}>()
</script>

<template>
  <div :id="anchor" class="flex flex-wrap items-end justify-between gap-2 border-b border-stone-200 pb-3 scroll-mt-24">
    <div>
      <h2 class="text-lg font-bold tracking-tight text-slate-900">{{ title }}</h2>
      <p class="mt-1 text-xs text-slate-500">{{ description }}</p>
    </div>
    <slot />
  </div>
</template>
