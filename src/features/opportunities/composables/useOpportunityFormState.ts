import { ref, type Ref } from 'vue'
import type { Opportunity, OpportunityInput } from '../api'
import type { TenantOperator } from '@/features/operators/api'
import { blankOpportunity } from '../utils/opportunityForm'

interface Dependencies {
  operators: Readonly<Ref<TenantOperator[]>>
  onOperatorChanged: () => void
  confirmOperatorChange: () => boolean
}

function generateCode(): string {
  const now = new Date()
  const stamp = [
    now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'), String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'), String(now.getSeconds()).padStart(2, '0'),
  ].join('')
  return 'OP-' + stamp + '-' + Math.random().toString(36).slice(2, 6).toUpperCase()
}

/** Owns opportunity form initialization and operator transitions, not the dialog presentation. */
export function useOpportunityFormState(deps: Dependencies) {
  const form = ref<OpportunityInput>(blankOpportunity())

  function changeOperator(id: number | null) {
    if (id === form.value.operator_id) return
    if (form.value.items.length && !deps.confirmOperatorChange()) return
    form.value.items = []
    deps.onOperatorChanged()
    form.value.operator_id = id
  }

  function initialize(opportunity: Opportunity | null) {
    form.value = opportunity ? {
      code: opportunity.code,
      title: opportunity.title,
      client_id: opportunity.client_id,
      order_type_id: opportunity.order_type_id ?? '',
      operator_id: opportunity.operator_id,
      description: opportunity.description,
      expected_close_at: opportunity.expected_close_at?.slice(0, 10) ?? null,
      estimated_monthly_amount: Number(opportunity.estimated_monthly_amount),
      estimated_one_time_amount: Number(opportunity.estimated_one_time_amount),
      items: (opportunity.items ?? []).map(item => ({
        ...item,
        quantity: Number(item.quantity),
        monthly_unit_amount: Number(item.monthly_unit_amount),
        one_time_unit_amount: Number(item.one_time_unit_amount),
      })),
    } : {
      ...blankOpportunity(),
      code: generateCode(),
      operator_id: deps.operators.value.length === 1 ? deps.operators.value[0]!.id : null,
    }
  }

  return { form, changeOperator, initialize }
}
