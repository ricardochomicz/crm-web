<script setup lang="ts">
import { computed, toRef } from 'vue'
import { useDashboardActivations } from '../composables/useDashboardActivations'
import DashboardMetricCard from './DashboardMetricCard.vue'

const props = defineProps<{ tenantId: string; enabled: boolean }>()
const { data, loading, error, monthLabel, refresh } = useDashboardActivations(
  toRef(props, 'tenantId'),
  toRef(props, 'enabled'),
)
const money = (value: string) => new Intl.NumberFormat('pt-BR', {
  style: 'currency', currency: 'BRL',
}).format(Number(value))
const lines = computed(() => data.value?.total.lines.toLocaleString('pt-BR') ?? '—')
const monthly = computed(() => data.value ? money(data.value.total.monthly) : '—')
</script>

<template>
  <section aria-label="Ativações comerciais" class="space-y-3" :aria-busy="loading">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 class="text-base font-semibold text-slate-900">Ativações comerciais</h2>
        <p class="mt-1 text-xs text-slate-500">Linhas efetivamente ativadas em {{ monthLabel }} (até hoje)</p>
      </div>
      <div class="flex items-center gap-3">
        <RouterLink :to="`/empresas/${tenantId}/pedidos`" class="text-xs font-semibold text-orange-700 hover:underline">Ver pedidos</RouterLink>
        <button type="button" class="secondary-button w-auto" :disabled="loading" @click="refresh">
          {{ loading ? 'Atualizando…' : 'Atualizar' }}
        </button>
      </div>
    </div>
    <p v-if="error" role="alert" class="text-sm text-rose-700">
      {{ error }} <button type="button" class="underline" @click="refresh">Tentar novamente</button>
    </p>
    <div class="grid gap-3 sm:grid-cols-2">
      <DashboardMetricCard label="Linhas ativadas" :value="lines" detail="Quantidade de linhas ativadas no mês" accent="sky" />
      <DashboardMetricCard label="Valor mensal das ativações" :value="monthly" detail="Valor contratado das linhas ativadas; não é receita recebida" accent="emerald" />
    </div>
  </section>
</template>
