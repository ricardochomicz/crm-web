<script setup lang="ts">
withDefaults(defineProps<{ tone?: 'success' | 'warning' | 'neutral' | 'danger' }>(), {
  tone: 'neutral',
})
const colors = {
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-600/10',
  warning: 'bg-amber-50 text-amber-800 ring-amber-600/10',
  neutral: 'bg-slate-100 text-slate-600 ring-slate-500/10',
  danger: 'bg-red-50 text-red-700 ring-red-600/10',
}
</script>
<template>
  <span
    class="inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset"
    :class="colors[tone]"
    ><slot
  /></span>
</template>
