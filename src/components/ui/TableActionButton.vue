<script setup lang="ts">
import AppIcon from './AppIcon.vue'

withDefaults(defineProps<{
  icon: 'eye' | 'edit' | 'trash' | 'users' | 'shield' | 'pause' | 'play' | 'user-x' | 'tag' | 'check'
  label: string
  tone?: 'neutral' | 'danger' | 'success'
  disabled?: boolean
  busy?: boolean
  type?: 'button' | 'submit'
}>(), { tone: 'neutral', type: 'button' })

defineEmits<{ click: [event: MouseEvent] }>()
</script>

<template>
  <button
    :type="type"
    :title="label"
    :aria-label="label"
    :disabled="disabled || busy"
    class="group relative inline-flex size-9 shrink-0 items-center justify-center rounded-lg border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
    :class="tone === 'danger'
      ? 'border-red-100 text-red-600 hover:bg-red-50 focus-visible:outline-red-600'
      : tone === 'success'
        ? 'border-emerald-100 text-emerald-700 hover:bg-emerald-50'
        : 'border-stone-200 text-slate-600 hover:border-slate-300 hover:bg-stone-100'"
    @click="$emit('click', $event)"
  >
    <AppIcon :name="icon" class="size-[18px]" />
    <span
      aria-hidden="true"
      class="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-md group-hover:block group-focus-visible:block"
    >{{ label }}</span>
  </button>
</template>
