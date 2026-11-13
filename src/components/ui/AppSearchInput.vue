<script setup lang="ts">
withDefaults(defineProps<{
  modelValue: string
  placeholder?: string
  disabled?: boolean
  id?: string
  ariaLabel?: string
}>(), { placeholder: 'Buscar...' })
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
</script>
<template>
  <input :id="id" type="search" :value="modelValue" :placeholder="placeholder"
    :disabled="disabled" :aria-label="ariaLabel" autocomplete="off"
    class="field w-full disabled:cursor-not-allowed disabled:opacity-60"
    @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)" />
</template>
