<script setup lang="ts">
import AppDialog from '@/components/ui/AppDialog.vue'
import type { Opportunity } from '../api'
defineProps<{ opportunity: Opportunity | null; busy: boolean; money: (value: string) => string }>()
const emit = defineEmits<{ close: []; confirm: [] }>()
</script>
<template>
  <AppDialog :open="!!opportunity" title="Reenviar pedido ao Backoffice" description="Confira as informações antes de confirmar o reenvio." :busy="busy" @close="emit('close')">
    <div v-if="opportunity" class="space-y-5">
      <div class="rounded-xl border border-stone-200 bg-stone-50 p-4">
        <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Oportunidade</p>
        <p class="mt-2 font-semibold text-slate-900">{{ opportunity.title }}</p>
        <p class="mt-1 text-xs text-slate-500">{{ opportunity.code }}</p>
        <div class="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div><p class="text-slate-500">Cliente</p><p class="mt-1 font-medium text-slate-800">{{ opportunity.client?.company_name || '—' }}</p></div>
          <div><p class="text-slate-500">Valor mensal</p><p class="mt-1 font-semibold text-slate-900">{{ money(opportunity.estimated_monthly_amount) }}</p></div>
        </div>
      </div>
      <div class="rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-900">O pedido existente será atualizado com os planos e valores corrigidos e retornará ao status <strong>TRIAGEM</strong>. O reenvio será registrado no histórico do pedido e da oportunidade.</div>
      <p class="text-xs text-slate-500">Pedidos com linhas já ativadas exigem revisão do Backoffice e não podem ser reenviados por este fluxo.</p>
      <div class="flex flex-wrap justify-end gap-2 border-t border-stone-100 pt-4">
        <button type="button" class="secondary-button w-auto" :disabled="busy" @click="emit('close')">Cancelar</button>
        <button type="button" class="primary-button w-auto" :disabled="busy" @click="emit('confirm')">{{ busy ? 'Reenviando…' : 'Confirmar reenvio' }}</button>
      </div>
    </div>
  </AppDialog>
</template>
