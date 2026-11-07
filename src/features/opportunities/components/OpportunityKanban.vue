<script setup lang="ts">
import { computed, ref } from 'vue'
import type { FunnelStage, Opportunity } from '../api'
const props = defineProps<{ stages: FunnelStage[]; items: Opportunity[]; canEdit: boolean; busyId: string | null }>()
const emit = defineEmits<{ move: [id: string, stageId: string]; edit: [item: Opportunity] }>()
const dragging = ref<string | null>(null)
const hover = ref<string | null>(null)
const columns = computed(() => [
  { id: '', name: 'Sem etapa', position: -1, is_active: true },
  ...props.stages.filter(s => s.is_active || props.items.some(item => item.funnel_stage_id === s.id)),
])
const stagePalette = [
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
  <div class="overflow-x-auto pb-4">
    <div class="flex min-w-max items-start gap-4">
      <section v-for="stage in columns" :key="stage.id || 'unassigned'"
        class="w-72 shrink-0 rounded-2xl border p-3 transition-colors"
        :class="[palette(stage.name).background, palette(stage.name).border, hover === stage.id && stage.id ? 'ring-2 ' + palette(stage.name).hover : '']"
        @dragover.prevent="hover = stage.id" @dragleave.self="hover = null" @drop.prevent="drop(stage.id)">
        <div class="mb-3 flex items-center justify-between gap-2 px-1">
          <h3 class="flex items-center gap-2 text-sm font-bold" :class="palette(stage.name).text"><span class="h-5 w-1 rounded-full" :class="palette(stage.name).accent"></span>{{ stage.name }}</h3>
          <span class="rounded-full px-2.5 py-1 text-xs font-semibold" :class="palette(stage.name).badge">{{ items.filter(i => (i.funnel_stage_id || '') === stage.id).length }}</span>
        </div>
        <div class="min-h-24 space-y-3">
          <article v-for="item in items.filter(i => (i.funnel_stage_id || '') === stage.id)" :key="item.id"
            :draggable="canEdit && item.status === 'open' && !busyId"
            class="rounded-xl border border-stone-200 bg-white p-4 shadow-sm transition hover:shadow-md"
            :class="[dragging === item.id ? 'opacity-50' : '', isOverdue(item) ? 'border-rose-200 bg-rose-50/40' : '']"
            @dragstart="dragging = item.id" @dragend="dragging = null; hover = null">
            <button type="button" class="w-full text-left" @click="emit('edit', item)">
              <p class="text-sm font-semibold text-slate-800">{{ item.title }}</p>
              <p class="mt-1 text-xs text-slate-500">{{ item.code }}</p>
              <p class="mt-3 text-sm text-slate-600">{{ item.client?.company_name || 'Cliente não informado' }}</p>
              <p class="mt-3 text-sm font-bold text-slate-900">{{ money(item.estimated_monthly_amount) }}/mês</p>
              <p v-if="item.expected_close_at" class="mt-1 text-xs" :class="isOverdue(item) ? 'font-semibold text-rose-700' : 'text-slate-500'">
                Previsão: {{ item.expected_close_at.slice(0, 10).split('-').reverse().join('/') }}
                <span v-if="isOverdue(item)" class="ml-1 rounded-md bg-rose-100 px-1.5 py-0.5 text-rose-800">Atrasada</span>
              </p>
            </button>
            <label v-if="canEdit && item.status === 'open'" class="mt-3 block text-xs text-slate-500">Mover para
              <select class="field mt-1 text-xs" :disabled="!!busyId" :value="item.funnel_stage_id || ''"
                @change="emit('move', item.id, ($event.target as HTMLSelectElement).value)">
                <option value="" disabled>Selecione a etapa</option>
                <option v-for="target in stages.filter(s => s.is_active)" :key="target.id" :value="target.id">{{ target.name }}</option>
              </select>
            </label>
          </article>
          <p v-if="!items.some(i => (i.funnel_stage_id || '') === stage.id)" class="rounded-xl border border-dashed border-stone-300 p-5 text-center text-xs text-slate-400">Arraste oportunidades para esta etapa</p>
        </div>
      </section>
    </div>
  </div>
</template>