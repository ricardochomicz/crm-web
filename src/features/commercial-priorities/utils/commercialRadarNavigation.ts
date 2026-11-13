import type { CommercialRadarItem } from '../radarApi'

/**
 * Centralized, tenant-scoped destinations for radar items.
 * The target modules own their deep-link loading and authorization.
 */
export function commercialRadarDestination(tenantId: string, item: CommercialRadarItem): string {
  const base = '/empresas/' + encodeURIComponent(tenantId)
  const id = encodeURIComponent(item.destination_id)

  switch (item.type) {
    case 'opportunity':
      return `${base}/oportunidades?oportunidade=${id}`
    case 'order':
      return `${base}/pedidos?pedido=${id}`
    case 'activity':
      return `${base}/atividades?atividade=${id}`
  }
}
