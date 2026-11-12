<script setup lang="ts">
import AppDialog from './AppDialog.vue'
import FormActions from './FormActions.vue'
withDefaults(defineProps<{ open: boolean; title: string; description?: string; busy?: boolean; size?: 'default' | 'wide' | 'full'; submitLabel?: string }>(), { busy: false, size: 'default', submitLabel: 'Salvar' })
defineEmits<{ close: []; submit: [] }>()
</script>
<template>
  <AppDialog :open="open" :title="title" :description="description" :busy="busy" :size="size" @close="$emit('close')">
    <form class="space-y-4" @submit.prevent="$emit('submit')">
      <slot />
      <FormActions :busy="busy" :submit-label="submitLabel" @cancel="$emit('close')">
        <template v-if="$slots.actions" #before><slot name="actions" /></template>
      </FormActions>
    </form>
  </AppDialog>
</template>
