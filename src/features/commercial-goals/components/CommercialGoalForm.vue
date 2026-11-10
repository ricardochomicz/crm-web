<script setup lang="ts">
import type { Member } from '@/features/members/types'
import type { GoalInput } from '../api'
import SearchSelect from '@/components/ui/SearchSelect.vue'
import type { CommissionOption } from '@/features/team-commissions/api'
import type { TenantOperator } from '@/features/operators/api'
const props = defineProps<{ modelValue: GoalInput; operators: TenantOperator[]; members: Member[]; bulkMode: boolean; selectedMemberIds: string[]; bulkResult: {created_count: number; skipped_count: number; skipped: {responsible_membership_id: string; reason: string}[]} | null; orderTypes: CommissionOption[]; roles: CommissionOption[]; busy: boolean; editing: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: GoalInput]; submit: []; cancel: []; 'update:bulkMode': [value: boolean]; 'update:selectedMemberIds': [value: string[]] }>()
function change<K extends keyof GoalInput>(key: K, value: GoalInput[K]) { emit('update:modelValue', { ...props.modelValue, [key]: value }) }
function eligibleMembers(): Member[] {
 return props.members.filter(m => m.status === 'ACTIVE' && (props.modelValue.target_scope === 'CONSULTANT'
  ? m.role === 'CONSULTANT' || /consultor/i.test(m.role_name ?? '')
  : m.role === 'MANAGER' || /supervisor|gerente/i.test(m.role_name ?? '')))
}
function toggleMember(id: string, checked: boolean) {
 emit('update:selectedMemberIds', checked
  ? [...props.selectedMemberIds, id]
  : props.selectedMemberIds.filter(item => item !== id))
}
function tier(index: number, key: 'minimum' | 'percentage', value: number) {
 const tiers = props.modelValue.tiers.map((item, i) => i === index ? { ...item, [key]: value } : item)
 change('tiers', tiers)
}
function addTier() { change('tiers', [...props.modelValue.tiers, { minimum: 0, percentage: 0 }]) }
function removeTier(index: number) { change('tiers', props.modelValue.tiers.filter((_, i) => i !== index)) }
</script>
<template>
 <form class="flex max-h-[calc(100dvh-2rem)] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl" @submit.prevent="emit('submit')">
  <h2 class="shrink-0 border-b border-stone-200 px-6 py-5 text-xl font-semibold">{{ editing ? 'Editar meta comercial' : 'Nova meta comercial' }}</h2>
  <div class="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
  <div class="space-y-3 rounded-xl border border-stone-200 p-3">
   <strong class="text-sm">Responsável pela meta</strong>
   <div v-if="!editing" class="flex flex-wrap gap-4 text-sm">
    <label class="flex items-center gap-2"><input type="radio" name="goal-mode" :checked="!bulkMode" @change="emit('update:bulkMode', false)"/>Individual</label>
    <label class="flex items-center gap-2"><input type="radio" name="goal-mode" :checked="bulkMode" @change="emit('update:bulkMode', true)"/>Em massa</label>
   </div>
   <label class="block text-sm">Aplicar meta para
    <SearchSelect :model-value="modelValue.target_scope" :options="bulkMode ? [{value:'CONSULTANT',label:'Consultores'},{value:'SUPERVISOR',label:'Supervisores'}] : [{value:'COMPANY',label:'Empresa (meta geral)'},{value:'CONSULTANT',label:'Consultor (individual)'},{value:'SUPERVISOR',label:'Supervisor (equipe)'}]" @update:model-value="emit('update:modelValue', {...modelValue, target_scope: String($event) as GoalInput['target_scope'], responsible_membership_id: null}); emit('update:selectedMemberIds', [])"/>
   </label>
   <template v-if="bulkMode && !editing">
    <div class="flex items-center justify-between gap-2 text-xs">
     <span>{{ selectedMemberIds.length }} de {{ eligibleMembers().length }} selecionados</span>
     <button type="button" class="font-semibold text-orange-700" @click="emit('update:selectedMemberIds', selectedMemberIds.length === eligibleMembers().length ? [] : eligibleMembers().map(m => m.id))">{{ selectedMemberIds.length === eligibleMembers().length ? 'Desmarcar todos' : 'Selecionar todos' }}</button>
    </div>
    <div class="max-h-44 space-y-2 overflow-y-auto rounded-lg border border-stone-200 p-3">
     <label v-for="member in eligibleMembers()" :key="member.id" class="flex items-center gap-2 text-sm">
      <input type="checkbox" :checked="selectedMemberIds.includes(member.id)" @change="toggleMember(member.id, ($event.target as HTMLInputElement).checked)"/>
      <span>{{ member.name }} <span class="text-xs text-slate-500">{{ member.email }}</span></span>
     </label>
     <p v-if="!eligibleMembers().length" class="text-xs text-slate-500">Nenhum membro ativo encontrado para este perfil.</p>
    </div>
    <p class="text-xs text-slate-500">Cada pessoa receberá uma meta independente. Metas equivalentes com vigência sobreposta serão ignoradas.</p>
   </template>
   <label v-else-if="modelValue.target_scope !== 'COMPANY'" class="block text-sm">{{ modelValue.target_scope === 'CONSULTANT' ? 'Consultor responsável' : 'Supervisor responsável' }}
    <SearchSelect :model-value="modelValue.responsible_membership_id ?? ''" :options="eligibleMembers().map(m => ({value:m.id,label:m.name + ' · ' + m.email}))" required placeholder="Selecione o responsável" @update:model-value="change('responsible_membership_id', String($event))"/>
   </label>
  </div>
  <label class="block text-sm">Operadora<SearchSelect :model-value="modelValue.operator_id" :options="operators.map(o => ({value:o.id,label:o.name}))" required placeholder="Selecione a operadora" @update:model-value="change('operator_id', Number($event))"/></label>
  <label class="block text-sm">Categoria da meta<SearchSelect :model-value="modelValue.category ?? ''" :options="[{value:'NOVAS_VENDAS',label:'Novas vendas'},{value:'PORTABILIDADE',label:'Portabilidade'},{value:'RENOVACAO',label:'Renovação'},{value:'INCREMENTO',label:'Incremento'},{value:'BANDA_LARGA',label:'Banda larga'},{value:'RECEITA',label:'Receita'}]" required placeholder="Selecione a categoria" @update:model-value="change('category', String($event))"/></label>
  <fieldset class="space-y-2 rounded-xl border border-stone-200 p-3">
   <legend class="px-1 text-sm font-semibold">Tipos de negociação considerados</legend>
   <p class="text-xs text-slate-500">Selecione um ou mais tipos. Eles serão usados para agrupar a meta.</p>
   <div class="grid max-h-40 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
    <label v-for="type in orderTypes" :key="type.value" class="flex items-center gap-2 text-sm">
     <input type="checkbox" :checked="modelValue.negotiation_type_ids.includes(String(type.value))" @change="change('negotiation_type_ids', ($event.target as HTMLInputElement).checked ? [...modelValue.negotiation_type_ids, String(type.value)] : modelValue.negotiation_type_ids.filter(id => id !== String(type.value)))"/>
     {{ type.label }}
    </label>
   </div>
  </fieldset>
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
  </div>
  <div v-if="bulkResult" class="shrink-0 border-t border-stone-200 bg-amber-50 px-6 py-2 text-xs text-amber-900">
   {{ bulkResult.created_count }} criada(s), {{ bulkResult.skipped_count }} ignorada(s).
   <ul v-if="bulkResult.skipped.length" class="max-h-20 overflow-y-auto"><li v-for="item in bulkResult.skipped" :key="item.responsible_membership_id">{{ members.find(m => m.id === item.responsible_membership_id)?.name ?? item.responsible_membership_id }}: {{ item.reason }}</li></ul>
  </div>
  <div class="flex shrink-0 justify-end gap-2 border-t border-stone-200 bg-white px-6 py-4"><button type="button" class="rounded-lg border px-4 py-2" @click="emit('cancel')">Cancelar</button><button type="submit" class="primary-button w-auto" :disabled="busy || !modelValue.operator_id || (bulkMode ? (modelValue.target_scope === 'COMPANY' || !selectedMemberIds.length) : (modelValue.target_scope !== 'COMPANY' && !modelValue.responsible_membership_id)) || !modelValue.category || !modelValue.negotiation_type_ids.length || !modelValue.commercial_role || !modelValue.metric">{{ bulkMode && !editing ? 'Criar ' + selectedMemberIds.length + ' metas' : 'Salvar' }}</button></div>
 </form>
</template>
