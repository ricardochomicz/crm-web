<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import AsyncNotice from '@/components/ui/AsyncNotice.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import { tenantApi } from '@/features/tenants/api'
import type { Tenant } from '@/features/tenants/types'
import { operatorsApi, type TenantOperator } from '@/features/operators/api'
import { errorMessage } from '@/lib/feedback'
import { toast } from '@/services/toast'

const route = useRoute()
const tenantId = computed(() => String(route.params.tenantId))
const tenant = ref<Tenant>()
const products = ref<any[]>([])
const operators = ref<TenantOperator[]>([])
const loading = ref(true)
const busy = ref(false)
const error = ref('')
const canManage = ref(false)
const categories = [
  ['PREPAID','Pré-pago'], ['CONTROL','Controle'], ['POSTPAID','Pós-pago'],
  ['BROADBAND','Fibra / Banda larga'], ['BUSINESS_INTERNET','Internet empresarial'],
  ['LANDLINE','Telefonia fixa'], ['PAY_TV','TV por assinatura'], ['BUNDLE','Combos'],
  ['ADD_ON','Serviços adicionais'], ['OTHER','Outros'],
]
const blank = () => ({ operator_id: 0, name: '', description: '', category: 'BROADBAND', price: '', is_active: true })
const form = ref(blank())
const editingId = ref('')
const promoProductId = ref('')
const promoEditingId = ref('')
const promo = ref({ name: '', promotional_price: '', starts_at: '', ends_at: '', is_active: true })
const nameFilter = ref('')
const statusFilter = ref('')
const productModalOpen = ref(false)
const promotionModalOpen = ref(false)
const operatorFilter = ref('')
const categoryFilter = ref('')
const filtered = computed(() => products.value.filter(p => (!nameFilter.value || p.name.toLocaleLowerCase('pt-BR').includes(nameFilter.value.trim().toLocaleLowerCase('pt-BR'))) && (!operatorFilter.value || String(p.operator_id) === operatorFilter.value) && (!categoryFilter.value || p.category === categoryFilter.value) && (!statusFilter.value || (statusFilter.value === 'active' ? p.is_active : !p.is_active))))
const money = (value: unknown) => Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const parseBrl = (value: string) => Number(value.replace(/[^0-9]/g, '')) / 100
const formatBrlInput = (value: string) => money(parseBrl(value))
const priceDisplay = computed({ get: () => form.value.price, set: (value: string) => { form.value.price = formatBrlInput(value) } })
const promotionPriceDisplay = computed({ get: () => promo.value.promotional_price, set: (value: string) => { promo.value.promotional_price = formatBrlInput(value) } })
const currentPromotion = (p: any) => p.promotions?.find((pr: any) => pr.is_active && pr.starts_at <= new Date().toISOString().slice(0, 10) && pr.ends_at >= new Date().toISOString().slice(0, 10))
function newProduct() { reset(); productModalOpen.value = true }
function closeProduct() { if (!busy.value) productModalOpen.value = false }
function closePromotion() { if (!busy.value) promotionModalOpen.value = false }
function clearFilters() { nameFilter.value = ''; operatorFilter.value = ''; categoryFilter.value = ''; statusFilter.value = '' }
const writable = computed(() => canManage.value && !!tenant.value?.access?.allows_operational_writes)
const base = computed(() => `/api/v1/tenants/${encodeURIComponent(tenantId.value)}/products`)

