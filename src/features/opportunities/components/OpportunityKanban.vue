<script setup lang="ts">
import { computed, ref } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import type { FunnelStage, Opportunity } from '../api'
const props = defineProps<{ stages: FunnelStage[]; items: Opportunity[]; canEdit: boolean; busyId: string | null; highlightsOnly?: boolean; highlightedIds: string[]; highlightingId?: string | null }>()
const emit = defineEmits<{ move: [id: string, stageId: string]; edit: [item: Opportunity]; history: [item: Opportunity]; schedule: [item: Opportunity]; won: [item: Opportunity]; lost: [item: Opportunity]; resend: [item: Opportunity]; highlight: [id: string, highlighted: boolean] }>()
const dragging = ref<string | null>(null)
const hover = ref<string | null>(null)
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
function drop(stageId: string) {
  hover.value = null
  const item = props.items.find(item => item.id === dragging.value)
  dragging.value = null
  if (item && stageId && item.funnel_stage_id !== stageId && props.canEdit && !props.busyId) emit('move', item.id, stageId)
}
</script>
<template>
  <div>
    <div class="overflow-x-auto pb-4">
    <div class="flex min-w-max items-start gap-4">
      <section v-for="stage in columns" :key="stage.id || 'unassigned'"
        class="flex w-72 shrink-0 flex-col rounded-2xl border p-3 transition-colors"
        :class="[palette(stage.name).background, palette(stage.name).border, hover === stage.id && stage.id ? 'ring-2 ' + palette(stage.name).hover : '']"
        @dragover.prevent="hover = stage.id" @dragleave.self="hover = null" @drop.prevent="drop(stage.id)">
        <div class="mb-3 flex items-center justify-between gap-2 px-1">
          <h3 class="flex items-center gap-2 text-sm font-bold" :class="palette(stage.name).text"><span class="h-5 w-1 rounded-full" :class="palette(stage.name).accent"></span>{{ stage.name }}</h3>
          <span class="rounded-full px-2.5 py-1 text-xs font-semibold" :class="palette(stage.name).badge">{{ items.filter(i => matchesStage(i, stage)).length }}</span>
        </div>
        <div class="min-h-24 max-h-[calc(100vh-310px)] space-y-3 overflow-y-auto overscroll-contain pr-1 [scrollbar-width:thin]">
          <article v-for="item in stageItems(stage)" :key="item.id"
            :draggable="canEdit && item.status === 'open' && !busyId && !/para correção/i.test(stage.name)"
            class="rounded-xl border border-stone-200 bg-white p-4 shadow-sm transition hover:shadow-md"
            :class="[dragging === item.id ? 'opacity-50' : '', isOverdue(item) ? 'border-rose-200 bg-rose-50/40' : '']"
            @dragstart="dragging = item.id" @dragend="dragging = null; hover = null">
            <div class="mb-2 flex justify-end">
              <button type="button" class="rounded-md p-1 hover:bg-amber-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-500" :class="highlightedIds.has(item.id) ? 'text-amber-600' : 'text-slate-400'" :aria-label="highlightedIds.has(item.id) ? 'Remover destaque' : 'Destacar oportunidade'" :aria-pressed="highlightedIds.has(item.id)" @click="emit('highlight', item.id, !highlightedIds.has(item.id))" :disabled="highlightingId === item.id"><span class="inline-flex h-4 w-4 [&_svg]:h-4 [&_svg]:w-4"><AppIcon name="star" /></span></button>
            </div>
            <button type="button" class="w-full text-left" @click="emit('edit', item)">
              <span v-if="/para correção/i.test(stage.name)" class="mb-2 inline-block rounded-md bg-rose-100 px-2 py-1 text-xs font-bold text-rose-800">Devolvida pelo Backoffice</span>
              <p class="text-sm font-semibold text-slate-800">{{ item.title }}</p>
              <p class="mt-1 text-xs text-slate-500">{{ item.code }}</p>
              <p class="mt-3 text-sm text-slate-600">{{ item.client?.company_name || 'Cliente não informado' }}</p>
              <p class="mt-3 text-sm font-bold text-slate-900">{{ money(item.estimated_monthly_amount) }}/mês</p>
              <p v-if="item.expected_close_at" class="mt-1 text-xs" :class="isOverdue(item) ? 'font-semibold text-rose-700' : 'text-slate-500'">
                Previsão: {{ item.expected_close_at.slice(0, 10).split('-').reverse().join('/') }}
                <span v-if="isOverdue(item)" class="ml-1 rounded-md bg-rose-100 px-1.5 py-0.5 text-rose-800">Atrasada</span>
              </p>
            </button>
            <div class="mt-3 grid grid-cols-2 gap-2">
              <button type="button" class="flex h-8 min-w-0 items-center justify-center gap-1 rounded-lg border border-stone-200 bg-stone-50 px-2 text-xs font-semibold text-slate-700 hover:bg-stone-100" @click="emit('history', item)"><span class="inline-flex h-4 w-4 shrink-0 items-center justify-center [&_svg]:!h-4 [&_svg]:!w-4"><AppIcon name="message-square" /></span> Histórico</button>
              <button v-if="item.status === 'open'" type="button" class="flex h-8 min-w-0 items-center justify-center gap-1 rounded-lg border border-orange-200 bg-orange-50 px-2 text-xs font-semibold text-orange-800 hover:bg-orange-100" @click="emit('schedule', item)"><span class="inline-flex h-4 w-4 shrink-0 items-center justify-center [&_svg]:!h-4 [&_svg]:!w-4"><AppIcon name="calendar" /></span> Agendar</button>
            </div>
            <button v-if="canEdit && item.status === 'open' && /para correção/i.test(stage.name)" type="button" class="mt-3 w-full rounded-lg bg-orange-600 px-3 py-2 text-xs font-bold text-white hover:bg-orange-700 disabled:opacity-50" :disabled="!!busyId" @click="emit('resend', item)">Reenviar ao Backoffice</button>
            <div v-if="canEdit && item.status === 'open' && !/para correção/i.test(stage.name)" class="mt-3 grid grid-cols-2 gap-2 border-t border-stone-100 pt-3">
              <button type="button" class="flex items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-500" :disabled="!!busyId" @click="emit('won', item)">
                <span aria-hidden="true">✓</span> Ganha
              </button>
              <button type="button" class="flex items-center justify-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2 py-2 text-xs font-semibold text-rose-800 hover:bg-rose-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-500" :disabled="!!busyId" @click="emit('lost', item)">
                <span aria-hidden="true">✕</span> Perdida
              </button>
            </div>
          </article>
          <p v-if="!stageItems(stage).length" class="rounded-xl border border-dashed border-stone-300 p-5 text-center text-xs text-slate-400">{{ highlightsOnly ? 'Nenhum destaque nesta etapa' : 'Arraste oportunidades para esta etapa' }}</p>
        </div>
      </section>
    </div>
    </div>
  </div>
</template>