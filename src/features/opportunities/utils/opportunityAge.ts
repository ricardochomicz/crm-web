export function opportunityAgeDays(createdAt: string | null | undefined, now = new Date()): number | null {
  if (!createdAt) return null

  const created = new Date(createdAt)
  if (Number.isNaN(created.getTime())) return null

  const todayUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  const createdUtc = Date.UTC(
    created.getFullYear(),
    created.getMonth(),
    created.getDate(),
  )

  return Math.max(0, Math.floor((todayUtc - createdUtc) / 86_400_000))
}

export function opportunityAgeLabel(createdAt: string | null | undefined): string | null {
  const days = opportunityAgeDays(createdAt)
  if (days === null) return null
  if (days === 0) return 'Criada hoje'
  if (days === 1) return 'Criada há 1 dia'
  return `Criada há ${days} dias`
}

export function opportunityAgeClass(createdAt: string | null | undefined): string {
  const days = opportunityAgeDays(createdAt)
  if (days === null || days <= 7) return 'text-slate-500'
  if (days <= 15) return 'font-medium text-amber-700'
  return 'font-semibold text-rose-700'
}
