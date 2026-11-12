<script setup lang="ts">
import AppDialog from '@/components/ui/AppDialog.vue'
import FormActions from '@/components/ui/FormActions.vue'
import type { ContactInput } from '../api'

defineProps<{
  open: boolean
  busy: boolean
  requiredContact: boolean
  contact: ContactInput
  phoneModel: string
}>()
const emit = defineEmits<{
  close: []
  save: []
  'update:phoneModel': [value: string]
}>()
</script>

<template>
  <AppDialog
    :open="open"
    :busy="busy || requiredContact"
    size="wide"
    :title="requiredContact ? 'Responsável pela empresa (obrigatório)' : 'Pessoa de contato'"
    :description="requiredContact ? 'Para concluir o cadastro do cliente, informe o responsável principal.' : undefined"
    @close="emit('close')"
  >
    <form class="space-y-4" @submit.prevent="emit('save')">
      <fieldset :disabled="busy" class="space-y-4">
        <label class="block text-sm font-medium text-slate-700">Nome
          <input v-model="contact.name" required class="field mt-1" />
        </label>
        <div class="grid gap-3 sm:grid-cols-2">
          <label class="block text-sm font-medium text-slate-700">CPF (opcional)
            <input :value="contact.cpf ?? ''" @input="contact.cpf = ($event.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 11) || null" inputmode="numeric" maxlength="11" placeholder="Somente números" class="field mt-1" />
          </label>
          <label class="block text-sm font-medium text-slate-700">Data de nascimento (opcional)
            <input v-model="contact.birth_date" type="date" class="field mt-1" />
          </label>
        </div>
        <label class="block text-sm font-medium text-slate-700">Cargo
          <input v-model="contact.position" :required="requiredContact" class="field mt-1" />
        </label>
        <label class="block text-sm font-medium text-slate-700">Telefone
          <input :value="phoneModel" @input="emit('update:phoneModel', ($event.target as HTMLInputElement).value)" class="field mt-1" inputmode="tel" maxlength="15" />
        </label>
        <label class="block text-sm font-medium text-slate-700">E-mail
          <input v-model="contact.email" type="email" class="field mt-1" />
        </label>
        <label class="flex items-center gap-2 text-sm"><input v-model="contact.is_primary" type="checkbox" />Contato principal</label>
        <label class="flex items-center gap-2 text-sm"><input v-model="contact.is_active" type="checkbox" />Ativo</label>
        <label class="flex items-center gap-2 text-sm"><input v-model="contact.portal_access_enabled" type="checkbox" :disabled="!contact.is_active || !contact.email" />Autorizar acesso ao Portal do Cliente por este e-mail</label>
        <p class="text-xs text-slate-500">Habilite somente após confirmar que o e-mail pertence à pessoa autorizada a consultar os pedidos da empresa.</p>
      </fieldset>
      <FormActions :busy="busy" :show-cancel="!requiredContact" @cancel="emit('close')" />
    </form>
  </AppDialog>
</template>
