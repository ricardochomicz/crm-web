import { computed, type Ref } from 'vue'

export type DashboardPeriod = 'month' | 'quarter'

function iso(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** Shared dashboard period: month/quarter start through today, in local time. */
export function useDashboardPeriod(period: Readonly<Ref<DashboardPeriod>>) {
  const range = computed(() => {
    const today = new Date()
    const firstMonth = period.value === 'quarter'
      ? Math.floor(today.getMonth() / 3) * 3
      : today.getMonth()
    return { from: iso(new Date(today.getFullYear(), firstMonth, 1)), to: iso(today) }
  })
  const label = computed(() => period.value === 'month' ? 'Este mês (até hoje)' : 'Este trimestre (até hoje)')
  return { range, label }
}
