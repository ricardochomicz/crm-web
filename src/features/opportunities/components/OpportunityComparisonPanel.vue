<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { comparisonsApi, type OpportunityComparison, type ComparisonOption } from '../api'
import type { Product } from '@/features/products/api'
import type { TenantOperator } from '@/features/operators/api'
import { errorMessage } from '@/lib/errors'

const props = defineProps<{ tenantId: string; opportunityId: string; products: Product[]; operators: TenantOperator[] }>()
const comparisons = ref<OpportunityComparison[]>([])
const title = ref('Comparativo de planos corporativos')
const selected = ref<Record<number, string>>({})
const quantities = ref<Record<number, number>>({})
const prices = ref<Record<number, number>>({})
const notes = ref<Record<number, string>>({})
const busy = ref(false)
const error = ref('')
const money = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const available = computed(() => props.operators.filter(operator => operator.selected && operator.is_active))
const options = computed(() => available.value.flatMap(operator => {
  const product = props.products.find(item => item.id === selected.value[operator.id] && item.is_active)
  return product ? [{ operator, product, quantity: quantities.value[operator.id] || 1, price: prices.value[operator.id] ?? Number(product.price) }] : []
}))
const totals = computed(() => options.value.map(item => ({ name: item.operator.name, total: item.price * item.quantity })))
const cheapest = computed(() => totals.value.length ? Math.min(...totals.value.map(item => item.total)) : 0)
const publicLink = (comparison: OpportunityComparison) => window.location.origin + '/propostas/' + comparison.public_token
async function reload() {
  try { comparisons.value = (await comparisonsApi.list(props.tenantId, props.opportunityId)).data }
  catch (e) { error.value = errorMessage(e) }
}
watch(() => [props.tenantId, props.opportunityId], () => { void reload() }, { immediate: true })
function setProduct(operatorId: number, productId: string) {
  selected.value = { ...selected.value, [operatorId]: productId }
  const product = props.products.find(item => item.id === productId)
  if (product) prices.value = { ...prices.value, [operatorId]: Number(product.price) }
}
async function save() {
  error.value = ''
  if (options.value.length < 2) { error.value = 'Selecione planos de pelo menos duas operadoras.'; return }
  busy.value = true
  try {
    const payload: ComparisonOption[] = options.value.map(item => ({
      product_id: item.product.id, quantity: item.quantity,
      monthly_unit_amount: item.price, one_time_unit_amount: 0, notes: notes.value[item.operator.id] || null,
    }))
    await comparisonsApi.create(props.tenantId, props.opportunityId, { title: title.value, options: payload })
    await reload()
  } catch (e) { error.value = errorMessage(e) }
  finally { busy.value = false }
}
async function revoke(comparison: OpportunityComparison) {
  busy.value = true
  try { await comparisonsApi.revoke(props.tenantId, props.opportunityId, comparison.id); await reload() }
  catch (e) { error.value = errorMessage(e) }
  finally { busy.value = false }
}
async function copyLink(comparison: OpportunityComparison) {
  try { await navigator.clipboard.writeText(publicLink(comparison)) }
  catch { error.value = 'Não foi possível copiar o link. Abra a proposta e copie o endereço.' }
}
</script>
<template>
  <section class="space-y-5">
    <div class="rounded-xl border border-stone-200 p-5">
      <h3 class="text-lg font-semibold">Comparativo de operadoras</h3>
      <p class="mt-1 text-sm text-slate-500">Monte alternativas para a mesma negociação. A oportunidade principal não será alterada.</p>
      <label class="mt-5 block text-sm font-semibold">Título da proposta
        <input v-model="title" class="field mt-2" maxlength="200" />
      </label>
      <div class="mt-5 grid gap-4 md:grid-cols-3">
        <div v-for="operator in available" :key="operator.id" class="space-y-3 rounded-xl border border-stone-200 p-4">
          <h4 class="font-semibold">{{ operator.name }}</h4>
          <label class="block text-xs font-semibold text-slate-600">Plano
            <select class="field mt-1" :value="selected[operator.id] || ''" @change="setProduct(operator.id, ($event.target as HTMLSelectElement).value)">
              <option value="">Não incluir</option>
              <option v-for="product in products.filter(p => p.is_active && Number(p.operator_id) === operator.id)" :key="product.id" :value="product.id">{{ product.name }}</option>
            </select>
          </label>
          <template v-if="selected[operator.id]">
            <label class="block text-xs font-semibold text-slate-600">Quantidade de linhas
              <input v-model.number="quantities[operator.id]" class="field mt-1" type="number" min="1" max="10000" placeholder="5" />
            </label>
            <label class="block text-xs font-semibold text-slate-600">Mensalidade por linha (R$)
              <input v-model.number="prices[operator.id]" class="field mt-1" type="number" min="0" step="0.01" />
            </label>
            <label class="block text-xs font-semibold text-slate-600">Observações
              <textarea v-model="notes[operator.id]" class="field mt-1" rows="2" maxlength="2000" />
            </label>
          </template>
        </div>
      </div>
      <div v-if="totals.length" class="mt-4 grid gap-3 sm:grid-cols-3">
        <div v-for="item in totals" :key="item.name" class="rounded-lg bg-stone-50 p-4">
          <p class="text-sm">{{ item.name }}</p>
          <p class="text-xl font-bold">{{ money(item.total) }}<span class="text-xs font-normal">/mês</span></p>
          <p v-if="item.total === cheapest" class="text-xs font-semibold text-emerald-700">Menor mensalidade</p>
        </div>
      </div>
      <p v-if="error" role="alert" class="mt-3 text-sm text-red-700">{{ error }}</p>
      <div class="mt-5 flex justify-end"><button class="primary-button w-auto" type="button" :disabled="busy" @click="save">{{ busy ? 'Salvando…' : 'Gerar proposta comparativa' }}</button></div>
    </div>
    <div class="rounded-xl border border-stone-200 p-5">
      <h3 class="mb-3 font-semibold">Propostas geradas</h3>
      <p v-if="!comparisons.length" class="text-sm text-slate-500">Nenhuma proposta gerada.</p>
      <div v-for="comparison in comparisons" :key="comparison.id" class="flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 py-3">
        <div><p class="font-semibold">{{ comparison.title }}</p><p class="text-xs text-slate-500">{{ comparison.options.length }} operadoras · {{ comparison.revoked_at ? 'Link revogado' : 'Válido até ' + new Date(comparison.expires_at).toLocaleDateString('pt-BR') }}</p></div>
        <div v-if="!comparison.revoked_at" class="flex flex-wrap gap-2">
          <a class="secondary-button w-auto" :href="publicLink(comparison)" target="_blank" rel="noopener noreferrer">Visualizar / PDF</a>
          <button type="button" class="secondary-button w-auto" @click="copyLink(comparison)">Copiar link</button>
          <button type="button" class="text-sm font-semibold text-red-600" :disabled="busy" @click="revoke(comparison)">Revogar</button>
        </div>
      </div>
    </div>
  </section>
</template>
