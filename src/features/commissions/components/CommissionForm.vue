<script setup lang="ts">
import SearchSelect from '@/components/ui/SearchSelect.vue'
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
  <label class="block text-sm font-medium">Tipo de pedido<SearchSelect :model-value="modelValue.order_type" :options="orderTypes" required @update:model-value="update('order_type', String($event))"/></label>
  <label class="block text-sm font-medium">Operadora<SearchSelect :model-value="modelValue.operator_id" :options="operators.map(o => ({value:o.id,label:o.name}))" required @update:model-value="update('operator_id', Number($event))"/></label>
  <label class="block text-sm font-medium">Comissão (%)<input :value="modelValue.percentage" required inputmode="decimal" class="mt-1.5 block w-full rounded-xl border-0 bg-stone-100 px-4 py-3 text-sm font-normal outline-none focus:bg-white focus:ring-2 focus:ring-orange-400" @input="update('percentage', ($event.target as HTMLInputElement).value)" /></label>
  <label class="block text-sm font-medium text-slate-700">Desconto (%)<input :value="modelValue.deduction_percentage" inputmode="decimal" class="mt-1.5 block w-full rounded-xl border-0 bg-stone-100 px-4 py-3 text-sm font-normal outline-none focus:bg-white focus:ring-2 focus:ring-orange-400" placeholder="Vazio = padrão da empresa" @input="update('deduction_percentage', ($event.target as HTMLInputElement).value)" /><span class="mt-1 block text-xs font-normal text-slate-500">Informe 0 para não aplicar desconto.</span></label>
  <label class="flex items-center gap-2 text-sm font-medium text-slate-700"><input :checked="modelValue.is_active" type="checkbox" class="size-4 accent-orange-600" @change="update('is_active', ($event.target as HTMLInputElement).checked)" /> Comissão ativa</label>
  <div class="flex justify-end gap-3"><button type="button" class="rounded-lg border px-4 py-2" @click="emit('cancel')">Cancelar</button><button type="submit" :disabled="busy" class="primary-button w-auto">Salvar</button></div>
 </form>
</template>
