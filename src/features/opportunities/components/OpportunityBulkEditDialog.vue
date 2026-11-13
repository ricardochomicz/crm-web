<script setup lang="ts">
import AppCheckbox from '@/components/ui/AppCheckbox.vue'
import { computed, ref, watch } from 'vue'
import AppDialog from '@/components/ui/AppDialog.vue'
import AppAutocomplete from '@/components/ui/AppAutocomplete.vue'
import AppCurrencyField from '@/components/ui/AppCurrencyField.vue'
import type { OpportunityInput } from '../api'
import type { Product } from '@/features/products/api'
import type { OrderType } from '@/features/order-types/api'
type Item = OpportunityInput['items'][number]
const props = defineProps<{ open: boolean; items: Item[]; products: Product[]; orderTypes: OrderType[] }>()
const emit = defineEmits<{ close: []; apply: [changes: { order_type_id?: string; product_id?: string; monthly_unit_amount?: number }] }>()
const changeType = ref(false)
const changePlan = ref(false)
const changePrice = ref(false)
const priceConfirmed = ref(false)

// A troca de plano exige que o valor mensal seja revisado explicitamente.
watch(changePlan, selected => {
  if (selected) {
    changePrice.value = true
    priceConfirmed.value = false
  }
})
const typeId = ref('')
const productId = ref('')
const monthly = ref(0)
const error = ref('')
const money = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const planOptions = computed(() => props.products.filter(p => p.is_active).map(p => ({ id: p.id, name: p.name })))
const before = computed(() => props.items.reduce((sum, item) => sum + Number(item.monthly_unit_amount) * Number(item.quantity), 0))
const after = computed(() => props.items.reduce((sum, item) => sum + (changePrice.value ? Number(monthly.value) : Number(item.monthly_unit_amount)) * Number(item.quantity), 0))
const selectedType = computed(() => props.orderTypes.find(t => t.id === typeId.value))
const invalidNumbers = computed(() => changeType.value && selectedType.value?.requires_number && props.items.some(i => !i.line_number))
watch(() => props.open, open => {
  if (!open) return
  changeType.value = false; changePlan.value = false; changePrice.value = false
  typeId.value = ''; productId.value = ''; monthly.value = 0; priceConfirmed.value = false; error.value = ''
})
function apply() {
  error.value = ''
  if (!changeType.value && !changePlan.value && !changePrice.value) { error.value = 'Marque pelo menos um campo para alterar.'; return }
  if (changeType.value && !selectedType.value) { error.value = 'Selecione um tipo válido.'; return }
  if (invalidNumbers.value) { error.value = 'Há linhas sem número. O tipo escolhido exige número para todas.'; return }
  if (changePlan.value && !props.products.some(p => p.id === productId.value && p.is_active)) { error.value = 'Selecione um plano ativo.'; return }
  if (changePlan.value && !changePrice.value) { error.value = 'Ao alterar o plano, informe também o novo valor mensal.'; return }
  if (changePlan.value && !priceConfirmed.value) { error.value = 'Revise e informe o valor mensal do novo plano antes de aplicar.'; return }
  if (changePrice.value && (!Number.isFinite(monthly.value) || monthly.value < 0)) { error.value = 'Valor mensal inválido.'; return }
  emit('apply', {
    ...(changeType.value ? { order_type_id: typeId.value } : {}),
    ...(changePlan.value ? { product_id: productId.value } : {}),
    ...(changePrice.value ? { monthly_unit_amount: Number(monthly.value) } : {}),
  })
}
</script>
<template>
  <AppDialog :open="open" title="Editar linhas em massa" :description="items.length + ' linha(s) selecionada(s). Marque somente os campos que deseja alterar.'" @close="emit('close')">
    <div class="space-y-5">
      <div class="rounded-xl border border-stone-200 p-3 transition-colors" :class="changeType ? 'border-orange-200 bg-orange-50/50' : 'bg-white'">
        <AppCheckbox v-model="changeType" label="Alterar tipo das linhas" />
        <div class="min-w-0 flex-1">
          
          <AppAutocomplete v-if="changeType" v-model="typeId" label="Novo tipo" :options="orderTypes" />
        </div>
      </div>
      <div class="rounded-xl border border-stone-200 p-3 transition-colors" :class="changePlan ? 'border-orange-200 bg-orange-50/50' : 'bg-white'">
        <AppCheckbox v-model="changePlan" label="Alterar plano" />
        <div class="min-w-0 flex-1">
          
          <AppAutocomplete v-if="changePlan" v-model="productId" label="Novo plano" :options="planOptions" />
        </div>
      </div>
      <div class="rounded-xl border border-stone-200 p-3 transition-colors" :class="changePrice ? 'border-orange-200 bg-orange-50/50' : 'bg-white'">
        <AppCheckbox v-model="changePrice" label="Alterar valor mensal por linha" :disabled="changePlan" />
        <div class="min-w-0 flex-1">
          
          <AppCurrencyField v-if="changePrice" v-model="monthly" label="Novo valor mensal" @update:model-value="priceConfirmed = true" />
          <p v-if="changePlan" class="mt-2 text-xs text-orange-800">Ao trocar o plano, é obrigatório revisar e informar o novo valor mensal. O valor não será preenchido automaticamente.</p>
        </div>
      </div>
      <div class="rounded-xl bg-stone-50 p-4 text-sm">
        <p class="font-semibold">{{ items.length }} linha(s) serão atualizadas</p>
        <p class="mt-2">Mensal atual: <strong>{{ money(before) }}</strong></p>
        <p>Mensal após alteração: <strong>{{ money(after) }}</strong></p>
      </div>
      <p v-if="error" role="alert" class="text-sm text-red-700">{{ error }}</p>
      <div class="flex justify-end gap-3 border-t pt-4">
        <button type="button" class="secondary-button w-auto" @click="emit('close')">Cancelar</button>
        <button type="button" class="primary-button w-auto" :disabled="!items.length" @click="apply">Aplicar a {{ items.length }} linha(s)</button>
      </div>
    </div>
  </AppDialog>
</template>