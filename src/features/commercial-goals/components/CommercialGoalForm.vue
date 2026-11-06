<script setup lang="ts">
import type { GoalInput } from '../api'
import type { CommissionOption } from '@/features/team-commissions/api'
import type { TenantOperator } from '@/features/operators/api'
const props = defineProps<{ modelValue: GoalInput; operators: TenantOperator[]; orderTypes: CommissionOption[]; roles: CommissionOption[]; busy: boolean; editing: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: GoalInput]; submit: []; cancel: [] }>()
function change<K extends keyof GoalInput>(key: K, value: GoalInput[K]) { emit('update:modelValue', { ...props.modelValue, [key]: value }) }
function tier(index: number, key: 'minimum' | 'percentage', value: number) {
 const tiers = props.modelValue.tiers.map((item, i) => i === index ? { ...item, [key]: value } : item)
 change('tiers', tiers)
}
function addTier() { change('tiers', [...props.modelValue.tiers, { minimum: 0, percentage: 0 }]) }
function removeTier(index: number) { change('tiers', props.modelValue.tiers.filter((_, i) => i !== index)) }
</script>
<template>
 <form class="w-full max-w-xl space-y-4 rounded-2xl bg-white p-6 shadow-xl" @submit.prevent="emit('submit')">
  <h2 class="text-xl font-semibold">{{ editing ? 'Editar meta comercial' : 'Nova meta comercial' }}</h2>
  <label class="block text-sm">Operadora<select required class="mt-1 w-full rounded-lg border p-2" :value="modelValue.operator_id" @change="change('operator_id', Number(($event.target as HTMLSelectElement).value))"><option :value="0" disabled>Selecione</option><option v-for="o in operators" :key="o.id" :value="o.id">{{ o.name }}</option></select></label>
  <label class="block text-sm">Tipo de pedido<select required class="mt-1 w-full rounded-lg border p-2" :value="modelValue.order_type" @change="change('order_type', ($event.target as HTMLSelectElement).value)"><option v-for="o in orderTypes" :key="o.value" :value="o.value">{{ o.label }}</option></select></label>
  <label class="block text-sm">Perfil<select required class="mt-1 w-full rounded-lg border p-2" :value="modelValue.commercial_role" @change="change('commercial_role', ($event.target as HTMLSelectElement).value)"><option v-for="r in roles" :key="r.value" :value="r.value">{{ r.label }}</option></select></label>
  <label class="block text-sm">Métrica<select class="mt-1 w-full rounded-lg border p-2" :value="modelValue.metric" @change="change('metric', ($event.target as HTMLSelectElement).value as 'QUANTITY' | 'REVENUE')"><option value="QUANTITY">Quantidade de linhas</option><option value="REVENUE">Valor vendido (R$)</option></select></label>
  <div class="grid grid-cols-2 gap-3">
   <label class="block text-sm">Vigência inicial<input type="date" required class="mt-1 w-full rounded-lg border p-2" :value="modelValue.starts_on" @input="change('starts_on', ($event.target as HTMLInputElement).value)"/></label>
   <label class="block text-sm">Vigência final<input type="date" class="mt-1 w-full rounded-lg border p-2" :value="modelValue.ends_on ?? ''" @input="change('ends_on', ($event.target as HTMLInputElement).value || null)"/></label>
  </div>
  <div class="space-y-2"><div class="flex items-center justify-between"><strong>Faixas de comissão</strong><button type="button" class="rounded-lg border px-3 py-1" @click="addTier">Adicionar faixa</button></div>
   <div v-for="(t, i) in modelValue.tiers" :key="i" class="flex items-end gap-2">
    <label class="flex-1 text-sm">A partir de<input type="number" required :step="modelValue.metric === 'QUANTITY' ? 1 : '0.01'" min="0" class="mt-1 w-full rounded-lg border p-2" :value="t.minimum" @input="tier(i, 'minimum', Number(($event.target as HTMLInputElement).value))"/></label>
    <label class="flex-1 text-sm">Comissão (%)<input type="number" required step="0.01" min="0" max="9999.99" class="mt-1 w-full rounded-lg border p-2" :value="t.percentage" @input="tier(i, 'percentage', Number(($event.target as HTMLInputElement).value))"/></label>
    <button type="button" class="rounded-lg border px-3 py-2" :disabled="modelValue.tiers.length === 1" @click="removeTier(i)">Remover</button>
   </div>
  </div>
  <label class="flex items-center gap-2 text-sm"><input type="checkbox" :checked="modelValue.is_active" @change="change('is_active', ($event.target as HTMLInputElement).checked)"/>Ativa</label>
  <p class="text-xs text-slate-500">Ao alcançar uma faixa, seu percentual será aplicado retroativamente às vendas elegíveis do período na futura apuração.</p>
  <div class="flex justify-end gap-2"><button type="button" class="rounded-lg border px-4 py-2" @click="emit('cancel')">Cancelar</button><button type="submit" class="primary-button w-auto" :disabled="busy">Salvar</button></div>
 </form>
</template>
