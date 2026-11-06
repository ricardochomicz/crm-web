import { computed, watch, type Ref } from 'vue'
import { digits, maskDocument, maskBrazilianPhone } from '@/lib/masks'
import type { ClientInput, ContactInput } from '../api'

/** Modelos com máscara para formulários de cliente e contato. */
export function useClientMasks(form: Ref<ClientInput>, contact: Ref<ContactInput>) {
  const documentModel = computed({
    get: () => maskDocument(form.value.document, form.value.person_type),
    set: (value: string) => {
      form.value.document = digits(value, form.value.person_type === 'PF' ? 11 : 14)
    },
  })
  const phoneModel = computed({
    get: () => maskBrazilianPhone(form.value.phone),
    set: (value: string) => { form.value.phone = digits(value, 11) },
  })
  const contactPhoneModel = computed({
    get: () => maskBrazilianPhone(contact.value.phone),
    set: (value: string) => { contact.value.phone = digits(value, 11) },
  })
  watch(() => form.value.person_type, () => {
    form.value.document = digits(form.value.document, form.value.person_type === 'PF' ? 11 : 14)
  })
  return { documentModel, phoneModel, contactPhoneModel }
}
