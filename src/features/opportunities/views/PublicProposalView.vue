<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { proposalsApi, type ProposalSnapshot } from '../api'

const route = useRoute()
const loading = ref(true)
const failed = ref(false)
const snapshot = ref<ProposalSnapshot | null>(null)
const version = ref(0)
const expiresAt = ref('')
const monthly = computed(() => (snapshot.value?.items ?? []).reduce((sum, item) => sum + Number(item.monthly_unit_amount) * item.quantity, 0))
const once = computed(() => (snapshot.value?.items ?? []).reduce((sum, item) => sum + Number(item.one_time_unit_amount) * item.quantity, 0))
const money = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
onMounted(async () => {
  try {
    const result = (await proposalsApi.publicShow(String(route.params.token))).data
    snapshot.value = result.snapshot
    version.value = result.version
    expiresAt.value = result.expires_at
  } catch { failed.value = true }
  finally { loading.value = false }
})
</script>

<template>
  <main class="min-h-screen bg-stone-100 px-4 py-10 text-slate-900 print:bg-white print:p-0">
    <div v-if="loading" class="mx-auto max-w-3xl text-center text-slate-600">Carregando proposta…</div>
    <div v-else-if="failed || !snapshot" class="mx-auto max-w-xl rounded-2xl bg-white p-8 text-center shadow-sm">
      <h1 class="text-xl font-bold">Proposta indisponível</h1>
      <p class="mt-2 text-slate-600">Este link é inválido, expirou ou foi revogado. Solicite uma nova proposta ao consultor.</p>
    </div>
    <article v-else class="mx-auto max-w-4xl rounded-2xl bg-white p-6 shadow-sm sm:p-10 print:max-w-none print:rounded-none print:p-0 print:shadow-none">
      <div class="mb-8 flex flex-wrap items-start justify-between gap-4 border-b-2 border-orange-600 pb-6">
        <div><p class="text-xs font-semibold uppercase tracking-widest text-slate-500">{{ snapshot.company_name }}</p><h1 class="mt-2 text-2xl font-bold sm:text-3xl">{{ snapshot.title }}</h1><p class="mt-2 text-sm text-slate-500">Versão {{ version }} · Válida até {{ new Date(expiresAt).toLocaleDateString('pt-BR') }}</p></div>
        <button type="button" class="secondary-button w-auto print:hidden" @click="window.print()">Imprimir / salvar PDF</button>
      </div>
      <div class="mb-7 grid gap-5 sm:grid-cols-2"><div><p class="text-xs font-semibold uppercase text-slate-500">Cliente</p><p class="mt-1 font-semibold">{{ snapshot.client_name }}</p></div><div><p class="text-xs font-semibold uppercase text-slate-500">Consultor responsável</p><p class="mt-1 font-semibold">{{ snapshot.consultant_name }}</p></div></div>
      <div class="overflow-x-auto rounded-xl border border-stone-200"><table class="w-full min-w-[400px] text-left text-sm"><thead class="bg-stone-50 text-xs uppercase text-slate-500"><tr><th class="p-3">Plano / serviço</th><th class="p-3">Qtd.</th><th class="p-3 text-right">Unitário</th><th class="p-3 text-right">Total mensal</th></tr></thead><tbody><tr v-for="(item, index) in snapshot.items" :key="index" class="border-t border-stone-100"><td class="p-3">{{ item.description }}</td><td class="p-3">{{ item.quantity }}</td><td class="p-3 text-right">{{ money(Number(item.monthly_unit_amount)) }}</td><td class="p-3 text-right">{{ money(Number(item.monthly_unit_amount) * item.quantity) }}</td></tr></tbody></table></div>
      <div class="mt-5 rounded-xl bg-stone-50 p-5 text-right"><p class="text-xs uppercase text-slate-500">Investimento mensal</p><p class="text-2xl font-bold">{{ money(monthly) }}</p><p v-if="once" class="mt-1 text-sm">Investimento único: {{ money(once) }}</p></div>
      <div class="mt-8 space-y-5 text-sm"><section><h2 class="font-bold">Condições comerciais</h2><p class="mt-2 whitespace-pre-wrap text-slate-600">{{ snapshot.conditions }}</p></section><section v-if="snapshot.notes"><h2 class="font-bold">Observações</h2><p class="mt-2 whitespace-pre-wrap text-slate-600">{{ snapshot.notes }}</p></section></div>
    </article>
  </main>
</template>
