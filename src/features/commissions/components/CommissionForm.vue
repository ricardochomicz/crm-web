<script setup lang="ts">
import type { TenantOperator } from '@/features/operators/api'
export type CommissionFormValue = { order_type: string; operator_id: number; percentage: string; deduction_percentage: string; is_active: boolean }
const props = defineProps<{ modelValue: CommissionFormValue; operators: TenantOperator[]; orderTypes: {value: string; label: string}[]; busy: boolean; editing: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: CommissionFormValue]; submit: []; cancel: [] }>()
function update<K extends keyof CommissionFormValue>(key: K, value: CommissionFormValue[K]) {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}
</script>
<template>
 <form class="w-full max-w-lg space-y-4 rounded-2xl bg-white p-6 shadow-xl" @submit.prevent="emit('submit')">
  <h2 class="text-xl font-semibold">{{ editing ? 'Editar comissão' : 'Nova comissão' }}</h2>
  <label class="block text-sm font-medium">Tipo de pedido<select :value="modelValue.order_type" required class="mt-1 w-full rounded-lg border p-2" @change="update('order_type', ($event.target as HTMLSelectElement).value)"><option value="" disabled>Selecione</option><option v-for="type in orderTypes" :key="type.value" :value="type.value">{{ type.label }}</option></select></label>
  <label class="block text-sm font-medium">Operadora<select :value="modelValue.operator_id" required class="mt-1 w-full rounded-lg border p-2" @change="update('operator_id', Number(($event.target as HTMLSelectElement).value))"><option :value="0" disabled>Selecione</option><option v-for="op in operators" :key="op.id" :value="op.id">{{ op.name }}</option></select></label>
  <label class="block text-sm font-medium">Comissão (%)<input :value="modelValue.percentage" required inputmode="decimal" class="mt-1.5 block w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm font-normal" @input="update('percentage', ($event.target as HTMLInputElement).value)" /></label>
  <label class="block text-sm font-medium text-slate-700">Desconto (%)<input :value="modelValue.deduction_percentage" inputmode="decimal" class="mt-1.5 block w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm font-normal" placeholder="Vazio = padrão da empresa" @input="update('deduction_percentage', ($event.target as HTMLInputElement).value)" /><span class="mt-1 block text-xs font-normal text-slate-500">Informe 0 para não aplicar desconto.</span></label>
  <label class="flex items-center gap-2 text-sm font-medium text-slate-700"><input :checked="modelValue.is_active" type="checkbox" class="size-4 accent-orange-600" @change="update('is_active', ($event.target as HTMLInputElement).checked)" /> Comissão ativa</label>
  <div class="flex justify-end gap-3"><button type="button" class="rounded-lg border px-4 py-2" @click="emit('cancel')">Cancelar</button><button type="submit" :disabled="busy" class="primary-button w-auto">Salvar</button></div>
 </form>
</template>
