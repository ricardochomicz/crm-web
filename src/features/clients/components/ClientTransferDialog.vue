<script setup lang="ts">
import { ref, watch } from 'vue'
import FormDialog from '@/components/ui/FormDialog.vue'

const props = defineProps<{ open: boolean; busy: boolean }>()
const emit = defineEmits<{ close: []; submit: [reason: string] }>()
const reason = ref('')
const error = ref('')
watch(() => props.open, open => {
  if (open) { reason.value = ''; error.value = '' }
})
function submit() {
  const value = reason.value.trim()
  if (value.length < 10) {
    error.value = 'Informe uma justificativa com pelo menos 10 caracteres.'
    return
  }
  error.value = ''
  emit('submit', value)
}
</script>

<template>
  <FormDialog
    :open="open"
    title="Solicitar transferência de cliente"
    description="Explique o motivo da transferência para análise e aprovação do supervisor."
    submit-label="Solicitar transferência"
    :busy="busy"
    @close="emit('close')"
    @submit="submit"
  >
    <label for="client-transfer-reason" class="block text-sm font-medium text-slate-700">Justificativa
      <textarea id="client-transfer-reason" v-model="reason" required minlength="10" maxlength="2000" rows="4" class="field mt-1" :aria-invalid="!!error" :aria-describedby="error ? 'client-transfer-error' : undefined" placeholder="Informe o motivo da transferência..." />
    </label>
    <p v-if="error" id="client-transfer-error" role="alert" class="text-sm text-red-700">{{ error }}</p>
  </FormDialog>
</template>
