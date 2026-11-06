import { computed, onScopeDispose, ref, watch, type Ref } from 'vue'
import { digits, maskZipCode } from '@/lib/masks'
import { lookupViaCep } from '@/services/viacep'
import type { ClientInput } from '../api'

/** Consulta de CEP com proteção contra respostas atrasadas e mudanças no formulário. */
export function useClientAddress(form: Ref<ClientInput>) {
  const cepBusy = ref(false)
  const cepMessage = ref('')
  const cepModel = computed({
    get: () => maskZipCode(form.value.zip_code),
    set: (value: string) => { form.value.zip_code = digits(value, 8) },
  })
  let sequence = 0
  let controller: AbortController | null = null

  function cancelLookup() {
    ++sequence
    controller?.abort()
    controller = null
    cepBusy.value = false
    cepMessage.value = ''
  }

  watch(() => form.value.zip_code, () => {
    if (controller) cancelLookup()
  })

  async function lookupCep() {
    const cep = digits(form.value.zip_code, 8)
    if (cep.length !== 8) {
      cepMessage.value = 'Informe os 8 dígitos do CEP.'
      return
    }
    controller?.abort()
    const current = ++sequence
    const activeController = new AbortController()
    controller = activeController
    cepBusy.value = true
    cepMessage.value = ''
    try {
      const address = await lookupViaCep(cep, activeController.signal)
      if (current !== sequence || digits(form.value.zip_code, 8) !== cep) return
      if (!address) {
        cepMessage.value = 'CEP não encontrado.'
        return
      }
      form.value.address = address.logradouro ?? ''
      form.value.neighborhood = address.bairro ?? ''
      form.value.city = address.localidade ?? ''
      form.value.state = address.uf ?? ''
      cepMessage.value = 'Endereço preenchido pelo ViaCEP. Confira os dados.'
    } catch {
      if (current === sequence && !activeController.signal.aborted) {
        cepMessage.value = 'Consulta indisponível. Preencha o endereço manualmente.'
      }
    } finally {
      if (current === sequence) {
        cepBusy.value = false
        controller = null
      }
    }
  }

  onScopeDispose(cancelLookup)
  return { cepModel, cepBusy, cepMessage, lookupCep, cancelLookup }
}
