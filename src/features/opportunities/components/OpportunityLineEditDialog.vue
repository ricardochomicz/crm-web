<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AppDialog from '@/components/ui/AppDialog.vue'
import AppAutocomplete from '@/components/ui/AppAutocomplete.vue'
import AppCurrencyField from '@/components/ui/AppCurrencyField.vue'
import type { OpportunityInput } from '../api'
import type { Product } from '@/features/products/api'
import type { OrderType } from '@/features/order-types/api'
type Item = OpportunityInput['items'][number]
const props = defineProps<{ open: boolean; item: Item | null; products: Product[]; orderTypes: OrderType[]; existingNumbers: string[] }>()
const emit = defineEmits<{ close: []; save: [item: Item] }>()
const draft = ref<Item | null>(null)
const error = ref('')
const options = computed(() => props.products.filter(p => p.is_active || p.id === draft.value?.product_id).map(p => ({ id: p.id, name: p.name })))
const selectedType = computed(() => props.orderTypes.find(t => t.id === draft.value?.order_type_id))
watch(() => [props.open, props.item] as const, () => { draft.value = props.item ? { ...props.item } : null; error.value = '' }, { immediate: true })
function save() {
  if (!draft.value) return
  const item = { ...draft.value, line_number: draft.value.line_number?.replace(/\D/g, '') || null }
  const product = props.products.find(p => p.id === item.product_id)
  if (!product) { error.value = 'Selecione um plano válido.'; return }
  if (!selectedType.value) { error.value = 'Selecione o tipo da linha.'; return }
  if (selectedType.value.requires_number && !item.line_number) { error.value = 'Informe o número da linha.'; return }
  if (item.line_number && ![10, 11].includes(item.line_number.length)) { error.value = 'Informe um número com DDD (10 ou 11 dígitos).'; return }
  if (item.line_number && props.existingNumbers.includes(item.line_number)) { error.value = 'Este número já está cadastrado em outra linha.'; return }
  if (!Number.isFinite(Number(item.monthly_unit_amount)) || Number(item.monthly_unit_amount) < 0) { error.value = 'Valor mensal inválido.'; return }
  item.description = product.name
  emit('save', item)
}
</script>
<template>
  <AppDialog :open="open" title="Editar linha" description="Altere os dados desta linha sem modificar as demais." @close="emit('close')">
    <div v-if="draft" class="space-y-4">
      <AppAutocomplete v-model="draft.order_type_id" label="Tipo da linha" :options="orderTypes" />
      <label class="block space-y-2 text-sm font-semibold text-slate-700"><span>Número da linha</span>
        <input v-model="draft.line_number" class="field" type="tel" inputmode="numeric" placeholder="DDD + número (se disponível)" />
      </label>
      <AppAutocomplete v-model="draft.product_id" label="Plano" :options="options" />
      <AppCurrencyField v-model="draft.monthly_unit_amount" label="Valor mensal por linha" />
      <p v-if="error" role="alert" class="text-sm text-red-700">{{ error }}</p>
      <div class="flex justify-end gap-3 border-t pt-4">
        <button type="button" class="secondary-button w-auto" @click="emit('close')">Cancelar</button>
        <button type="button" class="primary-button w-auto" @click="save">Aplicar alteração</button>
      </div>
    </div>
  </AppDialog>
</template>