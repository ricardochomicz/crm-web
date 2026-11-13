<script setup lang="ts">
import { computed } from 'vue'
import AppDialog from '@/components/ui/AppDialog.vue'
import AppAutocomplete from '@/components/ui/AppAutocomplete.vue'
import AppCurrencyField from '@/components/ui/AppCurrencyField.vue'
import type { OrderType } from '@/features/order-types/api'

const props = defineProps<{
  open: boolean
  orderTypes: OrderType[]
  planOptions: { id: string; name: string }[]
  typeId: string
  productId: string
  quantity: number
  pastedNumbers: string
  monthly: number
  parsedCount: number
  maxQuantity: number
  error: string
  money: (value: number) => string
}>()
const emit = defineEmits<{
  close: []
  add: []
  'update:typeId': [value: string]
  'update:productId': [value: string]
  'update:quantity': [value: number]
  'update:pastedNumbers': [value: string]
  'update:monthly': [value: number]
}>()
const selectedType = computed(() => props.orderTypes.find(type => type.id === props.typeId))
const count = computed(() => selectedType.value && !selectedType.value.requires_number ? Number(props.quantity) : props.parsedCount)
</script>

<template>
  <AppDialog :open="open" title="Importar linhas"
    description="Escolha o tipo de operação, informe as linhas e associe um plano ao lote."
    size="wide" @close="emit('close')">
    <div class="space-y-4">
      <AppAutocomplete :model-value="typeId" label="Tipo das linhas"
        placeholder="Buscar tipo das linhas" :options="orderTypes"
        @update:model-value="emit('update:typeId', $event)" />
      <label v-if="selectedType && !selectedType.requires_number" class="block space-y-2 text-sm font-semibold">
        Quantidade de linhas novas
        <input :value="quantity" class="field" type="number" min="1" :max="maxQuantity"
          @input="emit('update:quantity', Number(($event.target as HTMLInputElement).value))" />
      </label>
      <label v-else-if="selectedType?.requires_number" class="block space-y-2 text-sm font-semibold">
        Números (um por linha)
        <textarea :value="pastedNumbers" class="field min-h-48 font-mono" rows="8"
          placeholder="00900000001&#10;00900000002&#10;00900000003"
          @input="emit('update:pastedNumbers', ($event.target as HTMLTextAreaElement).value)" />
      </label>
      <div class="grid gap-4 sm:grid-cols-2">
        <AppAutocomplete :model-value="productId" label="Plano do lote"
          placeholder="Buscar plano" :options="planOptions"
          @update:model-value="emit('update:productId', $event)" />
        <AppCurrencyField :model-value="monthly" label="Valor mensal por linha"
          @update:model-value="emit('update:monthly', $event)" />
      </div>
      <p class="rounded-xl bg-stone-50 p-4 text-sm">
        {{ count }} linhas · Total mensal do lote:
        <strong>{{ money(count * Number(monthly || 0)) }}</strong>
      </p>
      <p v-if="error" role="alert" class="text-sm text-red-700">{{ error }}</p>
      <div class="flex justify-end gap-3 border-t pt-4">
        <button type="button" class="secondary-button w-auto" @click="emit('close')">Cancelar</button>
        <button type="button" class="primary-button w-auto" @click="emit('add')">Adicionar {{ count }} linhas</button>
      </div>
    </div>
  </AppDialog>
</template>
