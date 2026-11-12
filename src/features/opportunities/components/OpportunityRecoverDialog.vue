<script setup lang="ts">
import AppDialog from '@/components/ui/AppDialog.vue'
import type { Opportunity } from '../api'

defineProps<{ opportunity: Opportunity | null; busy: boolean }>()
const emit = defineEmits<{ close: []; confirm: [] }>()
</script>

<template>
  <AppDialog :open="!!opportunity" title="Recuperar oportunidade" description="Confirme a recuperação da negociação perdida." :busy="busy" @close="emit('close')">
    <div v-if="opportunity" class="space-y-5">
      <div class="rounded-xl border border-stone-200 bg-stone-50 p-4">
        <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Oportunidade</p>
        <p class="mt-2 font-semibold text-slate-900">{{ opportunity.title }}</p>
        <p class="mt-1 text-xs text-slate-500">{{ opportunity.code }}</p>
        <p class="mt-3 text-sm text-slate-600"><strong>Cliente:</strong> {{ opportunity.client?.company_name ?? '—' }}</p>
      </div>
      <p class="text-sm text-slate-700">Uma nova oportunidade será criada com os mesmos itens e valores. A negociação original permanecerá no histórico.</p>
      <div class="flex justify-end gap-2 border-t border-stone-100 pt-4">
        <button type="button" class="secondary-button w-auto" :disabled="busy" @click="emit('close')">Cancelar</button>
        <button type="button" class="primary-button w-auto" :disabled="busy" @click="emit('confirm')">{{ busy ? 'Recuperando…' : 'Recuperar oportunidade' }}</button>
      </div>
    </div>
  </AppDialog>
</template>
