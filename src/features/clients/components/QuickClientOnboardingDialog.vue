<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { maskDocument, maskBrazilianPhone, onlyDigits } from '@/lib/masks'
import AppDialog from '@/components/ui/AppDialog.vue'
import { clientsApi, type Client, type ClientInput, type ContactInput } from '../api'
import { errorMessage } from '@/lib/feedback'

const props = defineProps<{ open: boolean; tenantId: string }>()
const emit = defineEmits<{ close: []; created: [client: Client] }>()
const blank = (): ClientInput => ({
  person_type: 'PJ', document: '', company_name: '', phone: null, email: null,
  zip_code: null, address: null, address_number: null, address_complement: null,
  neighborhood: null, city: null, state: null, operator_id: null,
  classification_id: null, contract_started_on: null, contract_ends_on: null,
  is_active: true, seller_membership_id: null, seller_reason: null,
})
const form = reactive<ClientInput>(blank())
const contact = reactive<ContactInput>({ name: '', position: '', phone: null, email: null, notes: null, is_primary: true, is_active: true })
const createdClient = ref<Client | null>(null)
const busy = ref(false)
const error = ref('')
const checking = ref(false)
const duplicate = ref(false)
const documentModel = computed({
  get: () => maskDocument(form.document, form.person_type),
  set: value => { form.document = onlyDigits(value).slice(0, form.person_type === 'PF' ? 11 : 14); duplicate.value = false; error.value = '' },
})
const phoneModel = computed({
  get: () => maskBrazilianPhone(form.phone),
  set: value => { form.phone = onlyDigits(value).slice(0, 11) || null },
})
const contactPhoneModel = computed({
  get: () => maskBrazilianPhone(contact.phone),
  set: value => { contact.phone = onlyDigits(value).slice(0, 11) || null },
})
watch(() => form.person_type, () => { form.document = ''; duplicate.value = false; error.value = '' })
watch(() => props.open, open => {
  if (!open) return
  Object.assign(form, blank())
  Object.assign(contact, { name: '', position: '', phone: null, email: null, notes: null, is_primary: true, is_active: true })
  createdClient.value = null
  error.value = ''
  duplicate.value = false
})
async function checkDuplicate() {
  const document = onlyDigits(form.document)
  if (![11, 14].includes(document.length)) return
  checking.value = true
  try {
    const result = await clientsApi.transferLookup(props.tenantId, document)
    duplicate.value = result.data.exists
    if (duplicate.value) error.value = 'Este CPF/CNPJ já possui cadastro. Localize o cliente no seletor ou solicite transferência de carteira.'
    else error.value = ''
  } catch (e) { error.value = errorMessage(e) }
  finally { checking.value = false }
}
async function saveClient() {
  if (busy.value || checking.value) return
  error.value = ''
  if (duplicate.value) { error.value = 'Este documento já possui cadastro.'; return }
  busy.value = true
  try {
    const result = await clientsApi.save(props.tenantId, { ...form, document: onlyDigits(form.document), phone: onlyDigits(form.phone) || null })
    createdClient.value = result.data
  } catch (e) { error.value = errorMessage(e) }
  finally { busy.value = false }
}
async function saveContact() {
  if (!createdClient.value || busy.value) return
  error.value = ''
  if (!contact.name.trim() || !contact.position?.trim() || (!onlyDigits(contact.phone) && !contact.email?.trim())) {
    error.value = 'Informe nome, cargo e telefone ou e-mail do responsável.'
    return
  }
  busy.value = true
  try {
    await clientsApi.contact(props.tenantId, createdClient.value.id, {
      ...contact, phone: onlyDigits(contact.phone) || null, is_primary: true, is_active: true,
    })
    const result = await clientsApi.show(props.tenantId, createdClient.value.id)
    if (result.data.contact_pending) { error.value = 'O cadastro do responsável ainda está pendente.'; return }
    emit('created', result.data)
  } catch (e) { error.value = errorMessage(e) }
  finally { busy.value = false }
}
</script>

<template>
  <AppDialog :open="open" :busy="busy || !!createdClient" :title="createdClient ? 'Responsável pela empresa' : 'Cadastrar novo cliente'"
    :description="createdClient ? 'Cadastre o contato principal para concluir o cliente e voltar à oportunidade.' : 'Cadastro rápido sem perder os dados da oportunidade.'"
    @close="emit('close')">
    <form class="space-y-4 p-6" @submit.prevent="createdClient ? saveContact() : saveClient()">
      <template v-if="!createdClient">
        <label class="block text-sm font-medium">Tipo de pessoa
          <select v-model="form.person_type" class="field"><option value="PJ">Pessoa jurídica</option><option value="PF">Pessoa física</option></select>
        </label>
        <label class="block text-sm font-medium">CPF/CNPJ *
          <input v-model="documentModel" class="field" required inputmode="numeric" :maxlength="form.person_type === 'PF' ? 14 : 18"
            @input="duplicate = false" @blur="checkDuplicate" />
        </label>
        <label class="block text-sm font-medium">Razão social / Nome *
          <input v-model="form.company_name" class="field uppercase" required maxlength="255" @input="form.company_name = form.company_name.toLocaleUpperCase('pt-BR')" />
        </label>
        <label class="block text-sm font-medium">Telefone
          <input v-model="phoneModel" class="field" inputmode="tel" maxlength="15" />
        </label>
        <label class="block text-sm font-medium">E-mail
          <input v-model="form.email" class="field" type="email" />
        </label>
      </template>
      <template v-else>
        <p class="text-sm text-slate-600">Cliente <strong>{{ createdClient.company_name }}</strong> cadastrado. Informe o responsável obrigatório.</p>
        <label class="block text-sm font-medium">Nome *
          <input v-model="contact.name" class="field" required />
        </label>
        <label class="block text-sm font-medium">Cargo / Função *
          <input v-model="contact.position" class="field" required />
        </label>
        <label class="block text-sm font-medium">Telefone
          <input v-model="contactPhoneModel" class="field" inputmode="tel" maxlength="15" />
        </label>
        <label class="block text-sm font-medium">E-mail
          <input v-model="contact.email" class="field" type="email" />
        </label>
      </template>
      <p v-if="error" role="alert" class="text-sm text-red-700">{{ error }}</p>
      <div class="flex justify-end gap-3 border-t pt-4">
        <button v-if="!createdClient" type="button" class="secondary-button w-auto" :disabled="busy" @click="emit('close')">Cancelar</button>
        <button type="submit" class="primary-button w-auto" :disabled="busy || checking || duplicate">
          {{ busy ? 'Salvando...' : createdClient ? 'Concluir e selecionar cliente' : 'Salvar e cadastrar responsável' }}
        </button>
      </div>
    </form>
  </AppDialog>
</template>
