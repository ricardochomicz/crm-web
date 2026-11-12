<script setup lang="ts">
import FormActions from '@/components/ui/FormActions.vue'
import type { RuleInput } from '../api'
const rule = defineModel<RuleInput>('rule', { required: true })
defineProps<{ busy: boolean }>()
const emit = defineEmits<{ submit: []; cancel: [] }>()
</script>
<template>
  <form class="space-y-4" @submit.prevent="emit('submit')">
    <label class="block space-y-2 text-sm font-semibold text-slate-700">Meses mínimos
      <input v-model.number="rule.minimum_months" type="number" min="0" step="1" required class="field" :disabled="busy" />
    </label>
    <label class="block space-y-2 text-sm font-semibold text-slate-700">Início da vigência
      <input v-model="rule.valid_from" type="date" required class="field" :disabled="busy" />
    </label>
    <label class="block space-y-2 text-sm font-semibold text-slate-700">Fim da vigência
      <input v-model="rule.valid_until" type="date" class="field" :disabled="busy" />
    </label>
    <label class="block space-y-2 text-sm font-semibold text-slate-700">Observações
      <input v-model="rule.notes" class="field" :disabled="busy" />
    </label>
    <div class="border-t border-stone-100 pt-4">
      <FormActions :busy="busy" submit-label="Salvar regra" @cancel="emit('cancel')" />
    </div>
  </form>
</template>
