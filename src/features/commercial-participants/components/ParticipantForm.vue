<script setup lang="ts">
import type { ParticipantInput } from '../api'
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
  <label class="block text-sm">Pessoa<select class="mt-1 w-full rounded-lg border p-2" :value="modelValue.person_type" @change="setField('person_type', ($event.target as HTMLSelectElement).value)"><option value="PF">Pessoa física</option><option value="PJ">Pessoa jurídica</option></select></label>
  <label class="block text-sm">Nome / Razão social<input required maxlength="200" class="mt-1 w-full rounded-lg border p-2" :value="modelValue.name" @input="setField('name', ($event.target as HTMLInputElement).value)"/></label>
  <label class="block text-sm">CPF / CNPJ (somente números)<input inputmode="numeric" maxlength="14" class="mt-1 w-full rounded-lg border p-2" :value="modelValue.document ?? ''" @input="setField('document', ($event.target as HTMLInputElement).value.replace(/[^0-9]/g,'') || null)"/></label>
  <label class="block text-sm">E-mail<input type="email" class="mt-1 w-full rounded-lg border p-2" :value="modelValue.email ?? ''" @input="setField('email', ($event.target as HTMLInputElement).value || null)"/></label>
  <label class="block text-sm">Telefone<input class="mt-1 w-full rounded-lg border p-2" :value="modelValue.phone ?? ''" @input="setField('phone', ($event.target as HTMLInputElement).value || null)"/></label>
  <label class="block text-sm">Observações<textarea class="mt-1 w-full rounded-lg border p-2" :value="modelValue.notes ?? ''" @input="setField('notes', ($event.target as HTMLTextAreaElement).value || null)"/></label>
  <label class="flex gap-2 text-sm"><input type="checkbox" :checked="modelValue.is_active" @change="setField('is_active', ($event.target as HTMLInputElement).checked)"/>Ativo</label>
  <div class="flex justify-end gap-2"><button type="button" class="rounded-lg border px-4 py-2" @click="emit('cancel')">Cancelar</button><button type="submit" class="primary-button w-auto" :disabled="busy">Salvar</button></div>
 </form>
</template>
