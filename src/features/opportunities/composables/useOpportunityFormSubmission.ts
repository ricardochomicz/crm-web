import { ref, type Ref } from 'vue'
import { publishOpportunityChanged } from '../opportunityEvents'
import { opportunitiesApi, type Opportunity, type OpportunityInput } from '../api'
import type { OrderType } from '@/features/order-types/api'
import type { Product } from '@/features/products/api'
import { opportunityTotal } from '../utils/opportunityForm'
import { errorMessage } from '@/lib/feedback'

interface Dependencies {
  form: Ref<OpportunityInput>
  tenantId: Readonly<Ref<string>>
  opportunity: Readonly<Ref<Opportunity | null>>
  orderTypes: Readonly<Ref<OrderType[]>>
  filteredProducts: Readonly<Ref<Product[]>>
  onSaved: () => void
}

/** Validates and persists opportunity forms without coupling submission to the dialog UI. */
export function useOpportunityFormSubmission(deps: Dependencies) {
  const busy = ref(false)
  const error = ref('')

  function validateLines(): boolean {
    const items = deps.form.value.items
    if (!items.length) { error.value = 'Adicione pelo menos uma linha ou serviço.'; return false }
    const numbers = new Set<string>()
    for (const [index, item] of items.entries()) {
      if (deps.orderTypes.value.find(type => type.id === item.order_type_id)?.requires_number && !item.line_number) {
        error.value = `O tipo do item ${index + 1} exige número.`; return false
      }
      if (!deps.filteredProducts.value.some(product => product.id === item.product_id)) {
        error.value = `O plano do item ${index + 1} não pertence à operadora selecionada.`; return false
      }
      if (!item.product_id) { error.value = `Selecione o plano do item ${index + 1}.`; return false }
      const number = (item.line_number ?? '').replace(/\D/g, '')
      if (number && ![10, 11].includes(number.length)) {
        error.value = `Informe o telefone com DDD no item ${index + 1}.`; return false
      }
      if (number && numbers.has(number)) { error.value = 'Existem números de linha duplicados.'; return false }
      if (number) numbers.add(number)
      if (number && Number(item.quantity) !== 1) {
        error.value = 'Uma linha identificada deve ter quantidade 1.'; return false
      }
    }
    return true
  }

  async function save() {
    if (busy.value) return
    const form = deps.form.value
    if (!form.operator_id) { error.value = 'Selecione a operadora da oportunidade.'; return }
    if (!form.client_id) { error.value = 'Selecione um cliente.'; return }
    if (!form.order_type_id) { error.value = 'Selecione o tipo da negociação.'; return }
    if (!form.expected_close_at) { error.value = 'Informe a previsão de fechamento da oportunidade.'; return }
    const previousForecast = deps.opportunity.value?.expected_close_at?.slice(0, 10)
    if (previousForecast && form.expected_close_at > previousForecast && (form.forecast_reason ?? '').trim().length < 10) {
      error.value = 'Informe uma justificativa de pelo menos 10 caracteres para prorrogar a previsão.'
      return
    }
    if (!validateLines()) return

    busy.value = true
    error.value = ''
    try {
      const payload = {
        ...form,
        expected_close_at: form.expected_close_at || null,
        estimated_monthly_amount: opportunityTotal(form.items, 'monthly_unit_amount'),
        estimated_one_time_amount: opportunityTotal(form.items, 'one_time_unit_amount'),
        items: form.items.map(item => ({ ...item, line_number: item.line_number?.replace(/\D/g, '') || null })),
      }
      const opportunity = deps.opportunity.value
      if (opportunity) await opportunitiesApi.update(deps.tenantId.value, opportunity.id, payload)
      else await opportunitiesApi.create(deps.tenantId.value, payload)
      publishOpportunityChanged(deps.tenantId.value)
      deps.onSaved()
    } catch (e) {
      error.value = errorMessage(e)
    } finally {
      busy.value = false
    }
  }

  return { busy, error, save }
}
