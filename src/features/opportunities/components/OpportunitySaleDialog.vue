<script setup lang="ts">
import AppDialog from '@/components/ui/AppDialog.vue'
import type { Opportunity } from '../api'
defineProps<{ opportunity: Opportunity | null; busy: boolean; money: (value: string) => string }>()
const emit = defineEmits<{ close: []; confirm: [] }>()
</script>
<template>
  <AppDialog :open="!!opportunity" title="Confirmar venda" :busy="busy" @close="emit('close')">
    <div v-if="opportunity">
      <p class="text-sm text-slate-600">Deseja converter a oportunidade <strong>{{ opportunity.title }}</strong> em pedido comercial?</p>
      <div class="mt-4 rounded-xl bg-stone-50 p-4 text-sm">
        <p><strong>Cliente:</strong> {{ opportunity.client?.company_name ?? '—' }}</p>
        <p class="mt-2"><strong>Valor mensal:</strong> {{ money(opportunity.estimated_monthly_amount) }}</p>
        <p class="mt-2 text-xs text-slate-500">Os itens serão copiados para um pedido em rascunho. A oportunidade será marcada como ganha e sairá da visualização padrão.</p>
      </div>
      <div class="mt-6 flex justify-end gap-2">
        <button type="button" class="secondary-button w-auto" :disabled="busy" @click="emit('close')">Cancelar</button>
        <button type="button" class="primary-button w-auto" :disabled="busy" @click="emit('confirm')">{{ busy ? 'Confirmando…' : 'Confirmar e gerar pedido' }}</button>
      </div>
    </div>
  </AppDialog>
</template>
