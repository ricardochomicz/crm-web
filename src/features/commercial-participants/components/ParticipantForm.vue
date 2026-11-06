<script setup lang="ts">
import SearchSelect from '@/components/ui/SearchSelect.vue'
import type { ParticipantInput } from '../api'
import { computed } from 'vue'
import { onlyDigits, maskDocument, maskBrazilianPhone } from '@/lib/masks'
const docMask = computed(() => maskDocument(props.modelValue.document, props.modelValue.person_type))
const phoneMask = computed(() => maskBrazilianPhone(props.modelValue.phone))
function setPersonType(value: 'PF'|'PJ') {
 emit('update:modelValue', {...props.modelValue, person_type:value, document:null})
}

const props = defineProps<{ modelValue: ParticipantInput; busy: boolean; editing: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: ParticipantInput]; submit: []; cancel: [] }>()
function setField(key: keyof ParticipantInput, value: string | boolean | null) {
 emit('update:modelValue', { ...props.modelValue, [key]: value })
}
</script>
<template>
 <form class="w-full max-w-lg space-y-3 rounded-2xl bg-white p-6 shadow-xl" @submit.prevent="emit('submit')">
  <h2 class="text-xl font-semibold">{{ editing ? 'Editar participante' : 'Novo participante' }}</h2>
  <label class="block text-sm">Perfil<SearchSelect :model-value="modelValue.role" :options="[{value:'PARTNER',label:'Parceiro'},{value:'REFERRER',label:'Indicador'}]" @update:model-value="setField('role', String($event))"/></label>
  <label class="block text-sm">Pessoa<SearchSelect :model-value="modelValue.person_type" :options="[{value:'PF',label:'Pessoa física'},{value:'PJ',label:'Pessoa jurídica'}]" @update:model-value="setPersonType(String($event) as 'PF'|'PJ')"/></label>
  <label class="block text-sm">Nome / Razão social<input required maxlength="200" class="mt-1 w-full rounded-xl border-0 bg-stone-100 px-4 py-3 outline-none focus:bg-white focus:ring-2 focus:ring-orange-400" :value="modelValue.name" @input="setField('name', ($event.target as HTMLInputElement).value)"/></label>
  <label class="block text-sm">{{ modelValue.person_type === 'PF' ? 'CPF' : 'CNPJ' }}<input inputmode="numeric" :maxlength="modelValue.person_type === 'PF' ? 14 : 18" :placeholder="modelValue.person_type === 'PF' ? '000.000.000-00' : '00.000.000/0000-00'" class="mt-1 w-full rounded-xl border-0 bg-stone-100 px-4 py-3 outline-none focus:bg-white focus:ring-2 focus:ring-orange-400" :value="docMask" @input="setField('document', onlyDigits(($event.target as HTMLInputElement).value).slice(0, modelValue.person_type === 'PF' ? 11 : 14) || null)"/></label>
  <label class="block text-sm">E-mail<input type="email" class="mt-1 w-full rounded-xl border-0 bg-stone-100 px-4 py-3 outline-none focus:bg-white focus:ring-2 focus:ring-orange-400" :value="modelValue.email ?? ''" @input="setField('email', ($event.target as HTMLInputElement).value || null)"/></label>
  <label class="block text-sm">Telefone<input inputmode="tel" maxlength="15" placeholder="(00) 00000-0000" class="mt-1 w-full rounded-xl border-0 bg-stone-100 px-4 py-3 outline-none focus:bg-white focus:ring-2 focus:ring-orange-400" :value="phoneMask" @input="setField('phone', onlyDigits(($event.target as HTMLInputElement).value).slice(0,11) || null)"/></label>
  <label class="block text-sm">Observações<textarea class="mt-1 w-full rounded-xl border-0 bg-stone-100 px-4 py-3 outline-none focus:bg-white focus:ring-2 focus:ring-orange-400" :value="modelValue.notes ?? ''" @input="setField('notes', ($event.target as HTMLTextAreaElement).value || null)"/></label>
  <label class="flex gap-2 text-sm"><input type="checkbox" :checked="modelValue.is_active" @change="setField('is_active', ($event.target as HTMLInputElement).checked)"/>Ativo</label>
  <div class="flex justify-end gap-2"><button type="button" class="rounded-lg border px-4 py-2" @click="emit('cancel')">Cancelar</button><button type="submit" class="primary-button w-auto" :disabled="busy">Salvar</button></div>
 </form>
</template>
