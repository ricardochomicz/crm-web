<script setup lang="ts">
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
  <label class="block text-sm">Perfil<select class="mt-1 w-full rounded-lg border p-2" :value="modelValue.role" @change="setField('role', ($event.target as HTMLSelectElement).value)"><option value="PARTNER">Parceiro</option><option value="REFERRER">Indicador</option></select></label>
  <label class="block text-sm">Pessoa<select class="mt-1 w-full rounded-lg border p-2" :value="modelValue.person_type" @change="setPersonType(($event.target as HTMLSelectElement).value as 'PF'|'PJ')"><option value="PF">Pessoa física</option><option value="PJ">Pessoa jurídica</option></select></label>
  <label class="block text-sm">Nome / Razão social<input required maxlength="200" class="mt-1 w-full rounded-lg border p-2" :value="modelValue.name" @input="setField('name', ($event.target as HTMLInputElement).value)"/></label>
  <label class="block text-sm">{{ modelValue.person_type === 'PF' ? 'CPF' : 'CNPJ' }}<input inputmode="numeric" :maxlength="modelValue.person_type === 'PF' ? 14 : 18" :placeholder="modelValue.person_type === 'PF' ? '000.000.000-00' : '00.000.000/0000-00'" class="mt-1 w-full rounded-lg border p-2" :value="docMask" @input="setField('document', onlyDigits(($event.target as HTMLInputElement).value).slice(0, modelValue.person_type === 'PF' ? 11 : 14) || null)"/></label>
  <label class="block text-sm">E-mail<input type="email" class="mt-1 w-full rounded-lg border p-2" :value="modelValue.email ?? ''" @input="setField('email', ($event.target as HTMLInputElement).value || null)"/></label>
  <label class="block text-sm">Telefone<input inputmode="tel" maxlength="15" placeholder="(00) 00000-0000" class="mt-1 w-full rounded-lg border p-2" :value="phoneMask" @input="setField('phone', onlyDigits(($event.target as HTMLInputElement).value).slice(0,11) || null)"/></label>
  <label class="block text-sm">Observações<textarea class="mt-1 w-full rounded-lg border p-2" :value="modelValue.notes ?? ''" @input="setField('notes', ($event.target as HTMLTextAreaElement).value || null)"/></label>
  <label class="flex gap-2 text-sm"><input type="checkbox" :checked="modelValue.is_active" @change="setField('is_active', ($event.target as HTMLInputElement).checked)"/>Ativo</label>
  <div class="flex justify-end gap-2"><button type="button" class="rounded-lg border px-4 py-2" @click="emit('cancel')">Cancelar</button><button type="submit" class="primary-button w-auto" :disabled="busy">Salvar</button></div>
 </form>
</template>
