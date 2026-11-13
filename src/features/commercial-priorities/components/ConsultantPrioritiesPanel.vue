<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCommercialPriorities } from '../composables/useCommercialPriorities'
import ConsultantRenewalPriorities from './ConsultantRenewalPriorities.vue'
import { buildCommercialRadar } from '../utils/commercialRadar'
import { opportunityAgeClass, opportunityAgeLabel } from '@/features/opportunities/utils/opportunityAge'

const props = defineProps<{ tenantId: string; enabled: boolean }>()

const tenantId = computed(() => props.tenantId)
const enabled = computed(() => props.enabled)
const {
  summary,
  loading,
  error,
  acknowledgingId,
  acknowledgingRenewalId,
  acknowledgingAll,
  acknowledgeAll,
  load,
  acknowledge,
  acknowledgeRenewal,
} = useCommercialPriorities(tenantId, enabled)

const opportunitiesExpanded = ref(false)
const radarItems = computed(() => summary.value ? buildCommercialRadar(summary.value.items, summary.value.renewals.items, props.tenantId) : [])
const urgentCount = computed(() => radarItems.value.filter(item => item.priority === 'urgent').length)
const highCount = computed(() => radarItems.value.filter(item => item.priority === 'high').length)

const opportunityPending = computed(
  () => summary.value?.items.filter((item) => !item.acknowledged).length ?? 0,
)

function formatDate(value: string | null): string {
  if (!value) return 'Não informada'

  const [year, month, day] = value.slice(0, 10).split('-')
  return year && month && day ? `${day}/${month}/${year}` : value
}

const money = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

const pending = computed(
  () => (summary.value?.items.filter((item) => !item.acknowledged).length ?? 0)
    + (summary.value?.renewals.items.filter((item) => !item.acknowledged).length ?? 0),
)
</script>

