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
const money = (value: string) => Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
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
        class="w-72 shrink-0 rounded-2xl border border-stone-200 bg-stone-50 p-3 transition-colors"
        :class="hover === stage.id && stage.id ? 'border-orange-400 bg-orange-50' : ''"
        @dragover.prevent="hover = stage.id" @dragleave.self="hover = null" @drop.prevent="drop(stage.id)">
        <div class="mb-3 flex items-center justify-between gap-2 px-1">
          <h3 class="text-sm font-bold text-slate-800">{{ stage.name }}</h3>
          <span class="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">{{ items.filter(i => (i.funnel_stage_id || '') === stage.id).length }}</span>
        </div>
        <div class="min-h-24 space-y-3">
          <article v-for="item in items.filter(i => (i.funnel_stage_id || '') === stage.id)" :key="item.id"
            :draggable="canEdit && item.status === 'open' && !busyId"
            class="rounded-xl border border-stone-200 bg-white p-4 shadow-sm transition hover:shadow-md"
            :class="dragging === item.id ? 'opacity-50' : ''"
            @dragstart="dragging = item.id" @dragend="dragging = null; hover = null">
            <button type="button" class="w-full text-left" @click="emit('edit', item)">
              <p class="text-sm font-semibold text-slate-800">{{ item.title }}</p>
              <p class="mt-1 text-xs text-slate-500">{{ item.code }}</p>
              <p class="mt-3 text-sm text-slate-600">{{ item.client?.company_name || 'Cliente não informado' }}</p>
              <p class="mt-3 text-sm font-bold text-slate-900">{{ money(item.estimated_monthly_amount) }}/mês</p>
              <p v-if="item.expected_close_at" class="mt-1 text-xs text-slate-500">Previsão: {{ item.expected_close_at.slice(0, 10).split('-').reverse().join('/') }}</p>
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