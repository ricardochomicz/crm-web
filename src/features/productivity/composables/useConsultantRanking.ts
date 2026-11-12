import { computed, ref, type Ref } from 'vue'
import type { ProductivityRow } from '../api'

export type RankingMetric = 'monthly_amount' | 'orders' | 'completed'
export const rankingMetrics: { value: RankingMetric; label: string }[] = [
  { value: 'monthly_amount', label: 'Valor mensal' },
  { value: 'orders', label: 'Pedidos' },
  { value: 'completed', label: 'Atividades concluídas' },
]

export function useConsultantRanking(rows: Ref<ProductivityRow[]>) {
  const metric = ref<RankingMetric>('monthly_amount')
  const ranked = computed(() =>
    [...rows.value]
      .sort((a, b) => b[metric.value] - a[metric.value] || a.name.localeCompare(b.name, 'pt-BR'))
      .map((person, index) => ({ ...person, position: index + 1 })),
  )
  const maximum = computed(() => Math.max(1, ...ranked.value.map(person => person[metric.value])))
  return { metric, ranked, maximum }
}
