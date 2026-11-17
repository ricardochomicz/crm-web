<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import FormDialog from '@/components/ui/FormDialog.vue'
import SearchSelect from '@/components/ui/SearchSelect.vue'
import type { Seller } from '../api'

const props = defineProps<{ open: boolean; busy: boolean; clientName: string; sourceId: string; sellers: Seller[] }>()
const emit = defineEmits<{ close: []; submit: [destinationId: string, reason: string] }>()
const destinationId = ref('')
const reason = ref('')
const error = ref('')
const options = computed(() => props.sellers.filter(seller => seller.id !== props.sourceId).map(seller => ({ value: seller.id, label: seller.name })))
watch(() => props.open, (open) => {
  if (open) { destinationId.value = ''; reason.value = ''; error.value = '' }
})
function submit() {
  if (!options.value.some(option => option.value === destinationId.value)) {
    error.value = 'Selecione um consultor de destino válido.'
    return
  }
  if (reason.value.trim().length < 10) {
    error.value = 'Informe uma justificativa com pelo menos 10 caracteres.'
    return
  }
  error.value = ''
  emit('submit', destinationId.value, reason.value.trim())
}
</script>

<template>
  <FormDialog
    :open="open"
    :busy="busy"
    title="Transferir cliente"
    :description="`Transferência administrativa de ${clientName}. As oportunidades abertas acompanharão o novo responsável; o histórico comercial será preservado.`"
    submit-label="Confirmar transferência"
    @close="emit('close')"
    @submit="submit"
  >
    <div class="space-y-2">
      <label class="block text-sm font-medium">Novo responsável</label>
      <SearchSelect v-model="destinationId" :options="options" placeholder="Selecione o consultor..." />
    </div>
    <label class="block text-sm font-medium">
      Justificativa da transferência
      <textarea v-model="reason" class="field mt-2" rows="3" maxlength="1000" placeholder="Informe o motivo da transferência..." />
    </label>
    <p v-if="error" role="alert" class="text-sm text-red-700">{{ error }}</p>
  </FormDialog>
</template>
