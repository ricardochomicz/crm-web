import type { CommercialPriority, RenewalPriority } from '../api'

export type RadarItem = {
  key: string
  title: string
  detail: string
  reason: string
  priority: 'urgent' | 'high' | 'normal'
  href: string
  kind: 'opportunity' | 'renewal'
}

function localDate(value: string): Date {
  return new Date(value.slice(0, 10) + 'T12:00:00')
}
function daysUntil(value: string, today: Date): number {
  const a = localDate(value)
  const b = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12)
  return Math.round((a.getTime() - b.getTime()) / 86400000)
}

/** Explainable rules based only on the already authorized commercial-priorities response. */
export function buildCommercialRadar(
  opportunities: CommercialPriority[],
  renewals: RenewalPriority[],
  tenantId: string,
  today = new Date(),
): RadarItem[] {
  const base = '/empresas/' + encodeURIComponent(tenantId)
  const items: RadarItem[] = []
  for (const opportunity of opportunities) {
    if (opportunity.acknowledged) continue
    const days = opportunity.expected_close_at ? daysUntil(opportunity.expected_close_at, today) : null
    const priority = days !== null && days < 0 ? 'urgent' : days !== null && days <= 2 ? 'high' : 'normal'
    items.push({
      key: 'opportunity-' + opportunity.id,
      title: opportunity.title,
      detail: opportunity.client_name ?? 'Cliente não informado',
      reason: days === null ? 'Oportunidade para acompanhamento' :
        days < 0 ? 'Fechamento previsto há ' + Math.abs(days) + ' dia(s)' :
        days === 0 ? 'Fechamento previsto para hoje' :
        'Fechamento previsto em ' + days + ' dia(s)',
      priority, kind: 'opportunity',
      href: base + '/oportunidades?oportunidade=' + encodeURIComponent(opportunity.id),
    })
  }
  for (const renewal of renewals) {
    if (renewal.acknowledged) continue
    const days = renewal.days_until_renewal
    items.push({
      key: 'renewal-' + renewal.id,
      title: renewal.client_name ?? 'Renovação de contrato',
      detail: renewal.operator_name ?? 'Operadora não informada',
      reason: days < 0 ? 'Renovação vencida há ' + Math.abs(days) + ' dia(s)' :
        days === 0 ? 'Renovação prevista para hoje' : 'Renovação em ' + days + ' dia(s)',
      priority: days < 0 ? 'urgent' : days <= 7 ? 'high' : 'normal',
      kind: 'renewal',
      href: base + '/clientes?cliente=' + encodeURIComponent(renewal.client_id),
    })
  }
  const rank = { urgent: 0, high: 1, normal: 2 }
  return items.sort((a, b) => rank[a.priority] - rank[b.priority] || a.title.localeCompare(b.title, 'pt-BR'))
}
