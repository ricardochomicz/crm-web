<script setup lang="ts">
withDefaults(defineProps<{ loading?: boolean; error?: string; label?: string }>(), {
  label: 'Carregando seu espaço…',
})
defineEmits<{ retry: [] }>()
</script>
<template>
  <div
    v-if="loading"
    role="status"
    class="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-6 text-sm text-slate-500"
  >
    <span
      class="size-5 animate-spin rounded-full border-2 border-orange-100 border-t-orange-600 motion-reduce:animate-none"
    />{{ label }}
  </div>
  <div
    v-else-if="error"
    role="alert"
    class="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800"
  >
    <p>{{ error }}</p>
    <button
      type="button"
      class="mt-3 font-semibold underline underline-offset-4"
      @click="$emit('retry')"
    >
      Tentar novamente
    </button>
  </div>
</template>
