<script setup lang="ts">
import SearchSelect from '@/components/ui/SearchSelect.vue'
import type { ConsolidationOptions } from '../api'

type Order = ConsolidationOptions['data']['orders'][number]

defineProps<{
  order: Order
  modelValue: string
  options: { value: string; label: string }[]
  busy: boolean
  disabled: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  confirm: []
}>()

const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})
</script>

<template>
  <article class="rounded-xl border border-stone-200 bg-white p-4 sm:p-5">
    <div class="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div>
        <p class="font-semibold text-slate-900">{{ order.code ?? 'Pedido sem código' }}</p>
        <p class="mt-1 text-sm text-slate-500">
          {{ order.operator_name }} · {{ order.line_quantity }}
          {{ order.line_quantity === 1 ? 'linha' : 'linhas' }}
        </p>
      </div>
      <p class="text-sm font-semibold text-slate-800">
        {{ currency.format(Number(order.monthly_amount ?? 0)) }}
      </p>
    </div>

    <label class="block text-sm font-medium text-slate-700">
      Destino do pedido
      <SearchSelect
        class="mt-1"
        :model-value="modelValue"
        :options="options"
        :disabled="disabled"
        placeholder="Selecione ou pesquise um contrato..."
        @update:model-value="emit('update:modelValue', String($event ?? ''))"
      />
    </label>

    <div class="mt-4 flex justify-end">
      <button
        type="button"
        class="primary-button w-auto"
        :disabled="disabled"
        @click="emit('confirm')"
      >
        {{ busy ? 'Salvando...' : 'Confirmar vínculo' }}
      </button>
    </div>
  </article>
</template>
