<script setup lang="ts">
interface TabOption {
  id: string
  label: string
}

withDefaults(defineProps<{
  modelValue: string
  options: TabOption[]
  ariaLabel: string
  variant?: 'default' | 'underlined'
}>(), {
  variant: 'default',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <nav
    class="flex flex-wrap gap-2"
    :class="{ 'border-b border-stone-200 pb-3': variant === 'underlined' }"
    :aria-label="ariaLabel"
  >
    <button
      v-for="option in options"
      :key="option.id"
      type="button"
      class="rounded-lg px-3 py-2 text-sm font-medium transition-colors"
      :class="modelValue === option.id
        ? 'bg-orange-100 text-orange-900'
        : 'bg-stone-100 text-slate-600 hover:bg-stone-200'"
      :aria-current="modelValue === option.id ? 'page' : undefined"
      @click="emit('update:modelValue', option.id)"
    >
      {{ option.label }}
    </button>
  </nav>
</template>
