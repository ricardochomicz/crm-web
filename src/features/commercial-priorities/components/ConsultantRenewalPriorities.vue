<script setup lang="ts">
import { computed, ref } from 'vue'
import type { RenewalPrioritySummary } from '../api'

const props = defineProps<{
  tenantId: string
  summary: RenewalPrioritySummary
  acknowledgingId: string | null
  acknowledgingAll: 'opportunities' | 'renewals' | null
  busy: boolean
}>()

const emit = defineEmits<{
  acknowledge: [contractId: string]
  acknowledgeAll: []
}>()

const expanded = ref(false)

const pending = computed(() =>
  props.summary.items.filter((item) => !item.acknowledged).length,
)

const money = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

function date(value: string): string {
  const [year, month, day] = value.slice(0, 10).split('-')
  return year && month && day ? `${day}/${month}/${year}` : value
}
</script>

<template>
  <section class="space-y-3 border-t border-stone-200 pt-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <button
        type="button"
        class="flex items-center gap-2 text-left"
        :aria-expanded="expanded"
        aria-controls="consultant-renewal-details"
        @click="expanded = !expanded"
      >
        <span class="text-sm">{{ expanded ? '▾' : '▸' }}</span>
        <span>
          <span class="block text-base font-semibold text-slate-900">Renovações da sua carteira</span>
          <span class="mt-1 block text-xs text-slate-500">
            {{ summary.total_clients }} cliente(s) · {{ pending }} não revisada(s)
          </span>
        </span>
      </button>
      <button
        v-if="pending && !summary.truncated"
        type="button"
        class="secondary-button w-auto"
        :disabled="!!acknowledgingAll || busy"
        @click="emit('acknowledgeAll')"
      >
        {{ acknowledgingAll === 'renewals' ? 'Confirmando...' : 'Ciente de todas' }}
      </button>
    </div>

    <div v-if="expanded" id="consultant-renewal-details" class="space-y-3">
      <p
        v-if="summary.truncated"
        role="status"
        class="rounded-lg bg-amber-50 p-3 text-xs text-amber-800"
      >
        A lista é parcial devido ao volume de contratos. Consulte a carteira para ver todos.
      </p>

      <div
        v-for="item in summary.items"
        :key="item.id"
        class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-200 p-3"
      >
        <div class="min-w-0">
          <p class="text-sm font-semibold text-slate-900">
            {{ item.client_name ?? 'Cliente não informado' }}
          </p>
          <p class="mt-1 text-xs text-slate-500">
            {{ item.operator_name ?? 'Operadora não informada' }}
            · {{ item.lines }} linha(s)
            · {{ money.format(Number(item.monthly)) }}/mês
          </p>
          <p
            class="mt-1 text-xs font-medium"
            :class="item.status === 'overdue' ? 'text-rose-700' : 'text-amber-700'"
          >
            {{ item.status === 'overdue' ? 'Prazo vencido' : 'Renovação próxima' }}
            · {{ date(item.renewal_date) }}
          </p>
        </div>

        <div class="flex items-center gap-3">
          <RouterLink
            :to="`/empresas/${tenantId}/carteira`"
            class="text-xs font-semibold text-orange-700 hover:underline"
          >
            Ver carteira
          </RouterLink>
          <span v-if="item.acknowledged" class="text-xs font-medium text-emerald-700">
            Ciente hoje
          </span>
          <button
            v-else
            type="button"
            class="secondary-button w-auto"
            :disabled="!!acknowledgingId || !!acknowledgingAll || busy"
            @click="emit('acknowledge', item.id)"
          >
            {{ acknowledgingId === item.id ? 'Salvando...' : 'Estou ciente' }}
          </button>
        </div>
      </div>

      <p v-if="!summary.items.length" class="py-4 text-sm text-slate-500">
        Nenhuma renovação pendente identificada na sua carteira.
      </p>
    </div>
  </section>
</template>
