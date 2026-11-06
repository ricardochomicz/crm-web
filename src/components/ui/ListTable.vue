<script setup lang="ts">
withDefaults(
  defineProps<{
    minWidth?: string
    label?: string
    busy?: boolean
  }>(),
  { minWidth: '640px', label: 'Listagem' },
)
</script>

<template>
  <div class="overflow-x-auto">
    <table
      :aria-label="label"
      :aria-busy="busy"
      class="w-full text-left text-sm [&_thead]:bg-stone-50 [&_thead]:text-xs [&_thead]:font-semibold [&_thead]:uppercase [&_thead]:tracking-wide [&_thead]:text-slate-500 [&_tbody]:divide-y [&_tbody]:divide-stone-100 [&_tbody_tr]:hover:bg-stone-50/70"
      :style="{ minWidth }"
    >
      <slot />
    </table>
  </div>
</template>
