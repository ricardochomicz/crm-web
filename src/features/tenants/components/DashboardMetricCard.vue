<script setup lang="ts">
withDefaults(defineProps<{ label: string; value?: string; detail?: string }>(), {
  value: '—',
  detail: 'Indicador aguardando integração',
})
</script>

<template>
  <article class="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
    <p class="text-xs font-medium text-slate-500">{{ label }}</p>
    <p class="mt-3 text-3xl font-semibold tracking-tight text-slate-900 tabular-nums">{{ value }}</p>
    <p class="mt-2 text-xs text-slate-400">{{ detail }}</p>
  </article>
</template>
