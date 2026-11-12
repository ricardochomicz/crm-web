<script setup lang="ts">
import { useOpportunityKanbanPresentation } from '../composables/useOpportunityKanbanPresentation'
import { useOpportunityKanbanDrag } from '../composables/useOpportunityKanbanDrag'
import AppIcon from '@/components/ui/AppIcon.vue'
import type { FunnelStage, Opportunity } from '../api'
const props = defineProps<{ stages: FunnelStage[]; items: Opportunity[]; canEdit: boolean; busyId: string | null; highlightsOnly?: boolean; highlightedIds: string[]; highlightingId?: string | null; stageStates?: Record<string, { page: number; lastPage: number; total: number; loading: boolean; error: string }> }>()
const emit = defineEmits<{ move: [id: string, stageId: string]; edit: [item: Opportunity]; history: [item: Opportunity]; schedule: [item: Opportunity]; won: [item: Opportunity]; lost: [item: Opportunity]; resend: [item: Opportunity]; highlight: [id: string, highlighted: boolean]; loadMore: [stageId: string] }>()
const { highlightedIds, stageItems, columns, matchesStage, palette, money, isOverdue } = useOpportunityKanbanPresentation(props)
function onColumnScroll(event: Event, stageId: string) {
  const state = props.stageStates?.[stageId]
  if (!state || state.loading || state.page >= state.lastPage) return
  const column = event.target as HTMLElement
  if (column.scrollHeight - column.scrollTop - column.clientHeight < 160) emit('loadMore', stageId)
}
const { dragging, hover, canDrag, resetDrag, startDrag, overStage, leaveStage, drop } =
  useOpportunityKanbanDrag(props, (id, stageId) => emit('move', id, stageId))
</script>
<template>
  <div>
    <div class="overflow-x-auto pb-4">
    <div class="flex min-w-max items-start gap-4">
      <section v-for="stage in columns" :key="stage.id || 'unassigned'"
        class="flex w-80 min-h-80 shrink-0 flex-col rounded-2xl border p-3 transition-colors"
        :class="[palette(stage.name).background, palette(stage.name).border, hover === stage.id && stage.id ? 'ring-4 ring-inset ' + palette(stage.name).hover + ' border-current' : '']"
        @dragenter.prevent="overStage($event, stage.id)" @dragover.prevent="overStage($event, stage.id)" @dragleave="leaveStage($event, stage.id)" @drop.stop="drop($event, stage.id)">
        <div class="mb-3 flex items-center justify-between gap-2 px-1">
          <h3 class="flex items-center gap-2 text-sm font-bold" :class="palette(stage.name).text"><span class="h-5 w-1 rounded-full" :class="palette(stage.name).accent"></span>{{ stage.name }}</h3>
          <span class="rounded-full px-2.5 py-1 text-xs font-semibold" :class="palette(stage.name).badge">{{ stageStates?.[stage.id]?.total ?? items.filter(i => matchesStage(i, stage)).length }}</span>
        </div>
        <div class="min-h-64 max-h-[calc(100vh-310px)] space-y-3 overflow-y-auto overscroll-contain pr-1 pb-6 [scrollbar-width:thin]" @scroll.passive="onColumnScroll($event, stage.id)">
          <article v-for="item in stageItems(stage)" :key="item.id"
            :draggable="canDrag(item, stage.name)"
            class="rounded-xl border border-stone-200 bg-white p-4 shadow-sm transition hover:shadow-md"
            :class="[dragging === item.id ? 'opacity-50' : '', isOverdue(item) ? 'border-rose-200 bg-rose-50/40' : '']"
            @dragstart="startDrag($event, item)" @dragend="resetDrag">
            <div class="mb-2 flex items-center justify-between">
              <span v-if="canDrag(item, stage.name)"
                title="Arraste o cartão para mudar de etapa" aria-label="Arrastar oportunidade para outra etapa"
                class="inline-flex cursor-grab select-none items-center gap-2 rounded-lg border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-semibold text-slate-600 active:cursor-grabbing"
                >
                <span aria-hidden="true">⠿</span> Mover
              </span>
              <span v-else></span>
              <button type="button" class="rounded-md p-1 hover:bg-amber-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-500" :class="highlightedIds.has(item.id) ? 'text-amber-600' : 'text-slate-400'" :aria-label="highlightedIds.has(item.id) ? 'Remover destaque' : 'Destacar oportunidade'" :aria-pressed="highlightedIds.has(item.id)" @click="emit('highlight', item.id, !highlightedIds.has(item.id))" :disabled="highlightingId === item.id"><span class="inline-flex h-4 w-4 [&_svg]:h-4 [&_svg]:w-4"><AppIcon name="star" /></span></button>
            </div>
            <button type="button" class="w-full text-left" @click="emit('edit', item)">
              <span v-if="/para correção/i.test(stage.name)" class="mb-2 inline-block rounded-md bg-rose-100 px-2 py-1 text-xs font-bold text-rose-800">Devolvida pelo Backoffice</span>
              <p class="text-sm font-semibold text-slate-800">{{ item.title }}</p>
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
          <p v-if="stageStates?.[stage.id]?.loading" class="text-center text-xs text-slate-500">Carregando mais oportunidades…</p>
          <button v-if="stageStates?.[stage.id]?.error" type="button" class="text-xs text-rose-700 underline" @click="emit('loadMore', stage.id)">Tentar novamente</button>
          <button v-if="stageStates?.[stage.id] && stageStates[stage.id].page < stageStates[stage.id].lastPage" type="button" class="w-full rounded-lg border border-stone-200 bg-white p-2 text-xs font-semibold text-slate-700 disabled:opacity-50" :disabled="stageStates[stage.id].loading" @click="emit('loadMore', stage.id)">Carregar mais nesta etapa</button>
          <p v-if="!stageItems(stage).length" class="rounded-xl border border-dashed border-stone-300 p-5 text-center text-xs text-slate-400">{{ highlightsOnly ? 'Nenhum destaque nesta etapa' : 'Arraste oportunidades para esta etapa' }}</p>
        </div>
      </section>
    </div>
    </div>
  </div>
</template>