async function load() {
  const id = tenantId.value
  loading.value = true
  error.value = ''
  try {
    const [company, result] = await Promise.all([
      tenantApi.show(id),
      import('@/lib/http').then(m => m.request<{ data: any[]; meta: { can_manage: boolean } }>(`/api/v1/tenants/${encodeURIComponent(id)}/products`)),
    ])
    if (id !== tenantId.value) return
    tenant.value = company.data
    products.value = result.data
    canManage.value = result.meta.can_manage
    operators.value = (await operatorsApi.tenantList(id)).data.filter(o => o.selected && o.is_active)
  } catch (e) {
    if (id === tenantId.value) error.value = errorMessage(e)
  } finally {
    if (id === tenantId.value) loading.value = false
  }
}
function edit(p: any) {
  productModalOpen.value = true
  editingId.value = p.id
  form.value = { operator_id: p.operator_id, name: p.name, description: p.description ?? '', category: p.category, price: money(p.price), is_active: p.is_active }
}
function reset() { editingId.value = ''; form.value = blank() }
async function save() {
  if (!writable.value || busy.value) return
  busy.value = true
  try {
    const { mutate } = await import('@/lib/http')
    const payload = { ...form.value, operator_id: Number(form.value.operator_id), price: parseBrl(form.value.price) }
    await mutate(editingId.value ? `${base.value}/${editingId.value}` : base.value, payload, editingId.value ? 'PATCH' : 'POST')
    toast.success('Produto salvo.')
    reset()
    productModalOpen.value = false
    await load()
  } catch (e) { toast.error(errorMessage(e)) }
  finally { busy.value = false }
}
function promotion(p: any, existing?: any) {
  promotionModalOpen.value = true
  promoProductId.value = p.id
  promoEditingId.value = existing?.id ?? ''
  promo.value = existing ? { name: existing.name, promotional_price: money(existing.promotional_price), starts_at: existing.starts_at, ends_at: existing.ends_at, is_active: existing.is_active } : { name: '', promotional_price: '', starts_at: '', ends_at: '', is_active: true }
}
async function savePromotion() {
  if (!writable.value || busy.value) return
  busy.value = true
  try {
    const { mutate } = await import('@/lib/http')
    const url = `${base.value}/${promoProductId.value}/promotions${promoEditingId.value ? '/' + promoEditingId.value : ''}`
    await mutate(url, { ...promo.value, promotional_price: parseBrl(promo.value.promotional_price) }, promoEditingId.value ? 'PATCH' : 'POST')
    toast.success('Promoção salva.')
    promoProductId.value = ''
    promotionModalOpen.value = false
    await load()
  } catch (e) { toast.error(errorMessage(e)) }
  finally { busy.value = false }
}
watch(tenantId, () => { productModalOpen.value = false; promotionModalOpen.value = false; clearFilters(); void load() }, { immediate: true })
</script>
<template>
  <AppShell :tenant="tenant" title="Produtos e planos" subtitle="Catálogo comercial">
    <header class="mb-7 flex flex-wrap items-center justify-between gap-4">
      <div>
        <p class="eyebrow">CATÁLOGO COMERCIAL</p>
        <h1 class="mt-3 text-3xl font-semibold">Produtos e planos</h1>
        <p class="mt-2 text-sm text-slate-500">Consulte e organize os produtos comercializados pela empresa.</p>
      </div>
      <button v-if="writable && !loading" class="primary-button w-auto" type="button" @click="newProduct">+ Novo produto</button>
    </header>
    <AsyncNotice :loading="loading" :error="error" @retry="load" />
    <template v-if="!loading && !error">
      <section class="mb-5 rounded-2xl border border-stone-200 bg-white p-4 sm:p-5">
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label class="text-xs font-semibold text-slate-600">Buscar por nome
            <input v-model="nameFilter" type="search" placeholder="Nome do produto" class="mt-1.5 w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm font-normal" />
          </label>
          <label class="text-xs font-semibold text-slate-600">Operadora
            <select v-model="operatorFilter" class="mt-1.5 w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm font-normal">
              <option value="">Todas as operadoras</option>
              <option v-for="o in operators" :key="o.id" :value="String(o.id)">{{ o.name }}</option>
            </select>
          </label>
          <label class="text-xs font-semibold text-slate-600">Categoria
            <select v-model="categoryFilter" class="mt-1.5 w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm font-normal">
              <option value="">Todas as categorias</option>
              <option v-for="c in categories" :key="c[0]" :value="c[0]">{{ c[1] }}</option>
            </select>
          </label>
          <label class="text-xs font-semibold text-slate-600">Situação
            <select v-model="statusFilter" class="mt-1.5 w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm font-normal">
              <option value="">Todos</option><option value="active">Ativos</option><option value="inactive">Inativos</option>
            </select>
          </label>
        </div>
        <div class="mt-4 flex items-center justify-between gap-3 border-t border-stone-100 pt-3">
          <p class="text-sm text-slate-500">{{ filtered.length }} de {{ products.length }} produto(s)</p>
          <button type="button" class="text-sm font-medium text-orange-700 hover:underline" @click="clearFilters">Limpar filtros</button>
        </div>
      </section>
      <section class="overflow-hidden rounded-2xl border border-stone-200 bg-white">
        <div class="overflow-x-auto">
          <table class="w-full min-w-[760px] text-left text-sm">
            <thead class="bg-stone-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr><th class="px-5 py-4">Produto</th><th class="px-4 py-4">Operadora</th><th class="px-4 py-4">Categoria</th><th class="px-4 py-4 text-right">Preço</th><th class="px-4 py-4">Promoção vigente</th><th class="px-4 py-4">Situação</th><th v-if="writable" class="px-5 py-4 text-right">Ações</th></tr>
            </thead>
            <tbody class="divide-y divide-stone-100">
              <tr v-for="p in filtered" :key="p.id" class="hover:bg-stone-50/70">
                <td class="px-5 py-4"><p class="font-semibold text-slate-800">{{ p.name }}</p><p v-if="p.description" class="mt-1 max-w-64 truncate text-xs text-slate-500" :title="p.description">{{ p.description }}</p></td>
                <td class="px-4 py-4 text-slate-600">{{ p.operator?.name }}</td>
                <td class="px-4 py-4 text-slate-600">{{ categories.find(c => c[0] === p.category)?.[1] }}</td>
                <td class="whitespace-nowrap px-4 py-4 text-right font-semibold">{{ money(p.price) }}</td>
                <td class="px-4 py-4"><span v-if="currentPromotion(p)" class="font-medium text-emerald-700">{{ money(currentPromotion(p).promotional_price) }}</span><span v-else class="text-slate-400">—</span></td>
                <td class="px-4 py-4"><span class="rounded-full px-2.5 py-1 text-xs font-semibold" :class="p.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-slate-500'">{{ p.is_active ? 'Ativo' : 'Inativo' }}</span></td>
                <td v-if="writable" class="whitespace-nowrap px-5 py-4 text-right"><button type="button" class="mr-1 inline-flex size-9 items-center justify-center rounded-lg border border-orange-200 bg-white text-orange-700 shadow-sm transition hover:border-orange-400 hover:bg-orange-50 focus-visible:outline-2 focus-visible:outline-orange-600" title="Editar produto" aria-label="Editar produto" @click="edit(p)"><AppIcon name="edit" class="size-5" /></button><button type="button" class="inline-flex size-9 items-center justify-center rounded-lg border border-stone-300 bg-white text-slate-600 shadow-sm transition hover:border-orange-300 hover:bg-stone-50 focus-visible:outline-2 focus-visible:outline-orange-600" title="Gerenciar promoções" aria-label="Gerenciar promoções" @click="promotion(p)"><AppIcon name="tag" class="size-5" /></button></td>
              </tr>
              <tr v-if="!filtered.length"><td :colspan="writable ? 7 : 6" class="px-5 py-12 text-center text-slate-500">{{ products.length ? 'Nenhum produto corresponde aos filtros.' : 'Nenhum produto cadastrado.' }}</td></tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>

    <div v-if="productModalOpen && writable" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" @click.self="closeProduct">
      <section role="dialog" aria-modal="true" aria-labelledby="product-modal-title" class="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
        <div class="mb-6 flex items-center justify-between"><h2 id="product-modal-title" class="text-xl font-semibold">{{ editingId ? 'Editar produto' : 'Novo produto' }}</h2><button type="button" class="rounded-lg px-3 py-1 text-xl text-slate-500 hover:bg-stone-100" aria-label="Fechar" @click="closeProduct">×</button></div>
        <form class="grid gap-4 sm:grid-cols-2" @submit.prevent="save">
          <label class="text-sm">Nome<input v-model="form.name" required maxlength="180" class="mt-1 w-full rounded-lg border p-2.5" /></label>
          <label class="text-sm">Operadora<select v-model.number="form.operator_id" required class="mt-1 w-full rounded-lg border p-2.5"><option :value="0" disabled>Selecione</option><option v-for="o in operators" :key="o.id" :value="o.id">{{ o.name }}</option></select></label>
          <label class="text-sm">Categoria<select v-model="form.category" class="mt-1 w-full rounded-lg border p-2.5"><option v-for="c in categories" :key="c[0]" :value="c[0]">{{ c[1] }}</option></select></label>
          <label class="text-sm">Preço (R$)<input v-model="priceDisplay" type="text" inputmode="numeric" autocomplete="off" placeholder="R$ 0,00" required class="mt-1 w-full rounded-lg border p-2.5" /></label>
          <label class="text-sm sm:col-span-2">Descrição<textarea v-model="form.description" class="mt-1 w-full rounded-lg border p-2.5" rows="3" /></label>
          <label class="flex items-center gap-2 text-sm"><input v-model="form.is_active" type="checkbox" /> Produto ativo</label>
          <div class="flex justify-end gap-3 sm:col-span-2"><button type="button" class="rounded-lg border px-5 py-2.5" :disabled="busy" @click="closeProduct">Cancelar</button><button class="primary-button w-auto" :disabled="busy">{{ busy ? 'Salvando…' : 'Salvar produto' }}</button></div>
        </form>
      </section>
    </div>

    <div v-if="promotionModalOpen && writable" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" @click.self="closePromotion">
      <section role="dialog" aria-modal="true" aria-labelledby="promotion-modal-title" class="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
        <div class="mb-5 flex items-center justify-between"><h2 id="promotion-modal-title" class="text-xl font-semibold">{{ promoEditingId ? 'Editar promoção' : 'Promoções do produto' }}</h2><button type="button" class="rounded-lg px-3 py-1 text-xl text-slate-500 hover:bg-stone-100" aria-label="Fechar" @click="closePromotion">×</button></div>
        <div v-for="pr in products.find(p => p.id === promoProductId)?.promotions ?? []" :key="pr.id" class="mb-2 flex items-center justify-between gap-3 rounded-lg bg-stone-50 px-3 py-2 text-sm"><span>{{ pr.name }} · {{ money(pr.promotional_price) }} · {{ pr.starts_at }} a {{ pr.ends_at }}</span><button type="button" class="text-orange-700" @click="promotion(products.find(p => p.id === promoProductId), pr)">Editar</button></div>
        <form class="mt-5 grid gap-4 sm:grid-cols-2" @submit.prevent="savePromotion">
          <label class="text-sm">Nome<input v-model="promo.name" required class="mt-1 w-full rounded-lg border p-2.5" /></label>
          <label class="text-sm">Preço promocional<input v-model="promotionPriceDisplay" type="text" inputmode="numeric" autocomplete="off" placeholder="R$ 0,00" required class="mt-1 w-full rounded-lg border p-2.5" /></label>
          <label class="text-sm">Início<input v-model="promo.starts_at" type="date" required class="mt-1 w-full rounded-lg border p-2.5" /></label>
          <label class="text-sm">Término<input v-model="promo.ends_at" type="date" required class="mt-1 w-full rounded-lg border p-2.5" /></label>
          <label class="flex items-center gap-2 text-sm"><input v-model="promo.is_active" type="checkbox" /> Promoção ativa</label>
          <div class="flex justify-end gap-3 sm:col-span-2"><button type="button" class="rounded-lg border px-5 py-2.5" :disabled="busy" @click="closePromotion">Cancelar</button><button class="primary-button w-auto" :disabled="busy">{{ busy ? 'Salvando…' : 'Salvar promoção' }}</button></div>
        </form>
        <button v-if="promoEditingId" type="button" class="mt-3 text-sm text-orange-700" @click="promotion(products.find(p => p.id === promoProductId))">Cadastrar outra promoção</button>
      </section>
    </div>
  </AppShell>
</template>
