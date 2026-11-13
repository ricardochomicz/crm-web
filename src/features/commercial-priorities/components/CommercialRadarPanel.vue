<script setup lang="ts">
import { computed } from 'vue'
import { useCommercialRadar } from '../composables/useCommercialRadar'
import type { CommercialRadarItem } from '../radarApi'

const props = defineProps<{ tenantId: string; enabled: boolean }>()
const tenantId = computed(() => props.tenantId)
const enabled = computed(() => props.enabled)
const { radar, loading, error, load } = useCommercialRadar(tenantId, enabled)

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
        <p class="mt-1 text-xs text-slate-500">Oportunidades, atividades e ativações sob sua responsabilidade.</p>
      </div>
      <button type="button" class="secondary-button w-auto" :disabled="loading" @click="load">
        {{ loading ? 'Atualizando…' : 'Atualizar' }}
      </button>
    </div>

    <p v-if="error" role="alert" class="mt-4 text-sm text-rose-700">
      {{ error }}
      <button type="button" class="underline" @click="load">Tentar novamente</button>
    </p>
    <p v-else-if="loading" class="mt-4 text-sm text-slate-500">Carregando prioridades…</p>
    <template v-else-if="radar">
      <div class="mt-4 flex flex-wrap gap-3 text-xs font-semibold">
        <span class="rounded-lg bg-rose-50 px-3 py-2 text-rose-700">{{ radar.summary.urgent }} urgentes</span>
        <span class="rounded-lg bg-amber-50 px-3 py-2 text-amber-800">{{ radar.summary.high }} alta prioridade</span>
      </div>
      <div v-if="radar.items.length" class="mt-4 space-y-2">
        <RouterLink
          v-for="item in radar.items.slice(0, 6)"
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
        <p v-if="radar.items.length > 6" class="text-xs text-slate-500">
          Exibindo 6 de {{ radar.summary.total }} prioridades.
        </p>
      </div>
      <p v-else class="mt-4 text-sm text-slate-500">Nenhuma pendência crítica identificada.</p>
    </template>
  </section>
</template>
