<script setup lang="ts">
type FilterOption = { value: string; label: string; count?: number }
defineProps<{
  modelValue: string
  options: FilterOption[]
  label?: string
  disabled?: boolean
}>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
</script>
<template>
  <div class="flex flex-wrap gap-2" role="group" :aria-label="label ?? 'Filtrar resultados'">
    <button v-for="option in options" :key="option.value" type="button"
      :disabled="disabled" :aria-pressed="modelValue === option.value"
      class="rounded-lg border px-3 py-1.5 text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
      :class="modelValue === option.value ? 'border-orange-500 bg-orange-50 text-orange-800' : 'border-stone-200 text-slate-600 hover:bg-stone-50'"
      @click="emit('update:modelValue', option.value)">
      {{ option.label }}
      <span v-if="option.count !== undefined" class="ml-1 opacity-60">{{ option.count }}</span>
    </button>
  </div>
</template>
