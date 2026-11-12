<script setup lang="ts">
withDefaults(
  defineProps<{
    busy?: boolean
    submitLabel?: string
    cancelLabel?: string
    showCancel?: boolean
    showSubmit?: boolean
  }>(),
  {
    busy: false,
    submitLabel: 'Salvar',
    cancelLabel: 'Cancelar',
    showCancel: true,
    showSubmit: true,
  },
)
defineEmits<{ cancel: [] }>()
</script>
<template>
  <div class="flex flex-wrap items-center justify-end gap-2">
    <slot name="before" />
    <button
      v-if="showCancel"
      type="button"
      class="secondary-button w-auto"
      :disabled="busy"
      @click="$emit('cancel')"
    >
      {{ cancelLabel }}
    </button>
    <button v-if="showSubmit" type="submit" class="primary-button w-auto" :disabled="busy">
      {{ busy ? 'Salvando…' : submitLabel }}
    </button>
  </div>
</template>
