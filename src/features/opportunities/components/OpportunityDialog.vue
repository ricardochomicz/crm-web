<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AppDialog from '@/components/ui/AppDialog.vue'
import FormField from '@/components/ui/FormField.vue'
import { opportunitiesApi, type Opportunity, type OpportunityInput } from '../api'
import { errorMessage } from '@/lib/feedback'
import type { Product } from '@/features/products/api'
import type { Client } from '@/features/clients/api'

const props = defineProps<{ open: boolean; tenantId: string; opportunity: Opportunity | null; clients: Client[]; products: Product[] }>()
const emit = defineEmits<{ close: []; saved: [] }>()
const busy = ref(false)
const error = ref('')
const showQuantity = ref(false)
const quantityToAdd = ref(1)
const replicatePlan = ref(false)
const maxItems = 200
const lineCount = computed(() => form.value.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0))
const blank = (): OpportunityInput => ({
  code: '', title: '', client_id: '', order_type: 'NOVO',
  description: null, expected_close_at: null,
  estimated_monthly_amount: 0, estimated_one_time_amount: 0, items: [],
})
const form = ref<OpportunityInput>(blank())
const totalMonthly = computed(() => form.value.items.reduce((sum, item) => sum + Number(item.monthly_unit_amount || 0) * Number(item.quantity || 0), 0))
const totalOnce = computed(() => form.value.items.reduce((sum, item) => sum + Number(item.one_time_unit_amount || 0) * Number(item.quantity || 0), 0))
const money = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
function addLines() {
  const quantity = Number(quantityToAdd.value)
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > maxItems || form.value.items.length + quantity > maxItems) {
    error.value = `Informe de 1 a ${maxItems - form.value.items.length} linhas.`
    return
  }
  const source = replicatePlan.value ? form.value.items.find(item => item.product_id) : undefined
  for (let index = 0; index < quantity; index++) {
    form.value.items.push({
      product_id: source?.product_id ?? '', line_number: null,
      description: source?.description ?? '', quantity: 1,
      monthly_unit_amount: source ? Number(source.monthly_unit_amount) : 0,
      one_time_unit_amount: source ? Number(source.one_time_unit_amount) : 0, notes: null,
    })
  }
  error.value = ''
  quantityToAdd.value = 1
  showQuantity.value = false
}
function replicateFrom(index: number) {
  const source = form.value.items[index]
  if (!source?.product_id) return
  form.value.items.forEach((item, position) => {
    if (position === index) return
    item.product_id = source.product_id
    item.description = source.description
    item.monthly_unit_amount = source.monthly_unit_amount
    item.one_time_unit_amount = source.one_time_unit_amount
  })
}
function choosePlan(index: number) {
  const item = form.value.items[index]
  if (!item) return
  const product = props.products.find(p => p.id === item.product_id)
  if (!product) return
  item.description = product.name
  item.monthly_unit_amount = Number(product.price)
  if (replicatePlan.value) replicateFrom(index)
}
function validateLines(): boolean {
  if (!form.value.items.length) { error.value = 'Adicione pelo menos uma linha ou serviço.'; return false }
  const numbers = new Set<string>()
  for (const [index, item] of form.value.items.entries()) {
    if (!item.product_id) { error.value = `Selecione o plano do item ${index + 1}.`; return false }
    const number = (item.line_number ?? '').replace(/\D/g, '')
    if (number && ![10, 11].includes(number.length)) { error.value = `Informe o telefone com DDD no item ${index + 1}.`; return false }
    if (number && numbers.has(number)) { error.value = 'Existem números de linha duplicados.'; return false }
    if (number) numbers.add(number)
    if (number && Number(item.quantity) !== 1) { error.value = 'Uma linha identificada deve ter quantidade 1.'; return false }
  }
  return true
}
watch(() => [props.open, props.opportunity] as const, () => {
  if (!props.open) return
  error.value = ''
  showQuantity.value = false
  quantityToAdd.value = 1
  replicatePlan.value = false
  form.value = props.opportunity ? {
    code: props.opportunity.code, title: props.opportunity.title,
    client_id: props.opportunity.client_id, order_type: props.opportunity.order_type,
    description: props.opportunity.description,
    expected_close_at: props.opportunity.expected_close_at?.slice(0, 10) ?? null,
    estimated_monthly_amount: Number(props.opportunity.estimated_monthly_amount),
    estimated_one_time_amount: Number(props.opportunity.estimated_one_time_amount),
    items: (props.opportunity.items ?? []).map(item => ({ ...item, quantity: Number(item.quantity), monthly_unit_amount: Number(item.monthly_unit_amount), one_time_unit_amount: Number(item.one_time_unit_amount) })),
  } : blank()
}, { immediate: true })
async function save() {
  if (busy.value) return
  if (!form.value.client_id) { error.value = 'Selecione um cliente.'; return }
  if (!validateLines()) return
  busy.value = true
  error.value = ''
  try {
    const payload = { ...form.value, expected_close_at: form.value.expected_close_at || null, estimated_monthly_amount: totalMonthly.value, estimated_one_time_amount: totalOnce.value, items: form.value.items.map(item => ({ ...item, line_number: item.line_number?.replace(/\D/g, '') || null })) }
    if (props.opportunity) await opportunitiesApi.update(props.tenantId, props.opportunity.id, payload)
    else await opportunitiesApi.create(props.tenantId, payload)
    emit('saved')
  } catch (e) { error.value = errorMessage(e) }
  finally { busy.value = false }
}
</script>
<template>
  <AppDialog :open="open" :title="opportunity ? 'Editar oportunidade' : 'Nova oportunidade'"
    description="Organize a negociação, seus serviços e valores." :busy="busy" size="full" @close="emit('close')">
    <form class="flex min-h-full flex-col gap-5" @submit.prevent="save">
      <div class="grid flex-1 gap-6 xl:grid-cols-[minmax(0,1fr)_350px]">
        <fieldset :disabled="busy" class="min-w-0 space-y-6">
          <section class="space-y-4">
            <h3 class="text-sm font-bold uppercase tracking-wide text-slate-500">Dados da oportunidade</h3>
            <div class="grid gap-4 sm:grid-cols-2">
              <FormField id="opportunity-code" v-model="form.code" label="Código" required maxlength="40" placeholder="OP-0001" />
              <FormField id="opportunity-title" v-model="form.title" label="Título" required maxlength="200" placeholder="Ex.: Portabilidade de 5 linhas" />
            </div>
            <label class="block space-y-2 text-sm font-semibold text-slate-700">Cliente
              <select v-model="form.client_id" class="field" required>
                <option value="">Selecione um cliente</option>
                <option v-for="client in clients" :key="client.id" :value="client.id">{{ client.company_name }}</option>
              </select>
            </label>
            <div class="grid gap-4 sm:grid-cols-2">
              <label class="block space-y-2 text-sm font-semibold text-slate-700">Tipo de negociação
                <select v-model="form.order_type" class="field">
                  <option value="NOVO">Novo</option><option value="PORTABILIDADE">Portabilidade</option>
                  <option value="RENOVACAO">Renovação</option><option value="MIGRACAO">Migração</option>
                  <option value="ADICAO">Adição de linhas</option>
                </select>
              </label>
              <FormField id="opportunity-forecast" v-model="form.expected_close_at" label="Previsão de fechamento" type="date" />
            </div>
          </section>
          <section class="space-y-4 rounded-2xl border border-stone-200 bg-stone-50/60 p-4 sm:p-5">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div><h3 class="text-lg font-semibold text-slate-800">Linhas e serviços</h3>
                <p class="text-xs text-slate-500">Cadastre cada número com seu plano e valor.</p></div>
              <button type="button" class="secondary-button w-auto" :disabled="form.items.length >= maxItems" @click="showQuantity = !showQuantity">+ Adicionar linhas</button>
            </div>
            <div v-if="showQuantity" class="flex flex-wrap items-end gap-3 rounded-xl border border-orange-200 bg-orange-50 p-4">
              <label class="space-y-1 text-xs font-semibold text-slate-700">Quantidade de novas linhas
                <input v-model.number="quantityToAdd" type="number" class="field w-32" min="1" :max="maxItems - form.items.length" />
              </label>
              <button type="button" class="primary-button w-auto" @click="addLines">Adicionar</button>
              <button type="button" class="secondary-button w-auto" @click="showQuantity = false">Cancelar</button>
            </div>
            <label class="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm font-medium text-slate-700">
              <input v-model="replicatePlan" type="checkbox" class="size-4 accent-orange-600" />
              Replicar o próximo plano selecionado para todas as linhas
            </label>
            <div v-if="!form.items.length" class="rounded-xl border border-dashed border-stone-300 bg-white p-8 text-center text-sm text-slate-500">
              Nenhuma linha adicionada. Clique em “Adicionar linhas” para começar.
            </div>
            <div v-for="(item, index) in form.items" :key="item.id ?? index" class="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
              <div class="mb-3 flex items-center justify-between">
                <strong class="text-sm text-slate-800">Linha {{ index + 1 }}</strong>
                <button type="button" class="text-xs font-semibold text-red-600 hover:underline" @click="form.items.splice(index, 1)">Remover</button>
              </div>
              <div class="grid gap-3 sm:grid-cols-2">
                <label class="space-y-1 text-xs font-semibold text-slate-600">Número com DDD
                  <input v-model="item.line_number" class="field" type="tel" inputmode="numeric" maxlength="20" placeholder="41999999999" />
                </label>
                <label class="space-y-1 text-xs font-semibold text-slate-600">Plano
                  <select v-model="item.product_id" class="field" required @change="choosePlan(index)">
                    <option value="">Selecione o plano</option>
                    <option v-for="product in products.filter(p => p.is_active)" :key="product.id" :value="product.id">{{ product.name }} — {{ money(Number(product.price)) }}</option>
                  </select>
                </label>
                <label class="space-y-1 text-xs font-semibold text-slate-600">Valor mensal (R$)
                  <input v-model.number="item.monthly_unit_amount" class="field" type="number" min="0" step="0.01" required />
                </label>
                <label class="space-y-1 text-xs font-semibold text-slate-600">Quantidade
                  <input v-model.number="item.quantity" class="field" type="number" min="1" :readonly="!!item.line_number" required />
                </label>
              </div>
            </div>
          </section>
          <label class="block space-y-2 text-sm font-semibold text-slate-700">Observações
            <textarea v-model="form.description" class="field" rows="3" placeholder="Detalhes da negociação" />
          </label>
        </fieldset>
        <aside class="min-w-0 xl:sticky xl:top-0 xl:self-start" aria-label="Resumo da oportunidade">
          <div class="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
            <div class="border-b border-dashed border-stone-300 bg-slate-900 px-5 py-5 text-white">
              <p class="text-xs font-semibold uppercase tracking-widest text-slate-300">Resumo comercial</p>
              <h3 class="mt-2 text-xl font-semibold">Sua oportunidade</h3>
              <p class="mt-1 text-xs text-slate-300">{{ form.code || 'Sem código' }} · {{ lineCount }} linha(s)/serviço(s)</p>
            </div>
            <div class="max-h-[40vh] space-y-3 overflow-y-auto px-5 py-4">
              <p v-if="!form.items.length" class="py-8 text-center text-sm text-slate-400">Os itens adicionados aparecerão aqui.</p>
              <div v-for="(item, index) in form.items" :key="item.id ?? index" class="flex items-start justify-between gap-3 border-b border-dashed border-stone-200 pb-3 text-sm">
                <div class="min-w-0"><p class="font-semibold text-slate-800">Linha {{ index + 1 }} <span v-if="item.quantity > 1" class="font-normal text-slate-500">× {{ item.quantity }}</span></p>
                  <p class="truncate text-xs text-slate-500">{{ item.line_number || 'Número não informado' }}</p>
                  <p class="mt-1 text-xs text-slate-500">{{ item.description || 'Plano não selecionado' }}</p></div>
                <span class="shrink-0 font-semibold text-slate-800">{{ money(Number(item.monthly_unit_amount || 0) * Number(item.quantity || 0)) }}</span>
              </div>
            </div>
            <div class="space-y-3 border-t border-dashed border-stone-300 bg-stone-50 px-5 py-5">
              <div class="flex justify-between text-sm text-slate-600"><span>Quantidade</span><strong>{{ lineCount }}</strong></div>
              <div class="flex justify-between text-sm text-slate-600"><span>Valor pontual</span><strong>{{ money(totalOnce) }}</strong></div>
              <div class="border-t border-stone-200 pt-3">
                <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Total mensal estimado</p>
                <p class="mt-1 text-3xl font-bold tracking-tight text-slate-900">{{ money(totalMonthly) }}</p>
              </div>
              <p class="text-xs text-slate-500">Valores estimados, sujeitos à confirmação da negociação.</p>
            </div>
          </div>
        </aside>
      </div>
      <p v-if="error" role="alert" class="rounded-xl bg-red-50 p-3 text-sm text-red-700">{{ error }}</p>
      <footer class="sticky bottom-0 z-10 -mx-6 -mb-6 flex items-center justify-between gap-3 border-t border-stone-200 bg-white px-6 py-4 sm:-mx-8 sm:px-8">
        <span class="hidden text-sm font-semibold text-slate-600 sm:block">{{ lineCount }} itens · {{ money(totalMonthly) }}/mês</span>
        <div class="ml-auto flex gap-2">
          <button type="button" class="secondary-button w-auto" :disabled="busy" @click="emit('close')">Cancelar</button>
          <button type="submit" class="primary-button w-auto" :disabled="busy">{{ busy ? 'Salvando…' : 'Salvar oportunidade' }}</button>
        </div>
      </footer>
    </form>
  </AppDialog>
</template>
