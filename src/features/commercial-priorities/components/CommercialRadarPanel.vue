<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCommercialRadar } from '../composables/useCommercialRadar'
import { useCommercialRadarMembers } from '../composables/useCommercialRadarMembers'
import SearchSelect from '@/components/ui/SearchSelect.vue'
import type { CommercialRadarItem } from '../radarApi'

const props = defineProps<{ tenantId: string; enabled: boolean }>()
const tenantId = computed(() => props.tenantId)
const enabled = computed(() => props.enabled)
const { options, selectedMemberId, loading: membersLoading, error: membersError } =
  useCommercialRadarMembers(tenantId, enabled)
const selectedScope = ref<'mine' | 'team'>('mine')
const memberSelection = computed(() => selectedScope.value === 'team' ? '' : selectedMemberId.value)
const { radar, loading, error, load } = useCommercialRadar(tenantId, enabled, memberSelection, selectedScope)
const canViewTeam = computed(() => options.value.length > 2)
function changeScope(scope: 'mine' | 'team') {
  selectedScope.value = scope
  selectedMemberId.value = ''
}

const selectedType = ref<'all' | CommercialRadarItem['type']>('all')
const visibleItems = computed(() => radar.value?.items.filter((item) =>
  selectedType.value === 'all' || item.type === selectedType.value,
) ?? [])
const typeOptions = [
  { value: 'all', label: 'Todos' },
  { value: 'opportunity', label: 'Oportunidades' },
  { value: 'activity', label: 'Atividades' },
  { value: 'order', label: 'Pedidos' },
] as const

function destination(item: CommercialRadarItem): string {
  const base = '/empresas/' + encodeURIComponent(props.tenantId)
  if (item.type === 'opportunity') {
    return base + '/oportunidades?oportunidade=' + encodeURIComponent(item.destination_id)
  }
  if (item.type === 'order') {
    return base + '/pedidos?pedido=' + encodeURIComponent(item.destination_id)
  }
  return base + '/atividades'
}
</script>

<template>
  <section aria-label="Radar comercial" class="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p class="text-xs font-semibold uppercase tracking-widest text-orange-700">Radar comercial</p>
        <h2 class="mt-1 text-lg font-semibold text-slate-900">Ações que precisam de atenção</h2>
        <p class="mt-1 text-xs text-slate-500">Oportunidades, atividades e ativações por responsável autorizado.</p>
      </div>
      <div class="flex w-full flex-wrap items-end gap-3 sm:w-auto">
        <div v-if="canViewTeam" class="flex gap-1 rounded-xl border border-stone-200 p-1" role="group" aria-label="Escopo do radar">
          <button v-for="scope in ([{ value: 'mine', label: 'Individual' }, { value: 'team', label: 'Equipe' }] as const)" :key="scope.value" type="button" class="rounded-lg px-3 py-2 text-xs font-semibold" :class="selectedScope === scope.value ? 'bg-orange-100 text-orange-800' : 'text-slate-600'" :aria-pressed="selectedScope === scope.value" @click="changeScope(scope.value)">{{ scope.label }}</button>
        </div>
        <label v-if="selectedScope === 'mine'" class="block min-w-56 flex-1 text-xs font-medium text-slate-600">
          Consultor
          <SearchSelect
            v-model="selectedMemberId"
            class="mt-1"
            :options="options"
            :disabled="membersLoading || !enabled"
            placeholder="Selecione um consultor"
          />
        </label>
        <button type="button" class="secondary-button w-auto" :disabled="loading" @click="load">
        {{ loading ? 'Atualizando…' : 'Atualizar' }}
        </button>
      </div>
    </div>

    <p v-if="membersError" role="alert" class="mt-3 text-sm text-rose-700">{{ membersError }}</p>
    <p v-if="error" role="alert" class="mt-4 text-sm text-rose-700">
      {{ error }}
      <button type="button" class="underline" @click="load">Tentar novamente</button>
    </p>
    <p v-else-if="loading" class="mt-4 text-sm text-slate-500">Carregando prioridades…</p>
    <template v-else-if="radar">
      <div class="mt-4 grid gap-3 text-xs font-semibold sm:grid-cols-2 xl:grid-cols-5">
        <span class="rounded-lg bg-rose-50 px-3 py-2 text-rose-700">{{ radar.summary.urgent }} urgentes</span>
        <span class="rounded-lg bg-amber-50 px-3 py-2 text-amber-800">{{ radar.summary.high }} alta prioridade</span>
        <span class="rounded-lg bg-stone-50 px-3 py-2 text-slate-700">{{ radar.summary.by_type.opportunity }} oportunidades</span>
        <span class="rounded-lg bg-stone-50 px-3 py-2 text-slate-700">{{ radar.summary.by_type.activity }} atividades</span>
        <span class="rounded-lg bg-stone-50 px-3 py-2 text-slate-700">{{ radar.summary.by_type.order }} pedidos</span>
      </div>
      <div class="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filtrar prioridades por tipo">
        <button
          v-for="option in typeOptions"
          :key="option.value"
          type="button"
          :aria-pressed="selectedType === option.value"
          class="rounded-lg border px-3 py-2 text-xs font-semibold transition"
          :class="selectedType === option.value
            ? 'border-orange-500 bg-orange-50 text-orange-800'
            : 'border-stone-200 bg-white text-slate-600 hover:border-orange-300'"
          @click="selectedType = option.value"
        >
          {{ option.label }}
        </button>
      </div>
      <div v-if="visibleItems.length" class="mt-4 space-y-2">
        <RouterLink
          v-for="item in visibleItems.slice(0, 6)"
          :key="item.type + '-' + item.id"
          :to="destination(item)"
          class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-200 p-3 transition hover:border-orange-300 focus-visible:outline-2 focus-visible:outline-orange-600"
        >
          <div class="min-w-0">
            <p class="text-sm font-semibold text-slate-900">{{ item.title }}</p>
            <p class="mt-1 text-xs text-slate-500">{{ item.reason }}</p>
          </div>
          <span
            class="rounded-lg px-2 py-1 text-xs font-semibold"
            :class="item.priority === 'urgent' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-800'"
          >
            {{ item.priority === 'urgent' ? 'Urgente' : 'Alta' }}
          </span>
        </RouterLink>
        <p v-if="visibleItems.length > 6" class="text-xs text-slate-500">
          Exibindo 6 de {{ visibleItems.length }} prioridades deste filtro.
        </p>
      </div>
      <p v-else class="mt-4 text-sm text-slate-500">Nenhuma pendência encontrada para este filtro.</p>
    </template>
  </section>
</template>
