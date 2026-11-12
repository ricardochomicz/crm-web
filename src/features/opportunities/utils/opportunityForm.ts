import type { OpportunityInput } from '../api'

export const MAX_OPPORTUNITY_ITEMS = 200

export function blankOpportunity(): OpportunityInput {
  return {
    code: '', title: '', client_id: '', order_type_id: '', operator_id: null,
    description: null, expected_close_at: null,
    estimated_monthly_amount: 0, estimated_one_time_amount: 0, items: [],
  }
}

export function opportunityLineCount(items: OpportunityInput['items']): number {
  return items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
}

export function opportunityTotal(items: OpportunityInput['items'], field: 'monthly_unit_amount' | 'one_time_unit_amount'): number {
  return items.reduce((sum, item) => sum + Number(item[field] || 0) * Number(item.quantity || 0), 0)
}

export function parseOpportunityNumbers(input: string): string[] {
  return input.split(/[\r\n\t,;]+/).map(value => value.replace(/\D/g, '')).filter(Boolean)
}
