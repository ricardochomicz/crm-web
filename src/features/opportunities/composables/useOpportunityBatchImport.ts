import { computed, ref, watch, type Ref } from 'vue'
import type { OpportunityInput } from '../api'
import type { Product } from '@/features/products/api'
import type { OrderType } from '@/features/order-types/api'
import { parseOpportunityNumbers, MAX_OPPORTUNITY_ITEMS } from '../utils/opportunityForm'

/** Manages importing opportunity lines in batches, including all input validation. */
export function useOpportunityBatchImport(
  form: Ref<OpportunityInput>,
  filteredProducts: Readonly<Ref<Product[]>>,
  orderTypes: Readonly<Ref<OrderType[]>>,
) {
  const showImport = ref(false)
  const pastedNumbers = ref('')
  const batchProductId = ref('')
  const batchTypeId = ref('')
  const batchQuantity = ref(1)
  const batchMonthly = ref(0)
  const batchError = ref('')
  const parsedNumbers = computed(() => parseOpportunityNumbers(pastedNumbers.value))
  const selectedBatchType = computed(() => orderTypes.value.find(type => type.id === batchTypeId.value))

  function chooseBatchPlan() {
    batchMonthly.value = Number(filteredProducts.value.find(product => product.id === batchProductId.value)?.price ?? 0)
  }
  watch(batchProductId, chooseBatchPlan)

  function openImport() {
    pastedNumbers.value = ''
    batchProductId.value = ''
    batchTypeId.value = ''
    batchQuantity.value = 1
    batchMonthly.value = 0
    batchError.value = ''
    showImport.value = true
  }

  function addBatch() {
    batchError.value = ''
    const numbers = parsedNumbers.value
    const product = filteredProducts.value.find(p => p.id === batchProductId.value && p.is_active)
    const batchType = selectedBatchType.value
    if (!batchType) { batchError.value = 'Selecione o tipo das linhas.'; return }
    if (batchType.requires_number && !numbers.length) { batchError.value = 'Cole pelo menos um número.'; return }
    if (!batchType.requires_number && (!Number.isInteger(Number(batchQuantity.value)) || Number(batchQuantity.value) < 1)) { batchError.value = 'Informe a quantidade de linhas novas.'; return }
    const count = !batchType.requires_number ? Number(batchQuantity.value) : numbers.length
    if (!product) { batchError.value = 'Selecione um plano ativo.'; return }
    if (!Number.isFinite(Number(batchMonthly.value)) || Number(batchMonthly.value) < 0) { batchError.value = 'Valor mensal inválido.'; return }
    if (count + form.value.items.length > MAX_OPPORTUNITY_ITEMS) { batchError.value = 'Limite de 200 itens por oportunidade.'; return }
    const seen = new Set(form.value.items.map(item => (item.line_number ?? '').replace(/\D/g, '')).filter(Boolean))
    for (const number of batchType.requires_number ? numbers : []) {
      if (![10, 11].includes(number.length)) { batchError.value = 'Número inválido: ' + number; return }
      if (seen.has(number)) { batchError.value = 'Número duplicado: ' + number; return }
      seen.add(number)
    }
    form.value.items.push(...Array.from({ length: count }, (_, index) => ({
      order_type_id: batchTypeId.value,
      product_id: product.id,
      line_number: batchType.requires_number ? (numbers[index] ?? null) : null,
      description: product.name,
      quantity: 1,
      monthly_unit_amount: Number(batchMonthly.value),
      one_time_unit_amount: 0,
      notes: null,
    })))
    showImport.value = false
  }

  return {
    showImport, pastedNumbers, batchProductId, batchTypeId, batchQuantity,
    batchMonthly, batchError, parsedNumbers, selectedBatchType,
    openImport, chooseBatchPlan, addBatch,
  }
}
