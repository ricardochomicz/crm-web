<script setup lang="ts">
import SearchSelect from '@/components/ui/SearchSelect.vue'
import FormActions from '@/components/ui/FormActions.vue'
import type { ClassificationInput } from '../api'
const form = defineModel<ClassificationInput>('form', { required: true })
const months = defineModel<number | null>('months', { required: true })
defineProps<{ operators: { id: number; name: string }[]; busy: boolean }>()
const emit = defineEmits<{ submit: []; cancel: [] }>()
</script>
<template>
  <form class="space-y-4" @submit.prevent="emit('submit')">
    <label class="block space-y-2 text-sm font-semibold text-slate-700">Operadora
      <SearchSelect v-model="form.operator_id" :options="operators.map(o => ({ value: o.id, label: o.name }))" :disabled="busy" />
    </label>
    <label class="block space-y-2 text-sm font-semibold text-slate-700">Classificação
      <input v-model="form.name" required maxlength="150" class="field" placeholder="Ex.: Ouro" :disabled="busy" />
    </label>
    <label class="block space-y-2 text-sm font-semibold text-slate-700">Tempo em meses
      <input v-model.number="months" type="number" min="1" step="1" required class="field" :disabled="busy" />
    </label>
    <label class="flex items-center gap-2 text-sm text-slate-700">
      <input v-model="form.is_active" type="checkbox" :disabled="busy" /> Ativa
    </label>
    <div class="border-t border-stone-100 pt-4">
      <FormActions :busy="busy" @cancel="emit('cancel')" />
    </div>
  </form>
</template>
