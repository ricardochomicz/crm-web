<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { comparisonsApi, type ComparisonOption } from '../api'
import { errorMessage } from '@/lib/feedback'
const route = useRoute()
const title = ref('')
const options = ref<ComparisonOption[]>([])
const loading = ref(true)
const error = ref('')
const printProposal = () => window.print()
const money = (amount: number) => amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const totals = computed(() => options.value.map(option => ({
  ...option, monthly: Number(option.monthly_unit_amount) * option.quantity,
  yearly: Number(option.monthly_unit_amount) * option.quantity * 12,
})))
const minimum = computed(() => totals.value.length ? Math.min(...totals.value.map(option => option.monthly)) : 0)
onMounted(async () => {
  try {
    const result = await comparisonsApi.publicShow(String(route.params.token))
    title.value = result.data.title
    options.value = result.data.options
  } catch (e) { error.value = errorMessage(e) }
  finally { loading.value = false }
})
</script>
<template>
  <main class="min-h-screen bg-slate-100 px-4 py-10 text-slate-800 print:bg-white print:p-0">
    <article class="mx-auto max-w-5xl overflow-hidden rounded-2xl bg-white shadow-xl print:rounded-none print:shadow-none">
      <header class="bg-slate-900 px-8 py-9 text-white print:break-after-avoid">
        <p class="text-xs font-bold uppercase tracking-widest text-orange-400">TelecomHub · Proposta comercial</p>
        <h1 class="mt-3 text-3xl font-semibold">{{ title || 'Comparativo de operadoras' }}</h1>
        <p class="mt-2 text-sm text-slate-300">Compare os planos e valores das operadoras para sua empresa.</p>
      </header>
      <div class="p-8">
        <p v-if="loading" class="py-16 text-center">Carregando proposta…</p>
        <p v-else-if="error" role="alert" class="rounded-xl bg-red-50 p-5 text-red-700">Esta proposta não está disponível ou seu link expirou.</p>
        <template v-else>
          <div class="mb-7 flex flex-wrap items-center justify-between gap-4 print:hidden">
            <p class="text-sm text-slate-500">Documento preparado para apresentação comercial.</p>
            <button type="button" class="rounded-lg bg-orange-600 px-5 py-3 font-semibold text-white" @click="printProposal">Salvar como PDF / Imprimir</button>
          </div>
          <div class="grid gap-5 md:grid-cols-3">
            <section v-for="option in totals" :key="option.product_id" class="break-inside-avoid rounded-xl border border-slate-200 p-5">
              <h2 class="text-xl font-bold">{{ option.operator_name }}</h2>
              <p class="mt-1 min-h-12 text-sm text-slate-600">{{ option.product_name }}</p>
              <p class="mt-4 text-3xl font-bold">{{ money(option.monthly) }}</p>
              <p class="text-sm text-slate-500">Mensal · {{ option.quantity }} linha(s)</p>
              <p v-if="option.monthly === minimum" class="mt-2 text-sm font-semibold text-emerald-700">Menor mensalidade</p>
              <dl class="mt-5 space-y-3 border-t border-slate-200 pt-4 text-sm">
                <div class="flex justify-between gap-3"><dt>Por linha</dt><dd class="font-semibold">{{ money(Number(option.monthly_unit_amount)) }}</dd></div>
                <div class="flex justify-between gap-3"><dt>12 meses</dt><dd class="font-semibold">{{ money(option.yearly) }}</dd></div>
              </dl>
              <p v-if="option.notes" class="mt-4 border-t border-slate-200 pt-3 text-sm text-slate-600">{{ option.notes }}</p>
            </section>
          </div>
          <p class="mt-8 text-xs text-slate-500">Comparação comercial informativa. Disponibilidade, condições e contratação devem ser confirmadas com a operadora. Os valores apresentados são os registrados na data da proposta.</p>
        </template>
      </div>
    </article>
  </main>
</template>
