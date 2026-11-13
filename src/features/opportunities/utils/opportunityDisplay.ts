import type { OrderType } from '@/features/order-types/api'
import type { Opportunity } from '../api'

/** Resolves legacy string/JSON order types and the current reference-data shape. */
export function displayOpportunityOrderType(
  item: Opportunity,
  orderTypes: readonly OrderType[],
): string {
  const value: unknown = item.order_type
  if (value && typeof value === 'object') {
    const type = value as { name?: unknown }
    return typeof type.name === 'string' ? type.name : '—'
  }
  if (item.order_type_id) {
    const type = orderTypes.find(type => type.id === item.order_type_id)
    if (type) return type.name
  }
  if (typeof value === 'string') {
    if (value.startsWith('{')) {
      try {
        const parsed: unknown = JSON.parse(value)
        if (parsed && typeof parsed === 'object' && 'name' in parsed && typeof parsed.name === 'string') return parsed.name
      } catch { /* Legacy text type */ }
    }
    return value
  }
  return '—'
}

export function formatOpportunityMoney(value: string): string {
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
