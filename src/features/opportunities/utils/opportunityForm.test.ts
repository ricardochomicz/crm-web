import { describe, expect, it } from 'vitest'
import { blankOpportunity, opportunityLineCount, opportunityTotal, parseOpportunityNumbers } from './opportunityForm'

describe('opportunity form utilities', () => {
  it('creates isolated form objects', () => {
    const first = blankOpportunity()
    first.items.push({ order_type_id: 'type', product_id: 'plan', line_number: null, description: 'Plan', quantity: 1, monthly_unit_amount: 10, one_time_unit_amount: 0, notes: null })
    expect(blankOpportunity().items).toEqual([])
  })

  it('calculates quantities and amounts across multiple lines', () => {
    const items = [
      { order_type_id: 'type', product_id: 'plan', line_number: null, description: 'Plan', quantity: 2, monthly_unit_amount: 30, one_time_unit_amount: 10, notes: null },
      { order_type_id: 'type', product_id: 'plan', line_number: null, description: 'Plan', quantity: 1, monthly_unit_amount: 20, one_time_unit_amount: 5, notes: null },
    ]
    expect(opportunityLineCount(items)).toBe(3)
    expect(opportunityTotal(items, 'monthly_unit_amount')).toBe(80)
    expect(opportunityTotal(items, 'one_time_unit_amount')).toBe(25)
  })

  it('normalizes pasted phone numbers without changing order', () => {
    expect(parseOpportunityNumbers('(41) 99999-1111; 41988882222')).toEqual(['41999991111', '41988882222'])
  })
})
