<script setup lang="ts">
withDefaults(defineProps<{
  show: boolean
  label?: string
}>(), {
  label: 'Carregando página…',
})
</script>

<template>
  <div
    v-if="show"
    class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/25 px-4 backdrop-blur-[2px]"
    role="status"
    aria-live="polite"
    :aria-label="label"
  >
    <div class="flex w-full max-w-xs flex-col items-center rounded-2xl border border-stone-200 bg-white px-8 py-9 text-center shadow-2xl">
      <span
        class="mb-5 size-11 animate-spin rounded-full border-4 border-orange-100 border-t-orange-600 motion-reduce:animate-none"
        aria-hidden="true"
      />
      <p class="text-base font-semibold text-slate-800">{{ label }}</p>
      <p class="mt-1 text-sm text-slate-500">Aguarde um instante.</p>
    </div>
  </div>
</template>
