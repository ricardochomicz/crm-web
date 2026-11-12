<script setup lang="ts">
import { onUnmounted, watch } from 'vue'
import type { ProductivityRow } from '../api'

const props = defineProps<{ consultant: ProductivityRow | null }>()
const emit = defineEmits<{ close: [] }>()
const currency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
const number = (value: number) => new Intl.NumberFormat('pt-BR').format(value)
const metrics = (person: ProductivityRow) => [
  { label: 'Atividades concluídas', value: number(person.completed) },
  { label: 'Atividades atrasadas', value: number(person.overdue) },
  { label: 'Oportunidades criadas', value: number(person.opportunities) },
  { label: 'Oportunidades em aberto', value: number(person.open_opportunities) },
  { label: 'Pedidos vendidos', value: number(person.orders) },
  { label: 'Valor mensal vendido', value: currency(person.monthly_amount) },
]
function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && props.consultant) emit('close')
}
watch(() => props.consultant, person => {
  if (person) window.addEventListener('keydown', onKeydown)
  else window.removeEventListener('keydown', onKeydown)
}, { immediate: true })
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport to="body">
    <div v-if="consultant" class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4" @click.self="emit('close')">
      <section role="dialog" aria-modal="true" aria-labelledby="consultant-details-title" class="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <header class="sticky top-0 flex items-start justify-between gap-4 border-b border-stone-200 bg-white px-6 py-5">
          <div>
            <p class="text-xs font-semibold uppercase tracking-wider text-orange-700">Produtividade comercial</p>
            <h2 id="consultant-details-title" class="mt-1 text-xl font-bold text-slate-900">{{ consultant.name }}</h2>
            <p class="mt-1 text-sm text-slate-500">Indicadores do período selecionado no painel</p>
          </div>
          <button type="button" class="rounded-lg border border-stone-200 px-3 py-2 text-sm hover:bg-stone-50" aria-label="Fechar detalhes" @click="emit('close')">Fechar</button>
        </header>
        <div class="grid gap-4 p-6 sm:grid-cols-2">
          <div v-for="metric in metrics(consultant)" :key="metric.label" class="rounded-xl border border-stone-200 bg-stone-50 p-4">
            <p class="text-xs text-slate-500">{{ metric.label }}</p>
            <p class="mt-2 text-xl font-bold tabular-nums text-slate-900">{{ metric.value }}</p>
          </div>
        </div>
        <footer class="border-t border-stone-200 px-6 py-4 text-xs text-slate-500">Valores consolidados para este consultor. O detalhamento de registros será disponibilizado em uma próxima etapa.</footer>
      </section>
    </div>
  </Teleport>
</template>
