import { computed } from 'vue'
import type { FunnelStage, Opportunity } from '../api'

type KanbanPresentationProps = {
  stages: FunnelStage[]
  items: Opportunity[]
  highlightsOnly?: boolean
  highlightedIds: string[]
}

export function useOpportunityKanbanPresentation(props: KanbanPresentationProps) {
  const highlightedIds = computed(() => new Set(props.highlightedIds))
  function stageItems(stage: FunnelStage) {
    return props.items.filter(item => matchesStage(item, stage))
      .filter(item => !props.highlightsOnly || highlightedIds.value.has(item.id))
      .sort((a, b) => Number(highlightedIds.value.has(b.id)) - Number(highlightedIds.value.has(a.id)))
  }
  const columns = computed(() => [
    ...props.stages.filter(s => s.is_active || props.items.some(item => item.funnel_stage_id === s.id)).sort((a, b) => {
      const aCorrection = /para correção/i.test(a.name)
      const bCorrection = /para correção/i.test(b.name)
      return aCorrection === bCorrection ? a.position - b.position : aCorrection ? -1 : 1
    }),
  ])
  const matchesStage = (item: Opportunity, stage: FunnelStage) => item.funnel_stage_id === stage.id || (!item.funnel_stage_id && /prospec/i.test(stage.name))
  const stagePalette = [
    { match: /para correção/i, background: 'bg-rose-50/80', border: 'border-rose-300', accent: 'bg-rose-600', text: 'text-rose-800', badge: 'bg-rose-100 text-rose-800', hover: 'ring-rose-300' },
    { match: /prospec/i, background: 'bg-amber-50/60', border: 'border-amber-200', accent: 'bg-amber-500', text: 'text-amber-800', badge: 'bg-amber-100 text-amber-800', hover: 'ring-amber-300' },
    { match: /negocia/i, background: 'bg-violet-50/60', border: 'border-violet-200', accent: 'bg-violet-500', text: 'text-violet-800', badge: 'bg-violet-100 text-violet-800', hover: 'ring-violet-300' },
    { match: /proposta/i, background: 'bg-blue-50/60', border: 'border-blue-200', accent: 'bg-blue-500', text: 'text-blue-800', badge: 'bg-blue-100 text-blue-800', hover: 'ring-blue-300' },
    { match: /fechamento/i, background: 'bg-green-50/60', border: 'border-green-200', accent: 'bg-green-500', text: 'text-green-800', badge: 'bg-green-100 text-green-800', hover: 'ring-green-300' },
  ]
  const neutralPalette = { background: 'bg-slate-50', border: 'border-slate-200', accent: 'bg-slate-400', text: 'text-slate-700', badge: 'bg-slate-100 text-slate-700', hover: 'ring-slate-300' }
  function palette(name: string) {
    return stagePalette.find(p => p.match.test(name)) || neutralPalette
  }
  const money = (value: string) => Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  function isOverdue(item: Opportunity): boolean {
      if (item.status !== 'open' || !item.expected_close_at) return false
      const now = new Date()
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
      return item.expected_close_at.slice(0, 10) < today
  }

  return { highlightedIds, stageItems, columns, matchesStage, palette, money, isOverdue }
}
