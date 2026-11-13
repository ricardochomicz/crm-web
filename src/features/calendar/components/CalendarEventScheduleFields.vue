<script setup lang="ts">
import FormField from '@/components/ui/FormField.vue'

defineProps<{
  startsAt: string
  endsAt: string
  allDay: boolean
}>()

const emit = defineEmits<{
  'update:startsAt': [value: string]
  'update:endsAt': [value: string]
  'update:allDay': [value: boolean]
}>()
</script>

<template>
  <section class="space-y-4" aria-label="Período do compromisso">
    <div class="grid gap-4 sm:grid-cols-2">
      <FormField
        id="calendar-start"
        :model-value="startsAt"
        label="Início"
        type="datetime-local"
        required
        @update:model-value="emit('update:startsAt', String($event))"
      />
      <FormField
        id="calendar-end"
        :model-value="endsAt"
        label="Término"
        type="datetime-local"
        required
        @update:model-value="emit('update:endsAt', String($event))"
      />
    </div>
    <label class="flex items-center gap-2 text-sm text-slate-700">
      <input
        type="checkbox"
        :checked="allDay"
        @change="emit('update:allDay', ($event.target as HTMLInputElement).checked)"
      />
      Dia inteiro
    </label>
  </section>
</template>
