<script setup lang="ts">
import type { GoalInput } from '../api'
import SearchSelect from '@/components/ui/SearchSelect.vue'
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
  <label class="block text-sm">Operadora<SearchSelect :model-value="modelValue.operator_id" :options="operators.map(o => ({value:o.id,label:o.name}))" required placeholder="Selecione a operadora" @update:model-value="change('operator_id', Number($event))"/></label>
  <label class="block text-sm">Tipo de pedido<SearchSelect :model-value="modelValue.order_type" :options="orderTypes" required placeholder="Selecione o tipo de pedido" @update:model-value="change('order_type', String($event))"/></label>
  <label class="block text-sm">Perfil<SearchSelect :model-value="modelValue.commercial_role" :options="roles" required placeholder="Selecione o perfil" @update:model-value="change('commercial_role', String($event))"/></label>
  <label class="block text-sm">Métrica<SearchSelect :model-value="modelValue.metric" :options="[{value:'QUANTITY',label:'Quantidade de linhas'},{value:'REVENUE',label:'Valor vendido (R$)'}]" required placeholder="Selecione a métrica" @update:model-value="change('metric', String($event) as 'QUANTITY' | 'REVENUE')"/></label>
  <div class="grid grid-cols-2 gap-3">
   <label class="block text-sm">Vigência inicial<input type="date" required class="mt-1 w-full rounded-xl border-0 bg-stone-100 px-4 py-3 outline-none focus:bg-white focus:ring-2 focus:ring-orange-400" :value="modelValue.starts_on" @input="change('starts_on', ($event.target as HTMLInputElement).value)"/></label>
   <label class="block text-sm">Vigência final<input type="date" class="mt-1 w-full rounded-xl border-0 bg-stone-100 px-4 py-3 outline-none focus:bg-white focus:ring-2 focus:ring-orange-400" :value="modelValue.ends_on ?? ''" @input="change('ends_on', ($event.target as HTMLInputElement).value || null)"/></label>
  </div>
  <div class="space-y-2"><div class="flex items-center justify-between"><strong>Faixas de comissão</strong><button type="button" class="rounded-lg border px-3 py-1" @click="addTier">Adicionar faixa</button></div>
   <div v-for="(t, i) in modelValue.tiers" :key="i" class="flex items-end gap-2">
    <label class="flex-1 text-sm">A partir de<input type="number" required :step="modelValue.metric === 'QUANTITY' ? 1 : '0.01'" min="0" class="mt-1 w-full rounded-xl border-0 bg-stone-100 px-4 py-3 outline-none focus:bg-white focus:ring-2 focus:ring-orange-400" :value="t.minimum" @input="tier(i, 'minimum', Number(($event.target as HTMLInputElement).value))"/></label>
    <label class="flex-1 text-sm">Comissão (%)<input type="number" required step="0.01" min="0" max="9999.99" class="mt-1 w-full rounded-xl border-0 bg-stone-100 px-4 py-3 outline-none focus:bg-white focus:ring-2 focus:ring-orange-400" :value="t.percentage" @input="tier(i, 'percentage', Number(($event.target as HTMLInputElement).value))"/></label>
    <button type="button" class="rounded-lg border px-3 py-2" :disabled="modelValue.tiers.length === 1" @click="removeTier(i)">Remover</button>
   </div>
  </div>
  <label class="flex items-center gap-2 text-sm"><input type="checkbox" :checked="modelValue.is_active" @change="change('is_active', ($event.target as HTMLInputElement).checked)"/>Ativa</label>
  <p class="text-xs text-slate-500">Ao alcançar uma faixa, seu percentual será aplicado retroativamente às vendas elegíveis do período na futura apuração.</p>
  <div class="flex justify-end gap-2"><button type="button" class="rounded-lg border px-4 py-2" @click="emit('cancel')">Cancelar</button><button type="submit" class="primary-button w-auto" :disabled="busy || !modelValue.operator_id || !modelValue.order_type || !modelValue.commercial_role || !modelValue.metric">Salvar</button></div>
 </form>
</template>
