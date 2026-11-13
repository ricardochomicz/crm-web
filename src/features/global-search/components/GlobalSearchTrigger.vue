<script setup lang="ts">
defineEmits<{ click: [] }>()
</script>
<template>
  <button type="button" class="flex min-w-10 items-center gap-2 rounded-xl border border-stone-200 px-3 py-2 text-sm text-slate-500 transition hover:border-orange-300 hover:bg-orange-50 sm:w-64"
    aria-label="Busca global (Ctrl ou Command mais K)" @click="$emit('click')">
    <svg class="size-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>
    <span class="hidden truncate sm:block">Buscar no CRM...</span>
    <span class="ml-auto hidden rounded border border-stone-200 px-1.5 py-0.5 text-[10px] text-slate-400 md:block">Ctrl K</span>
  </button>
</template>
