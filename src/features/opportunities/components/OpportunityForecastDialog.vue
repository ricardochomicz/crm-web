<script setup lang="ts">
import AppDialog from '@/components/ui/AppDialog.vue'
import type { Opportunity } from '../api'

defineProps<{
  opportunity: Opportunity | null
  destinationStage: string
  modelValue: string
  busy: boolean
}>()
const emit = defineEmits<{
  close: []
  confirm: []
  'update:modelValue': [value: string]
}>()
const today = () => [new Date().getFullYear(), String(new Date().getMonth() + 1).padStart(2, '0'), String(new Date().getDate()).padStart(2, '0')].join('-')
</script>

<template>
  <AppDialog
    :open="!!opportunity"
    title="Atualizar previsão de fechamento"
    description="A previsão desta oportunidade está vencida. Informe uma nova data para confirmar a movimentação."
    @close="emit('close')"
  >
    <div class="space-y-4">
      <p class="text-sm text-slate-700">
        <strong>{{ opportunity?.title }}</strong>
        <span v-if="destinationStage"> — destino: {{ destinationStage }}</span>
      </p>
      <p class="text-sm text-amber-800">
        Previsão anterior: <strong>{{ opportunity?.expected_close_at?.slice(0, 10).split('-').reverse().join('/') }}</strong>
      </p>
      <label class="block text-sm font-semibold text-slate-700">
        Nova previsão de fechamento
        <input
          type="date"
          class="field mt-2 w-full"
          :min="today()"
          :value="modelValue"
          :disabled="busy"
          required
          @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        />
      </label>
      <div class="flex justify-end gap-3 border-t pt-4">
        <button type="button" class="secondary-button w-auto" :disabled="busy" @click="emit('close')">Cancelar</button>
        <button type="button" class="primary-button w-auto" :disabled="busy || !modelValue || modelValue < today()" @click="emit('confirm')">
          Atualizar e movimentar
        </button>
      </div>
    </div>
  </AppDialog>
</template>
