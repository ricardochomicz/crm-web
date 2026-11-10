<script setup lang="ts">
withDefaults(defineProps<{
  label: string
  value?: string
  detail?: string
  accent?: 'violet' | 'emerald' | 'sky' | 'fuchsia'
}>(), { value: '—', detail: '', accent: 'violet' })
</script>

<template>
  <article class="relative overflow-hidden rounded-2xl border p-5 shadow-sm" :class="'border-stone-200 bg-white'">
    <p class="relative text-xs font-medium" :class="'text-slate-500'">{{ label }}</p>
    <p class="relative mt-3 break-words text-2xl font-bold tracking-tight tabular-nums sm:text-3xl" :class="'text-slate-900'">{{ value }}</p>
    <p class="relative mt-2 text-xs" :class="'text-slate-500'">{{ detail }}</p>
  </article>
</template>
