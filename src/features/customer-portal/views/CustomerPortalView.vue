<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { portalSession } from '../session'
import AppDialog from '@/components/ui/AppDialog.vue'
import { customerPortalApi, type PortalOrder, type PortalOrderDetail } from '../api'
import { errorMessage } from '@/lib/feedback'

const route = useRoute()
const router = useRouter()
const tenantId = computed(() => String(route.params.tenantId || ''))
const document = ref('')
const code = ref('')
const challenge = ref('')
const token = ref(portalSession.value?.tenantId === tenantId.value ? portalSession.value.token : '')
const orders = ref<PortalOrder[]>([])
const clientName = ref('')
const selectedOrder = ref<PortalOrderDetail | null>(null)
const detailsOpen = ref(false)
const lineSearch = ref('')
const normalizeLineNumber = (value: string) => value.replace(/\D/g, '')
const filteredOrderItems = computed(() => {
  const items = selectedOrder.value?.items ?? []
  const search = normalizeLineNumber(lineSearch.value)
  return search ? items.filter(item => normalizeLineNumber(item.line_number ?? '').includes(search)) : items
})
const page = ref(1)
const lastPage = ref(1)
const loading = ref(false)
const error = ref('')
const notice = ref('')
const step = computed(() => tenantId.value && token.value ? 'orders' : challenge.value ? 'verify' : 'identify')
onMounted(() => {
  if (tenantId.value && (!portalSession.value || portalSession.value.tenantId !== tenantId.value)) {
    void router.replace('/portal-do-cliente')
  } else if (tenantId.value && token.value) {
    void loadOrders()
  }
})
const money = (value: string) => Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const date = (value: string | null) => {
  if (!value) return '—'
  const isoDate = value.slice(0, 10)
  const parts = isoDate.split('-')
  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : new Date(value).toLocaleDateString('pt-BR')
}
async function requestCode() {
  if (loading.value) return
  loading.value = true
  error.value = ''
  try {
    const result = await customerPortalApi.requestCode(document.value.replace(/\D/g, ''))
    challenge.value = result.challenge
    notice.value = result.message
  } catch (e) { error.value = errorMessage(e) }
  finally { loading.value = false }
}
async function loadOrders(nextPage = 1) {
  loading.value = true
  error.value = ''
  try {
    const result = await customerPortalApi.orders(tenantId.value, token.value, nextPage)
    clientName.value = result.client_name || ''
    orders.value = result.data
    page.value = result.meta.current_page
    lastPage.value = result.meta.last_page
  } catch (e) {
    error.value = errorMessage(e)
    if (e instanceof Error && /sessão|autorizad|expir/i.test(e.message)) token.value = ''
  } finally { loading.value = false }
}
async function verify() {
  if (loading.value) return
  loading.value = true
  error.value = ''
  try {
    const result = await customerPortalApi.verify(challenge.value, code.value)
    portalSession.value = { tenantId: result.data.tenant_id, token: result.data.token }
    token.value = result.data.token
    clientName.value = result.data.client_name || ''
    notice.value = ''
    await router.replace('/portal-do-cliente/' + result.data.tenant_id)
    await loadOrders()
  } catch (e) { error.value = errorMessage(e) }
  finally { loading.value = false }
}
async function showOrder(id: string) {
  lineSearch.value = ''
  error.value = ''
  loading.value = true
  try {
    selectedOrder.value = (await customerPortalApi.order(tenantId.value, token.value, id)).data
    detailsOpen.value = true
  } catch (e) { error.value = errorMessage(e) }
  finally { loading.value = false }
}
async function logout() {
  const current = token.value
  token.value = ''
  portalSession.value = null
  challenge.value = ''
  code.value = ''
  orders.value = []
  clientName.value = ''
  await router.replace('/portal-do-cliente')
  if (current) { try { await customerPortalApi.logout(tenantId.value, current) } catch { /* Session also expires on the server. */ } }
}
</script>

