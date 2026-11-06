<script setup lang="ts">
import type { CommissionOption, TeamCommissionInput } from '../api'
import type { TenantOperator } from '@/features/operators/api'
const props = defineProps<{modelValue: TeamCommissionInput; operators: TenantOperator[]; orderTypes: CommissionOption[]; roles: CommissionOption[]; busy: boolean; editing: boolean}>()
const emit = defineEmits<{ 'update:modelValue': [value: TeamCommissionInput]; submit: []; cancel: [] }>()
function update<K extends keyof TeamCommissionInput>(key: K, value: TeamCommissionInput[K]) { emit('update:modelValue', {...props.modelValue, [key]: value}) }
</script>
<template>
 <form class="w-full max-w-lg space-y-4 rounded-2xl bg-white p-6 shadow-xl" @submit.prevent="emit('submit')">
  <h2 class="text-xl font-semibold">{{ editing ? 'Editar regra' : 'Nova regra de comissão' }}</h2>
  <label class="block text-sm">Operadora<select required class="mt-1 w-full rounded-lg border p-2" :value="modelValue.operator_id" @change="update('operator_id', Number(($event.target as HTMLSelectElement).value))"><option :value="0" disabled>Selecione</option><option v-for="o in operators" :key="o.id" :value="o.id">{{ o.name }}</option></select></label>
  <label class="block text-sm">Tipo de pedido<select required class="mt-1 w-full rounded-lg border p-2" :value="modelValue.order_type" @change="update('order_type', ($event.target as HTMLSelectElement).value)"><option value="" disabled>Selecione</option><option v-for="o in orderTypes" :key="o.value" :value="o.value">{{ o.label }}</option></select></label>
  <label class="block text-sm">Papel comercial<select required class="mt-1 w-full rounded-lg border p-2" :value="modelValue.commercial_role" @change="update('commercial_role', ($event.target as HTMLSelectElement).value)"><option value="" disabled>Selecione</option><option v-for="o in roles" :key="o.value" :value="o.value">{{ o.label }}</option></select></label>
  <label class="block text-sm">Comissão sobre o valor do contrato (%)<input required inputmode="decimal" class="mt-1 w-full rounded-lg border p-2" :value="modelValue.percentage" @input="update('percentage', ($event.target as HTMLInputElement).value)"/></label>
  <div class="grid grid-cols-2 gap-3">
   <label class="block text-sm">Início da vigência<input type="date" required class="mt-1 w-full rounded-lg border p-2" :value="modelValue.starts_on" @input="update('starts_on', ($event.target as HTMLInputElement).value)"/></label>
   <label class="block text-sm">Fim (opcional)<input type="date" class="mt-1 w-full rounded-lg border p-2" :value="modelValue.ends_on ?? ''" @input="update('ends_on', ($event.target as HTMLInputElement).value || null)"/></label>
  </div>
  <label class="flex gap-2 text-sm"><input type="checkbox" :checked="modelValue.is_active" @change="update('is_active', ($event.target as HTMLInputElement).checked)"/>Regra ativa</label>
  <div class="flex justify-end gap-3"><button type="button" class="rounded-lg border px-4 py-2" @click="emit('cancel')">Cancelar</button><button type="submit" class="primary-button w-auto" :disabled="busy">{{ busy ? 'Salvando...' : 'Salvar' }}</button></div>
 </form>
</template>
