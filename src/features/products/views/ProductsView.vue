<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import AsyncNotice from '@/components/ui/AsyncNotice.vue'
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
const operatorFilter = ref('')
const categoryFilter = ref('')
const filtered = computed(() => products.value.filter(p => (!operatorFilter.value || String(p.operator_id) === operatorFilter.value) && (!categoryFilter.value || p.category === categoryFilter.value)))
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
  editingId.value = p.id
  form.value = { operator_id: p.operator_id, name: p.name, description: p.description ?? '', category: p.category, price: String(p.price), is_active: p.is_active }
}
function reset() { editingId.value = ''; form.value = blank() }
async function save() {
  if (!writable.value || busy.value) return
  busy.value = true
  try {
    const { mutate } = await import('@/lib/http')
    const payload = { ...form.value, operator_id: Number(form.value.operator_id), price: Number(form.value.price) }
    await mutate(editingId.value ? `${base.value}/${editingId.value}` : base.value, payload, editingId.value ? 'PATCH' : 'POST')
    toast.success('Produto salvo.')
    reset()
    await load()
  } catch (e) { toast.error(errorMessage(e)) }
  finally { busy.value = false }
}
function promotion(p: any, existing?: any) {
  promoProductId.value = p.id
  promoEditingId.value = existing?.id ?? ''
  promo.value = existing ? { name: existing.name, promotional_price: String(existing.promotional_price), starts_at: existing.starts_at, ends_at: existing.ends_at, is_active: existing.is_active } : { name: '', promotional_price: '', starts_at: '', ends_at: '', is_active: true }
}
async function savePromotion() {
  if (!writable.value || busy.value) return
  busy.value = true
  try {
    const { mutate } = await import('@/lib/http')
    const url = `${base.value}/${promoProductId.value}/promotions${promoEditingId.value ? '/' + promoEditingId.value : ''}`
    await mutate(url, { ...promo.value, promotional_price: Number(promo.value.promotional_price) }, promoEditingId.value ? 'PATCH' : 'POST')
    toast.success('Promoção salva.')
    promoProductId.value = ''
    await load()
  } catch (e) { toast.error(errorMessage(e)) }
  finally { busy.value = false }
}
watch(tenantId, () => { void load() }, { immediate: true })
</script>
<template>
  <AppShell :tenant="tenant" title="Produtos e planos" subtitle="Catálogo comercial">
    <header class="mb-8"><p class="eyebrow">CATÁLOGO COMERCIAL</p><h1 class="mt-3 text-3xl font-semibold">Produtos e planos</h1><p class="mt-2 text-sm text-slate-500">Gerencie produtos e campanhas das suas operadoras.</p></header>
    <AsyncNotice :loading="loading" :error="error" @retry="load" />
    <template v-if="!loading && !error">
      <section v-if="writable" class="mb-8 rounded-2xl border border-stone-200 bg-white p-6">
        <h2 class="mb-4 text-lg font-semibold">{{ editingId ? 'Editar produto' : 'Novo produto' }}</h2>
        <form class="grid gap-4 md:grid-cols-2" @submit.prevent="save">
          <label class="text-sm">Nome<input v-model="form.name" required maxlength="180" class="mt-1 w-full rounded-lg border p-2" /></label>
          <label class="text-sm">Operadora<select v-model.number="form.operator_id" required class="mt-1 w-full rounded-lg border p-2"><option :value="0" disabled>Selecione</option><option v-for="o in operators" :key="o.id" :value="o.id">{{ o.name }}</option></select></label>
          <label class="text-sm">Categoria<select v-model="form.category" class="mt-1 w-full rounded-lg border p-2"><option v-for="c in categories" :key="c[0]" :value="c[0]">{{ c[1] }}</option></select></label>
          <label class="text-sm">Preço (R$)<input v-model="form.price" type="number" min="0" step="0.01" required class="mt-1 w-full rounded-lg border p-2" /></label>
          <label class="text-sm md:col-span-2">Descrição<textarea v-model="form.description" class="mt-1 w-full rounded-lg border p-2" rows="2" /></label>
          <label class="flex items-center gap-2 text-sm"><input v-model="form.is_active" type="checkbox" /> Produto ativo</label>
          <div class="flex gap-3"><button class="primary-button" :disabled="busy">{{ busy ? 'Salvando…' : 'Salvar produto' }}</button><button v-if="editingId" type="button" class="rounded-lg border px-4" @click="reset">Cancelar</button></div>
        </form>
      </section>
      <div class="mb-4 flex flex-wrap gap-3">
        <select v-model="operatorFilter" class="rounded-lg border p-2"><option value="">Todas as operadoras</option><option v-for="o in operators" :key="o.id" :value="String(o.id)">{{ o.name }}</option></select>
        <select v-model="categoryFilter" class="rounded-lg border p-2"><option value="">Todas as categorias</option><option v-for="c in categories" :key="c[0]" :value="c[0]">{{ c[1] }}</option></select>
      </div>
      <p v-if="!filtered.length" class="text-sm text-slate-500">Nenhum produto cadastrado.</p>
      <section v-for="p in filtered" :key="p.id" class="mb-4 rounded-2xl border border-stone-200 bg-white p-5">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div><h2 class="font-semibold">{{ p.name }} <span v-if="!p.is_active" class="text-sm text-amber-700">(Inativo)</span></h2><p class="text-sm text-slate-500">{{ p.operator?.name }} · {{ categories.find(c => c[0] === p.category)?.[1] }} · R$ {{ Number(p.price).toFixed(2) }}</p><p class="mt-1 text-sm">{{ p.description }}</p></div>
          <div v-if="writable" class="flex gap-2"><button class="rounded-lg border px-3 py-2 text-sm" @click="edit(p)">Editar</button><button class="rounded-lg border px-3 py-2 text-sm" @click="promotion(p)">Nova promoção</button></div>
        </div>
        <div v-for="pr in p.promotions" :key="pr.id" class="mt-3 flex items-center justify-between border-t pt-3 text-sm"><span>{{ pr.name }} · R$ {{ Number(pr.promotional_price).toFixed(2) }} · {{ pr.starts_at }} a {{ pr.ends_at }} {{ pr.is_active ? '' : '(Inativa)' }}</span><button v-if="writable" class="text-orange-700" @click="promotion(p, pr)">Editar</button></div>
      </section>
      <section v-if="promoProductId && writable" class="rounded-2xl border border-stone-200 bg-white p-6">
        <h2 class="mb-4 font-semibold">{{ promoEditingId ? 'Editar promoção' : 'Nova promoção' }}</h2>
        <form class="grid gap-4 md:grid-cols-2" @submit.prevent="savePromotion">
          <label class="text-sm">Nome<input v-model="promo.name" required class="mt-1 w-full rounded-lg border p-2" /></label>
          <label class="text-sm">Preço promocional<input v-model="promo.promotional_price" type="number" step="0.01" min="0" required class="mt-1 w-full rounded-lg border p-2" /></label>
          <label class="text-sm">Início<input v-model="promo.starts_at" type="date" required class="mt-1 w-full rounded-lg border p-2" /></label>
          <label class="text-sm">Término<input v-model="promo.ends_at" type="date" required class="mt-1 w-full rounded-lg border p-2" /></label>
          <label class="flex items-center gap-2 text-sm"><input v-model="promo.is_active" type="checkbox" /> Promoção ativa</label>
          <div class="flex gap-3"><button class="primary-button" :disabled="busy">Salvar promoção</button><button type="button" class="rounded-lg border px-4" @click="promoProductId = ''">Cancelar</button></div>
        </form>
      </section>
    </template>
  </AppShell>
</template>
