import { describe, expect, it } from 'vitest'
import { buildCommercialRadar } from '../utils/commercialRadar'
import type { CommercialPriority, RenewalPriority } from '../api'

const opportunity = (overrides: Partial<CommercialPriority> = {}): CommercialPriority => ({
  id: 'opp-1', title: 'Renegociação', created_at: null, client_name: 'Empresa A',
  operator_name: null, expected_close_at: '2026-11-10', lines: 2,
  monthly: '100.00', acknowledged: false, ...overrides,
})
const renewal = (overrides: Partial<RenewalPriority> = {}): RenewalPriority => ({
  id: 'contract-1', client_id: 'client-1', client_name: 'Empresa B',
  operator_name: null, lines: 1, monthly: '50.00', renewal_date: '2026-11-13',
  days_until_renewal: 0, status: 'upcoming', acknowledged: false, ...overrides,
})

describe('commercial radar', () => {
  const today = new Date(2026, 10, 13, 12)
  it('prioritizes overdue opportunities and creates a deep link', () => {
    const result = buildCommercialRadar([opportunity()], [], 'tenant-1', today)
    expect(result[0]).toMatchObject({
      priority: 'urgent',
      href: '/empresas/tenant-1/oportunidades?oportunidade=opp-1',
    })
    expect(result[0]?.reason).toContain('3 dia(s)')
  })
  it('ranks overdue renewals before upcoming opportunities', () => {
    const result = buildCommercialRadar(
      [opportunity({ expected_close_at: '2026-11-20' })],
      [renewal({ days_until_renewal: -2, status: 'overdue' })], 'tenant-1', today,
    )
    expect(result[0]?.kind).toBe('renewal')
    expect(result[0]?.href).toBe('/empresas/tenant-1/clientes?cliente=client-1')
  })
  it('does not include acknowledged items', () => {
    expect(buildCommercialRadar(
      [opportunity({ acknowledged: true })], [renewal({ acknowledged: true })], 'tenant-1', today,
    )).toEqual([])
  })
})
