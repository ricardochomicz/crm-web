<script setup lang="ts">
import { computed, toRef } from 'vue'
import SearchSelect from '@/components/ui/SearchSelect.vue'
import { useSubscriptionUpgrade } from '../composables/useSubscriptionUpgrade'
import type { Subscription } from '../types'

const props = defineProps<{ tenantId: string; subscription: Subscription }>()
const emit = defineEmits<{ updated: [] }>()
const subscription = toRef(props, 'subscription')
const tenantId = toRef(props, 'tenantId')
const { open, loading, saving, error, selectedPlanId, selected, options, available, canUpgrade, show, close, confirm } =
  useSubscriptionUpgrade(tenantId, subscription, async () => { emit('updated') })
const currentPrice = computed(() => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: props.subscription.currency }).format(Number(props.subscription.monthly_price)))
const storage = (mb: number) => mb >= 1024 ? (mb / 1024).toLocaleString('pt-BR') + ' GB' : mb + ' MB'
const price = computed(() => selected.value
  ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: selected.value.currency }).format(Number(selected.value.monthly_price))
  : '')
</script>

<template>
  <div>
    <p v-if="!canUpgrade" class="text-sm text-amber-700">A assinatura precisa estar ativa ou em período de teste para solicitar um upgrade.</p>
    <button v-else type="button" class="rounded-xl bg-orange-600 px-5 py-3 text-sm font-semibold text-white hover:bg-orange-700" @click="show">
      Fazer upgrade do plano
    </button>

    <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" role="presentation" @click.self="close">
      <section role="dialog" aria-modal="true" aria-labelledby="upgrade-title" class="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
        <div class="flex items-start justify-between gap-4">
          <div>
            <h2 id="upgrade-title" class="text-xl font-semibold text-slate-900">Alterar para um plano superior</h2>
            <p class="mt-2 text-sm text-slate-500">Plano atual: {{ subscription.plan.name }}. Compare as opções disponíveis.</p>
          </div>
          <button type="button" aria-label="Fechar" class="text-2xl text-slate-500" :disabled="saving" @click="close">×</button>
        </div>

        <p v-if="loading" class="mt-6 text-sm text-slate-500">Carregando planos…</p>
        <div v-else class="mt-6 space-y-4">
          <p v-if="!available.length && !error" class="text-sm text-slate-500">Não há planos superiores disponíveis no momento.</p>
          <label v-if="available.length" class="block text-sm font-medium text-slate-700">
            Novo plano
            <SearchSelect v-model="selectedPlanId" class="mt-2" :options="options" placeholder="Selecione um plano" :disabled="saving" />
          </label>
          <div v-if="selected" class="rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm text-slate-700">
            <p class="font-semibold text-slate-900">{{ selected.name }} — {{ price }}/mês</p>
            <div class="mt-4 overflow-x-auto rounded-lg border border-orange-100 bg-white">
              <table class="w-full text-left text-sm">
                <thead class="bg-stone-50 text-xs text-slate-500"><tr><th scope="col" class="p-3">Recurso</th><th scope="col" class="p-3">Atual</th><th scope="col" class="p-3">Novo</th></tr></thead>
                <tbody class="divide-y divide-stone-100">
                  <tr><th scope="row" class="p-3 font-medium">Usuários</th><td class="p-3">{{ subscription.limits.users }}</td><td class="p-3 font-semibold text-emerald-700">{{ selected.user_limit }}</td></tr>
                  <tr><th scope="row" class="p-3 font-medium">Armazenamento</th><td class="p-3">{{ storage(subscription.limits.storage_mb) }}</td><td class="p-3 font-semibold">{{ storage(selected.storage_limit_mb) }}</td></tr>
                  <tr><th scope="row" class="p-3 font-medium">Mensalidade</th><td class="p-3">{{ currentPrice }}</td><td class="p-3 font-semibold">{{ price }}</td></tr>
                </tbody>
              </table>
            </div>
            <p v-if="selected.description" class="mt-2">{{ selected.description }}</p>
            <p class="mt-3 text-xs text-amber-900">Ao confirmar, o plano e seus limites serão atualizados imediatamente. Não há cobrança automática nem cálculo proporcional nesta versão.</p>
          </div>
          <p v-if="error" role="alert" class="text-sm text-rose-700">{{ error }}</p>
        </div>

        <div class="mt-6 flex justify-end gap-3">
          <button type="button" class="rounded-xl border border-stone-300 px-4 py-2 text-sm font-medium" :disabled="saving" @click="close">Cancelar</button>
          <button type="button" class="rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" :disabled="!selected || saving || loading" @click="confirm">
            {{ saving ? 'Atualizando…' : 'Confirmar alteração do plano' }}
          </button>
        </div>
      </section>
    </div>
  </div>
</template>
