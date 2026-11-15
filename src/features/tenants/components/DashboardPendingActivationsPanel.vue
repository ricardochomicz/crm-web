<script setup lang="ts">
import { toRef } from 'vue'
import { usePendingActivations } from '../composables/usePendingActivations'
import DashboardMetricCard from './DashboardMetricCard.vue'

const props = defineProps<{ tenantId: string; enabled: boolean }>()
const { data, loading, error, refresh } = usePendingActivations(toRef(props, 'tenantId'), toRef(props, 'enabled'))
const number = (value: number | undefined) => value == null ? '—' : value.toLocaleString('pt-BR')
</script>

<template>
  <section aria-label="Pedidos aguardando ativação" :aria-busy="loading" class="space-y-3">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 class="text-base font-semibold text-slate-900">Aguardando ativação</h2>
        <p class="mt-1 text-xs text-slate-500">Pedidos com linhas pendentes, inclusive ativações parciais</p>
      </div>
      <RouterLink :to="`/empresas/${tenantId}/pedidos`" class="text-xs font-semibold text-orange-700 hover:underline">Acompanhar pedidos</RouterLink>
    </div>
    <div v-if="error" role="alert" class="text-sm text-rose-700">
      {{ error }} <button type="button" class="underline" @click="refresh">Tentar novamente</button>
    </div>
    <div class="grid gap-3 sm:grid-cols-3">
      <DashboardMetricCard label="Pedidos pendentes" :value="number(data?.pending.orders)" detail="Com pelo menos uma linha pendente" accent="sky" />
      <DashboardMetricCard label="Linhas pendentes" :value="number(data?.pending.lines)" detail="Quantidade total ainda não ativada" accent="violet" />
      <DashboardMetricCard label="Pedidos atrasados" :value="number(data?.overdue.orders)" :detail="`${number(data?.overdue.lines)} linhas com previsão vencida`" accent="fuchsia" />
    </div>
    <p class="text-xs text-slate-500">Atraso calculado pela previsão de ativação do pedido. Pedidos sem previsão não são classificados como atrasados.</p>
  </section>
</template>