<template>
  <section class="space-y-4 rounded-2xl border border-orange-200 bg-white p-5 shadow-sm">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p class="text-xs font-semibold uppercase tracking-widest text-orange-700">
          Sua semana comercial
        </p>
        <h2 class="mt-1 text-xl font-bold text-slate-900">Prioridades para acompanhar</h2>
        <p class="mt-1 text-sm text-slate-500">
          Oportunidades da semana e em atraso, sob sua responsabilidade.
        </p>
      </div>
      <button
        type="button"
        class="secondary-button w-auto"
        :disabled="loading"
        @click="load"
      >
        Atualizar
      </button>
    </div>

    <p v-if="error" role="alert" class="rounded-lg bg-red-50 p-3 text-sm text-red-700">
      {{ error }}
    </p>
    <p v-if="loading" class="py-6 text-sm text-slate-500">Carregando prioridades...</p>

    <template v-else-if="summary">
      <section aria-label="Radar comercial" class="rounded-xl border border-stone-200 bg-stone-50 p-4">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 class="text-sm font-bold text-slate-900">Radar comercial · próximas ações</h3>
            <p class="mt-1 text-xs text-slate-500">Priorização por vencimento, baseada nas oportunidades e renovações disponíveis para seu perfil.</p>
          </div>
          <span class="text-xs font-semibold text-slate-600">{{ urgentCount }} urgente(s) · {{ highCount }} alta prioridade</span>
        </div>
        <div v-if="radarItems.length" class="mt-3 space-y-2">
          <RouterLink v-for="item in radarItems.slice(0, 5)" :key="item.key" :to="item.href"
            class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-stone-200 bg-white p-3 transition hover:border-orange-300 focus-visible:outline-2 focus-visible:outline-orange-600">
            <div class="min-w-0">
              <p class="text-sm font-semibold text-slate-900">{{ item.title }}</p>
              <p class="mt-1 text-xs text-slate-500">{{ item.detail }} · {{ item.reason }}</p>
            </div>
            <span class="rounded-lg px-2 py-1 text-xs font-semibold"
              :class="item.priority === 'urgent' ? 'bg-rose-50 text-rose-700' : item.priority === 'high' ? 'bg-amber-50 text-amber-800' : 'bg-sky-50 text-sky-700'">
              {{ item.priority === 'urgent' ? 'Urgente' : item.priority === 'high' ? 'Alta' : 'Acompanhar' }}
            </span>
          </RouterLink>
          <p v-if="radarItems.length > 5" class="text-xs text-slate-500">Exibindo as 5 primeiras de {{ radarItems.length }} prioridades.</p>
        </div>
        <p v-else class="mt-3 text-sm text-slate-500">Nenhuma prioridade pendente de revisão no momento.</p>
      </section>

      <div class="grid gap-3 sm:grid-cols-3">
        <div class="rounded-xl bg-stone-50 p-4">
          <p class="text-xs text-slate-500">Linhas para fechar</p>
          <p class="mt-2 text-2xl font-bold tabular-nums">{{ summary.total_lines }}</p>
        </div>
        <div class="rounded-xl bg-stone-50 p-4">
          <p class="text-xs text-slate-500">Receita mensal potencial</p>
          <p class="mt-2 text-2xl font-bold tabular-nums">
            {{ money.format(Number(summary.total_monthly)) }}
          </p>
        </div>
        <div class="rounded-xl bg-stone-50 p-4">
          <p class="text-xs text-slate-500">Pendências não revisadas hoje</p>
          <p class="mt-2 text-2xl font-bold tabular-nums">{{ pending }}</p>
        </div>
      </div>

      <p class="text-xs text-slate-500">
        Valores estimados de oportunidades abertas. Não representam faturamento.
        A ciência não conclui nem retira uma oportunidade da lista.
      </p>

      <div class="flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 pt-4">
        <button
          type="button"
          class="flex items-center gap-2 text-left text-sm font-semibold text-slate-800"
          :aria-expanded="opportunitiesExpanded"
          aria-controls="consultant-opportunity-details"
          @click="opportunitiesExpanded = !opportunitiesExpanded"
        >
          <span>{{ opportunitiesExpanded ? '▾' : '▸' }}</span>
          Oportunidades ({{ summary.total_opportunities }})
          <span class="text-xs font-normal text-slate-500">{{ opportunityPending }} não revisada(s)</span>
        </button>
        <button
          v-if="opportunityPending"
          type="button"
          class="secondary-button w-auto"
          :disabled="!!acknowledgingAll || !!acknowledgingId || !!acknowledgingRenewalId"
          @click="acknowledgeAll('opportunities')"
        >
          {{ acknowledgingAll === 'opportunities' ? 'Confirmando...' : 'Ciente de todas' }}
        </button>
      </div>

      <div v-if="opportunitiesExpanded" id="consultant-opportunity-details" class="space-y-2">
        <div
          v-for="item in summary.items"
          :key="item.id"
          class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-200 p-3"
        >
          <div class="min-w-0">
            <p class="text-sm font-semibold text-slate-900">{{ item.title }}</p>
            <p class="mt-1 text-xs text-slate-500">
              {{ item.client_name ?? 'Cliente não informado' }}
              · {{ item.operator_name ?? 'Operadora não informada' }}
              · {{ item.lines }} linha(s)
              · {{ money.format(Number(item.monthly)) }}/mês
            </p>
            <p class="mt-1 text-xs text-slate-500">
              Previsão: {{ formatDate(item.expected_close_at) }}
              <span
                v-if="opportunityAgeLabel(item.created_at)"
                class="ml-2 inline-block"
                :class="opportunityAgeClass(item.created_at)"
              >
                · {{ opportunityAgeLabel(item.created_at) }}
              </span>
            </p>
          </div>
          <div class="flex items-center gap-2">
            <RouterLink
              :to="`/empresas/${tenantId}/oportunidades`"
              class="text-xs font-semibold text-orange-700 hover:underline"
            >
              Abrir oportunidades
            </RouterLink>
            <span v-if="item.acknowledged" class="text-xs font-medium text-emerald-700">
              Ciente hoje
            </span>
            <button
              v-else
              type="button"
              class="secondary-button w-auto"
              :disabled="!!acknowledgingId"
              @click="acknowledge(item.id)"
            >
              {{ acknowledgingId === item.id ? 'Salvando...' : 'Estou ciente' }}
            </button>
          </div>
        </div>
        <p v-if="!summary.items.length" class="py-5 text-sm text-slate-500">
          Nenhuma oportunidade prevista para esta semana ou em atraso.
        </p>
      </div>

      <ConsultantRenewalPriorities
        :tenant-id="tenantId"
        :summary="summary.renewals"
        :acknowledging-id="acknowledgingRenewalId"
        :acknowledging-all="acknowledgingAll"
        :busy="!!acknowledgingId || !!acknowledgingRenewalId"
        @acknowledge="acknowledgeRenewal"
        @acknowledge-all="acknowledgeAll('renewals')"
      />
    </template>
  </section>
</template>
