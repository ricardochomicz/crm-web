<script setup lang="ts">
import type { GlobalSearchItem } from '../api/globalSearchApi'

withDefaults(defineProps<{
  item: GlobalSearchItem
  active?: boolean
  optionId?: string
  option?: boolean
  categoryLabel?: string
}>(), { active: false, option: false })
defineEmits<{ select: []; hover: [] }>()
</script>
<template>
  <button :id="optionId" type="button" :role="option ? 'option' : undefined"
    :aria-selected="option ? active : undefined" :tabindex="option ? -1 : 0"
    :data-search-result="option ? '' : undefined"
    class="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-orange-50 focus-visible:outline-2 focus-visible:outline-orange-600"
    :class="active ? 'bg-orange-50' : ''" @mouseenter="$emit('hover')" @click="$emit('select')">
    <span class="min-w-0 flex-1">
      <span class="block truncate text-sm font-semibold text-slate-800">{{ item.title }}</span>
      <span class="block truncate text-xs text-slate-500">{{ item.subtitle }}</span>
    </span>
    <span v-if="categoryLabel" class="text-xs text-slate-400">{{ categoryLabel }}</span>
    <span v-else class="text-xs text-slate-400" aria-hidden="true">↵</span>
  </button>
</template>
