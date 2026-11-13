<script setup lang="ts">
import { computed } from 'vue'
import SearchSelect from '@/components/ui/SearchSelect.vue'

const props = defineProps<{
  modelValue: string | null | undefined
  assignees: { id: string; name: string }[]
  loading: boolean
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string | null]
}>()

const options = computed(() => [
  { value: '', label: 'Eu (padrão)' },
  ...props.assignees.map((member) => ({ value: member.id, label: member.name })),
])

function update(value: string | number) {
  emit('update:modelValue', String(value || '') || null)
}
</script>

<template>
  <label class="block space-y-2 text-sm font-semibold text-slate-700">
    Responsável
    <SearchSelect
      :model-value="modelValue ?? ''"
      :options="options"
      placeholder="Eu (padrão)"
      :disabled="loading || disabled"
      @update:model-value="update"
    />
    <span v-if="loading" class="text-xs font-normal text-slate-500">
      Carregando responsáveis…
    </span>
  </label>
</template>
