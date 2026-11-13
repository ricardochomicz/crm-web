<script setup lang="ts">
import { computed, toRef } from 'vue'
import SearchSelect from '@/components/ui/SearchSelect.vue'
import { useSubscriptionUpgrade } from '../composables/useSubscriptionUpgrade'
import type { Subscription } from '../types'

const props = defineProps<{ tenantId: string; subscription: Subscription }>()
const emit = defineEmits<{ updated: [] }>()
const subscription = toRef(props, 'subscription')
const tenantId = toRef(props, 'tenantId')
const { open, loading, saving, error, selectedPlanId, selected, options, available, show, close, confirm } =
  useSubscriptionUpgrade(tenantId, subscription, async () => { emit('updated') })
const price = computed(() => selected.value
  ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: selected.value.currency }).format(Number(selected.value.monthly_price))
  : '')
</script>

<template>
  <div>
    <button type="button" class="rounded-xl bg-orange-600 px-5 py-3 text-sm font-semibold text-white hover:bg-orange-700" @click="show">
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
            <p class="mt-2">{{ selected.user_limit }} usuários · {{ selected.storage_limit_mb }} MB de armazenamento</p>
            <p v-if="selected.description" class="mt-2">{{ selected.description }}</p>
            <p class="mt-3 text-xs text-amber-900">A alteração atualiza o plano e os limites da assinatura. Não realiza cobrança automática nem calcula valores proporcionais.</p>
          </div>
          <p v-if="error" role="alert" class="text-sm text-rose-700">{{ error }}</p>
        </div>

        <div class="mt-6 flex justify-end gap-3">
          <button type="button" class="rounded-xl border border-stone-300 px-4 py-2 text-sm font-medium" :disabled="saving" @click="close">Cancelar</button>
          <button type="button" class="rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" :disabled="!selected || saving || loading" @click="confirm">
            {{ saving ? 'Atualizando…' : 'Confirmar upgrade' }}
          </button>
        </div>
      </section>
    </div>
  </div>
</template>