<template>
  <main class="min-h-screen bg-stone-100 px-4 py-10 text-slate-900">
    <div class="mx-auto max-w-4xl">
      <header class="mb-8 flex items-center justify-between gap-4">
        <div><p class="text-xs font-semibold uppercase tracking-widest text-orange-700">Atendimento ao cliente</p><h1 class="mt-2 text-3xl font-bold">Portal do Cliente</h1><p v-if="step === 'orders' && clientName" class="mt-2 text-lg font-semibold text-slate-800">{{ clientName }}</p><p class="mt-2 text-slate-600">Acompanhe seus pedidos comerciais com segurança.</p></div>
        <button v-if="token" type="button" class="secondary-button w-auto" @click="logout">Sair</button>
      </header>
      <section v-if="step !== 'orders'" class="max-w-lg rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <form v-if="step === 'identify'" class="space-y-4" @submit.prevent="requestCode">
          <h2 class="text-lg font-semibold">Identifique-se</h2>
          <p class="text-sm text-slate-600">Informe o CPF ou CNPJ cadastrado. Enviaremos um código para um contato previamente autorizado.</p>
          <label class="block text-sm font-medium" for="portal-document">CPF ou CNPJ</label>
          <input id="portal-document" v-model="document" class="field w-full" inputmode="numeric" autocomplete="off" maxlength="18" placeholder="Somente números" required />
          <button type="submit" class="primary-button w-full" :disabled="loading">{{ loading ? 'Aguarde…' : 'Receber código' }}</button>
        </form>
        <form v-else class="space-y-4" @submit.prevent="verify">
          <h2 class="text-lg font-semibold">Verificar acesso</h2>
          <p class="text-sm text-slate-600">Digite o código de seis dígitos enviado ao e-mail autorizado. Ele é válido por cinco minutos.</p>
          <label class="block text-sm font-medium" for="portal-code">Código de verificação</label>
          <input id="portal-code" v-model="code" class="field w-full" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" autocomplete="one-time-code" placeholder="000000" required />
          <button type="submit" class="primary-button w-full" :disabled="loading">{{ loading ? 'Verificando…' : 'Acessar meus pedidos' }}</button>
          <button type="button" class="secondary-button w-full" @click="challenge = ''; code = ''; notice = ''">Voltar</button>
        </form>
      </section>
      <section v-else class="space-y-4">
        <div class="rounded-xl bg-white p-5 shadow-sm"><h2 class="text-lg font-semibold">Histórico de pedidos</h2><p class="text-sm text-slate-500">Somente pedidos vinculados ao seu cadastro.</p></div>
        <p v-if="loading" class="text-sm text-slate-500">Carregando pedidos…</p>
        <p v-else-if="!orders.length" class="rounded-xl bg-white p-6 text-slate-600">Nenhum pedido encontrado.</p>
        <article v-for="order in orders" :key="order.id" class="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <div class="flex flex-wrap items-start justify-between gap-3"><div><p class="font-semibold">{{ order.operator || 'Operadora não informada' }}</p><p class="mt-1 text-xs text-slate-500">Pedido {{ order.code }} · {{ date(order.created_at) }}</p></div><span class="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold">{{ order.status || 'Em andamento' }}</span></div>
          <div class="mt-4 grid gap-3 border-t border-stone-100 pt-4 text-sm sm:grid-cols-3"><p><span class="block text-xs text-slate-500">Negociação</span>{{ order.order_type || '—' }}</p><p><span class="block text-xs text-slate-500">Linhas</span>{{ order.line_quantity }}</p><p><span class="block text-xs text-slate-500">Mensalidade</span>{{ money(order.monthly_amount) }}</p></div>
          <div class="mt-4 grid gap-3 border-t border-stone-100 pt-4 text-sm sm:grid-cols-2">
            <p><span class="block text-xs text-slate-500">Data de ativação</span>{{ order.activated_at ? date(order.activated_at) : 'Aguardando ativação' }}</p>
            <p><span class="block text-xs text-slate-500">Consultor responsável</span>{{ order.consultant_name || 'Não informado' }}</p>
          </div>
          <button type="button" class="secondary-button mt-4 w-auto" :disabled="loading" @click="showOrder(order.id)">Ver detalhes</button>
        </article>
        <div v-if="lastPage > 1" class="flex items-center justify-between gap-3"><button class="secondary-button w-auto" type="button" :disabled="loading || page === 1" @click="loadOrders(page - 1)">Anterior</button><span class="text-sm text-slate-600">Página {{ page }} de {{ lastPage }}</span><button class="secondary-button w-auto" type="button" :disabled="loading || page === lastPage" @click="loadOrders(page + 1)">Próxima</button></div>
      </section>
      <AppDialog :open="detailsOpen" title="Detalhes do pedido" size="wide" @close="detailsOpen = false">
        <div v-if="selectedOrder" class="space-y-5">
          <div class="grid gap-4 text-sm sm:grid-cols-3"><div><p class="text-xs text-slate-500">Pedido</p><p class="font-semibold">{{ selectedOrder.code }}</p></div><div><p class="text-xs text-slate-500">Situação</p><p class="font-semibold">{{ selectedOrder.status }}</p></div><div><p class="text-xs text-slate-500">Operadora</p><p class="font-semibold">{{ selectedOrder.operator }}</p></div></div>
          <div class="grid gap-4 border-t border-stone-100 pt-4 text-sm sm:grid-cols-2">
            <div><p class="text-xs text-slate-500">Consultor responsável</p><p class="font-medium">{{ selectedOrder.consultant_name || 'Não informado' }}</p></div>
            <div><p class="text-xs text-slate-500">Ativação efetiva</p><p class="font-medium">{{ selectedOrder.activated_at ? date(selectedOrder.activated_at) : 'Aguardando ativação' }}</p></div>
          </div>
          <div class="flex items-center justify-between gap-3">
            <h3 class="font-semibold">Serviços contratados</h3>
            <span class="text-xs text-slate-500">{{ filteredOrderItems.length }} de {{ selectedOrder.items.length }} {{ selectedOrder.items.length === 1 ? 'item' : 'itens' }}</span>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <label for="portal-line-search" class="sr-only">Filtrar pelo número da linha</label>
            <input id="portal-line-search" v-model="lineSearch" type="search" inputmode="tel" autocomplete="off" class="field min-w-0 flex-1" placeholder="Buscar pelo número da linha" />
            <button v-if="lineSearch" type="button" class="secondary-button w-auto" @click="lineSearch = ''">Limpar</button>
          </div>
          <div class="max-h-[min(45dvh,420px)] overflow-y-auto overscroll-contain rounded-lg border border-stone-200 px-3" role="region" aria-label="Lista de serviços contratados" tabindex="0">
            <p v-if="!filteredOrderItems.length" class="py-6 text-center text-sm text-slate-500">Nenhuma linha encontrada para o número informado.</p>
            <div v-for="(item, index) in filteredOrderItems" :key="index" class="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 py-3 text-sm last:border-b-0">
              <div>
                <p class="font-medium">{{ item.description || 'Serviço' }}</p>
                <p v-if="item.line_number" class="text-xs text-slate-500">Número: {{ item.line_number }}</p>
                <p class="text-xs text-slate-500">Quantidade: {{ item.quantity }} · {{ item.status || '—' }}</p>
              </div>
              <p class="font-semibold">{{ money(item.monthly_unit_amount) }}/mês</p>
            </div>
          </div>
        </div>
      </AppDialog>
      <p v-if="notice" role="status" class="mt-4 rounded-xl bg-blue-50 p-3 text-sm text-blue-900">{{ notice }}</p>
      <p v-if="error" role="alert" class="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">{{ error }}</p>
      <p class="mt-8 text-xs text-slate-500">Se não receber o código, solicite à empresa que confirme o contato autorizado para acesso ao portal.</p>
    </div>
  </main>
</template>
