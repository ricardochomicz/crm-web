import { describe, expect, it } from 'vitest'
import { commercialRadarDestination } from '../utils/commercialRadarNavigation'
import type { CommercialRadarItem } from '../radarApi'

function item(type: CommercialRadarItem['type']): CommercialRadarItem {
  return {
    id: 'radar-id',
    type,
    title: 'Prioridade',
    reason: 'Prazo próximo',
    priority: 'high',
    due_at: null,
    destination_id: 'record-123',
  }
}

describe('commercialRadarDestination', () => {
  it('opens the opportunity details', () => {
    expect(commercialRadarDestination('tenant-1', item('opportunity')))
      .toBe('/empresas/tenant-1/oportunidades?oportunidade=record-123')
  })

  it('opens the order details', () => {
    expect(commercialRadarDestination('tenant-1', item('order')))
      .toBe('/empresas/tenant-1/pedidos?pedido=record-123')
  })

  it('opens the activity details', () => {
    expect(commercialRadarDestination('tenant-1', item('activity')))
      .toBe('/empresas/tenant-1/atividades?atividade=record-123')
  })

  it('encodes identifiers safely', () => {
    expect(commercialRadarDestination('tenant/a', { ...item('activity'), destination_id: 'id&x=1' }))
      .toBe('/empresas/tenant%2Fa/atividades?atividade=id%26x%3D1')
  })
})
