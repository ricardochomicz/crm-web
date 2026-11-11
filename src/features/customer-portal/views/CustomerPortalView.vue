<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { customerPortalApi, type PortalOrder } from '../api'
import { errorMessage } from '@/lib/feedback'

const route = useRoute()
const tenantId = computed(() => String(route.params.tenantId))
const document = ref('')
const code = ref('')
const challenge = ref('')
const token = ref('')
const orders = ref<PortalOrder[]>([])
const page = ref(1)
const lastPage = ref(1)
const loading = ref(false)
const error = ref('')
const notice = ref('')
const step = computed(() => token.value ? 'orders' : challenge.value ? 'verify' : 'identify')
const money = (value: string) => Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const date = (value: string | null) => value ? new Date(value).toLocaleDateString('pt-BR') : '—'
async function requestCode() {
  if (loading.value) return
  loading.value = true
  error.value = ''
  try {
    const result = await customerPortalApi.requestCode(tenantId.value, document.value.replace(/\D/g, ''))
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
    const result = await customerPortalApi.verify(tenantId.value, challenge.value, code.value)
    token.value = result.data.token
    notice.value = ''
    await loadOrders()
  } catch (e) { error.value = errorMessage(e) }
  finally { loading.value = false }
}
async function logout() {
  const current = token.value
  token.value = ''
  challenge.value = ''
  code.value = ''
  orders.value = []
  if (current) { try { await customerPortalApi.logout(tenantId.value, current) } catch { /* Session also expires on the server. */ } }
}
</script>

<template>
  <main class="min-h-screen bg-stone-100 px-4 py-10 text-slate-900">
    <div class="mx-auto max-w-4xl">
      <header class="mb-8 flex items-center justify-between gap-4">
        <div><p class="text-xs font-semibold uppercase tracking-widest text-orange-700">Atendimento ao cliente</p><h1 class="mt-2 text-3xl font-bold">Portal do Cliente</h1><p class="mt-2 text-slate-600">Acompanhe seus pedidos comerciais com segurança.</p></div>
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
        </article>
        <div v-if="lastPage > 1" class="flex items-center justify-between gap-3"><button class="secondary-button w-auto" type="button" :disabled="loading || page === 1" @click="loadOrders(page - 1)">Anterior</button><span class="text-sm text-slate-600">Página {{ page }} de {{ lastPage }}</span><button class="secondary-button w-auto" type="button" :disabled="loading || page === lastPage" @click="loadOrders(page + 1)">Próxima</button></div>
      </section>
      <p v-if="notice" role="status" class="mt-4 rounded-xl bg-blue-50 p-3 text-sm text-blue-900">{{ notice }}</p>
      <p v-if="error" role="alert" class="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">{{ error }}</p>
      <p class="mt-8 text-xs text-slate-500">Se não receber o código, solicite à empresa que confirme o contato autorizado para acesso ao portal.</p>
    </div>
  </main>
</template>
