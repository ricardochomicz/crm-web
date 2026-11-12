<script setup lang="ts">
import AppDialog from '@/components/ui/AppDialog.vue'
import type { Opportunity } from '../api'
defineProps<{ opportunity: Opportunity | null; busy: boolean; reason: string }>()
const emit = defineEmits<{ close: []; confirm: []; 'update:reason': [value: string] }>()
function onReasonInput(event: Event) {
  emit('update:reason', (event.target as HTMLTextAreaElement).value)
}
</script>
<template>
  <AppDialog :open="!!opportunity" title="Registrar venda perdida" :busy="busy" @close="emit('close')">
    <form v-if="opportunity" @submit.prevent="emit('confirm')">
      <p class="text-sm text-slate-600">Oportunidade: <strong>{{ opportunity.title }}</strong>. O registro permanecerá no histórico comercial.</p>
      <label class="mt-4 block text-sm font-semibold text-slate-700" for="lost-reason">Motivo da perda *</label>
      <textarea id="lost-reason" :value="reason" class="field mt-2 min-h-24 w-full" required minlength="3" maxlength="200" placeholder="Ex.: cliente optou pela concorrência" @input="onReasonInput" />
      <div class="mt-6 flex justify-end gap-2">
        <button type="button" class="secondary-button w-auto" :disabled="busy" @click="emit('close')">Cancelar</button>
        <button type="submit" class="primary-button w-auto" :disabled="busy || reason.trim().length < 3">{{ busy ? 'Registrando…' : 'Confirmar perda' }}</button>
      </div>
    </form>
  </AppDialog>
</template>
