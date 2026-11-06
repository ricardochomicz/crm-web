<script setup lang="ts">
import SearchSelect from '@/components/ui/SearchSelect.vue'
import type { CommissionOption, TeamCommissionInput } from '../api'
import type { TenantOperator } from '@/features/operators/api'
const props = defineProps<{modelValue: TeamCommissionInput; operators: TenantOperator[]; orderTypes: CommissionOption[]; roles: CommissionOption[]; busy: boolean; editing: boolean}>()
const emit = defineEmits<{ 'update:modelValue': [value: TeamCommissionInput]; submit: []; cancel: [] }>()
function update<K extends keyof TeamCommissionInput>(key: K, value: TeamCommissionInput[K]) { emit('update:modelValue', {...props.modelValue, [key]: value}) }
</script>
<template>
 <form class="w-full max-w-lg space-y-4 rounded-2xl bg-white p-6 shadow-xl" @submit.prevent="emit('submit')">
  <h2 class="text-xl font-semibold">{{ editing ? 'Editar regra' : 'Nova regra de comissão' }}</h2>
  <label class="block text-sm">Operadora<SearchSelect :model-value="modelValue.operator_id" :options="operators.map(o => ({value:o.id,label:o.name}))" required @update:model-value="update('operator_id', Number($event))"/></label>
  <label class="block text-sm">Tipo de pedido<SearchSelect :model-value="modelValue.order_type" :options="orderTypes" required @update:model-value="update('order_type', String($event))"/></label>
  <label class="block text-sm">Papel comercial<SearchSelect :model-value="modelValue.commercial_role" :options="roles" required @update:model-value="update('commercial_role', String($event))"/></label>
  <label class="block text-sm">Comissão sobre o valor do contrato (%)<input required inputmode="decimal" class="mt-1 w-full rounded-xl border-0 bg-stone-100 px-4 py-3 outline-none focus:bg-white focus:ring-2 focus:ring-orange-400" :value="modelValue.percentage" @input="update('percentage', ($event.target as HTMLInputElement).value)"/></label>
  <div class="grid grid-cols-2 gap-3">
   <label class="block text-sm">Início da vigência<input type="date" required class="mt-1 w-full rounded-xl border-0 bg-stone-100 px-4 py-3 outline-none focus:bg-white focus:ring-2 focus:ring-orange-400" :value="modelValue.starts_on" @input="update('starts_on', ($event.target as HTMLInputElement).value)"/></label>
   <label class="block text-sm">Fim (opcional)<input type="date" class="mt-1 w-full rounded-xl border-0 bg-stone-100 px-4 py-3 outline-none focus:bg-white focus:ring-2 focus:ring-orange-400" :value="modelValue.ends_on ?? ''" @input="update('ends_on', ($event.target as HTMLInputElement).value || null)"/></label>
  </div>
  <label class="flex gap-2 text-sm"><input type="checkbox" :checked="modelValue.is_active" @change="update('is_active', ($event.target as HTMLInputElement).checked)"/>Regra ativa</label>
  <div class="flex justify-end gap-3"><button type="button" class="rounded-lg border px-4 py-2" @click="emit('cancel')">Cancelar</button><button type="submit" class="primary-button w-auto" :disabled="busy">{{ busy ? 'Salvando...' : 'Salvar' }}</button></div>
 </form>
</template>
