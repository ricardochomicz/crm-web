import type { CommissionFinancialTotals } from '../api'

export type CommissionComparisonRow = {
  order_id: string
  status: string
  reason: string | null
  current: CommissionFinancialTotals
  projected: CommissionFinancialTotals | null
}

export const formatCommissionMoney = (value: string | number | null | undefined): string =>
  Number(value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

/** Values arrive as decimal strings; integer cents avoid binary-float subtraction. */
export function cents(value: string | number | null | undefined): number {
  const raw = String(value ?? '0').trim()
  const match = /^(-?)(\d+)(?:\.(\d{1,2}))?$/.exec(raw)
  if (!match) throw new Error('Valor monetário inválido.')
  const integer = Number(match[2])
  if (!Number.isSafeInteger(integer) || integer > Number.MAX_SAFE_INTEGER / 100) {
    throw new Error('Valor monetário fora do intervalo seguro.')
  }
  const result = integer * 100 + Number((match[3] ?? '').padEnd(2, '0'))
  return match[1] === '-' ? -result : result
}

export function delta(current: string, projected: string | undefined): string {
  if (projected === undefined) return '—'
  const difference = cents(projected) - cents(current)
  const sign = difference > 0 ? '+' : difference < 0 ? '−' : ''
  return sign + formatCommissionMoney(Math.abs(difference) / 100)
}

export function participantComparisons(row: CommissionComparisonRow) {
  if (!row.projected) return []
  const identity = (participant: { role: string; name: string }) => participant.role + ':' + participant.name
  const current = new Map(row.current.participants.map(participant => [identity(participant), participant]))
  const projected = new Map(row.projected.participants.map(participant => [identity(participant), participant]))
  return [...new Set([...current.keys(), ...projected.keys()])].map(key => ({
    key,
    name: projected.get(key)?.name ?? current.get(key)?.name ?? '',
    role: projected.get(key)?.role ?? current.get(key)?.role ?? '',
    current: current.get(key)?.amount ?? '0.00',
    projected: projected.get(key)?.amount ?? '0.00',
  }))
}
