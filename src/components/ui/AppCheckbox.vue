<script setup lang="ts">
import { computed, useId } from 'vue'
const props = withDefaults(defineProps<{ modelValue: boolean; label: string; indeterminate?: boolean; disabled?: boolean; showLabel?: boolean }>(), { indeterminate: false, disabled: false, showLabel: false })
const emit = defineEmits<{ 'update:modelValue': [checked: boolean] }>()
const id = useId()
const active = computed(() => props.modelValue || props.indeterminate)
</script>
<template>
  <label :for="id" class="inline-flex cursor-pointer items-center gap-2.5 select-none" :class="disabled ? 'cursor-not-allowed opacity-50' : ''">
    <input :id="id" type="checkbox" class="peer sr-only" :checked="modelValue" :disabled="disabled"
      :aria-label="label" :aria-checked="indeterminate ? 'mixed' : modelValue"
      @change="emit('update:modelValue', ($event.target as HTMLInputElement).checked)" />
    <span class="flex size-5 shrink-0 items-center justify-center rounded-md border-2 transition-all duration-150
      peer-focus-visible:ring-4 peer-focus-visible:ring-orange-200"
      :class="active ? 'border-orange-600 bg-orange-600 text-white shadow-sm' : 'border-slate-300 bg-white text-transparent hover:border-orange-400'">
      <svg v-if="indeterminate" viewBox="0 0 20 20" fill="none" class="size-3.5" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"><path d="M4 10h12" /></svg>
      <svg v-else viewBox="0 0 20 20" fill="none" class="size-3.5" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="m4 10 4 4 8-8" /></svg>
    </span>
    <span v-if="showLabel" class="text-sm font-semibold text-slate-700">{{ label }}</span>
  </label>
</template>