<script setup lang="ts">
withDefaults(defineProps<{
  label: string
  value?: string
  detail?: string
  accent?: 'violet' | 'emerald' | 'sky' | 'fuchsia'
  dark?: boolean
}>(), { value: '—', detail: '', accent: 'violet', dark: false })
const themes = {
  violet: 'border-violet-400/25 bg-gradient-to-br from-[#231842] to-[#151c3b]',
  emerald: 'border-emerald-400/25 bg-gradient-to-br from-[#103a35] to-[#12243a]',
  sky: 'border-sky-400/25 bg-gradient-to-br from-[#123455] to-[#151d3b]',
  fuchsia: 'border-fuchsia-400/25 bg-gradient-to-br from-[#342047] to-[#171d3b]',
}
</script>

<template>
  <article class="relative overflow-hidden rounded-2xl border p-5 shadow-sm" :class="dark ? themes[accent] : 'border-stone-200 bg-white'">
    <span v-if="dark" aria-hidden="true" class="absolute -bottom-10 -right-10 size-28 rounded-full bg-white/5 blur-2xl" />
    <p class="relative text-xs font-medium" :class="dark ? 'text-slate-300' : 'text-slate-500'">{{ label }}</p>
    <p class="relative mt-3 break-words text-2xl font-bold tracking-tight tabular-nums sm:text-3xl" :class="dark ? 'text-white' : 'text-slate-900'">{{ value }}</p>
    <p class="relative mt-2 text-xs" :class="dark ? 'text-slate-400' : 'text-slate-500'">{{ detail }}</p>
  </article>
</template>
