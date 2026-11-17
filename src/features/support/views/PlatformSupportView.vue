<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import AppShell from '@/components/layout/AppShell.vue'
import SearchSelect from '@/components/ui/SearchSelect.vue'
import { usePlatformSupport } from '../composables/usePlatformSupport'

const { result, summary, loadSummary, selected, loading, busy, error, load, open, update, reply } = usePlatformSupport()
const page = ref(1)
const status = ref('')
const priorityFilter = ref('')
const search = ref('')
const replyBody = ref('')
async function toggleTicket(id: string) {
  if (selected.value?.id === id) { selected.value = null; return }
  await open(id)
}
const statusOptions = [
  { value: '', label: 'Todos os status' },
  { value: 'open', label: 'Aberto' },
  { value: 'in_progress', label: 'Em atendimento' },
  { value: 'waiting', label: 'Aguardando' },
  { value: 'closed', label: 'Encerrado' },
]
const priorityOptions = [
  { value: 'low', label: 'Baixa' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'Alta' },
  { value: 'urgent', label: 'Urgente' },
]
function refresh(next = 1) { page.value = next; void load(next, appliedStatus.value, appliedSearch.value, appliedPriority.value); void loadSummary() }
async function sendReply() {
  if (!replyBody.value.trim()) return
  if (await reply(replyBody.value.trim())) { replyBody.value = ''; applyFilters(page.value) }
}
async function changeStatus(value: string | number) {
  if (await update({ status: String(value) })) refresh(page.value)
}
async function changePriority(value: string | number) {
  if (await update({ priority: String(value) })) refresh(page.value)
}
let refreshTimer: ReturnType<typeof setInterval> | undefined
let polling = false
async function refreshInBackground() {
  if (document.visibilityState !== 'visible' || polling || loading.value || busy.value) return
  polling = true
  try {
    await Promise.all([
      load(page.value, appliedStatus.value, appliedSearch.value, appliedPriority.value, true),
      loadSummary(),
    ])
    // Não fecha nem substitui a conversa selecionada durante a atualização.
  } finally { polling = false }
}
const appliedStatus = ref('')
const appliedSearch = ref('')
const appliedPriority = ref('')
function applyFilters(next = 1) {
  appliedStatus.value = status.value
  appliedSearch.value = search.value
  appliedPriority.value = priorityFilter.value
  refresh(next)
}
onMounted(() => {
  applyFilters()
  refreshTimer = setInterval(() => void refreshInBackground(), 15000)
  document.addEventListener('visibilitychange', refreshInBackground)
})
onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer)
  document.removeEventListener('visibilitychange', refreshInBackground)
})
</script>

<template>
  <AppShell title="Suporte da plataforma" subtitle="Administração">
    <header class="mb-7">
      <p class="eyebrow">CENTRAL DE SUPORTE</p>
      <h1 class="mt-3 text-3xl font-semibold text-slate-900">Chamados das empresas</h1>
      <p class="mt-2 text-sm text-slate-500">Acompanhe solicitações e responda aos usuários.</p>
    </header>
    <p v-if="error" role="alert" class="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">{{ error }}</p>
    <div class="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <button v-for="metric in [
        { key: 'open', label: 'Abertos', value: summary?.open ?? 0, filter: 'open' },
        { key: 'in_progress', label: 'Em atendimento', value: summary?.in_progress ?? 0, filter: 'in_progress' },
        { key: 'waiting', label: 'Aguardando cliente', value: summary?.waiting ?? 0, filter: 'waiting' },
        { key: 'urgent', label: 'Urgentes ativos', value: summary?.urgent ?? 0, filter: '' },
      ]" :key="metric.key" type="button" class="rounded-2xl border border-stone-200 bg-white p-4 text-left shadow-sm transition hover:border-orange-400" @click="status = metric.filter; priorityFilter = metric.key === 'urgent' ? 'urgent' : ''; applyFilters()">
        <span class="block text-xs font-semibold text-slate-500">{{ metric.label }}</span>
        <strong class="mt-2 block text-2xl font-semibold" :class="metric.key === 'urgent' && metric.value ? 'text-red-600' : 'text-slate-900'">{{ metric.value }}</strong>
      </button>
    </div>
    <div class="mb-5 grid items-end gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm md:grid-cols-[minmax(0,1.5fr)_minmax(200px,1fr)_auto]">
      <label class="block min-w-0 text-xs font-semibold text-slate-600">Assunto ou protocolo
        <input v-model="search" class="field mt-2" placeholder="Pesquisar chamado" @keyup.enter="refresh()" />
      </label>
      <div class="min-w-0">
        <label class="mb-2 block text-xs font-semibold text-slate-600">Status</label>
        <SearchSelect v-model="status" :options="statusOptions" />
      </div>
      <div class="flex items-center gap-2 md:pb-0.5">
        <button class="inline-flex h-11 min-w-28 items-center justify-center rounded-xl bg-orange-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700 disabled:opacity-50" type="button" :disabled="loading" @click="priorityFilter = ''; refresh()">Buscar</button>
        <button class="inline-flex h-11 items-center justify-center rounded-xl border border-stone-200 bg-white px-4 text-sm font-medium text-slate-600 transition hover:bg-stone-50" type="button" @click="search = ''; status = ''; priorityFilter = ''; refresh()">Limpar</button>
      </div>
    </div>
    <div class="grid items-start gap-5 lg:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.3fr)]">
      <section class="space-y-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
        <p v-if="loading" class="text-sm text-slate-500">Carregando chamados…</p>
        <p v-if="!loading && !result?.data.length" class="py-10 text-center text-sm text-slate-500">Nenhum chamado encontrado.</p>
        <button v-for="ticket in result?.data ?? []" :key="ticket.id" type="button" class="block w-full rounded-xl border bg-white p-4 text-left transition hover:border-orange-300 hover:bg-orange-50/30" :class="selected?.id === ticket.id ? 'border-orange-400' : 'border-stone-200'" @click="toggleTicket(ticket.id)" :aria-expanded="selected?.id === ticket.id">
          <div class="flex justify-between gap-3">
            <span class="flex min-w-0 items-center gap-2"><strong class="truncate text-sm text-slate-900">{{ ticket.subject }}</strong><span class="text-xs text-slate-400" aria-hidden="true">{{ selected?.id === ticket.id ? "▴" : "▾" }}</span></span>
            <span class="text-xs text-slate-500">{{ statusOptions.find(option => option.value === ticket.status)?.label ?? ticket.status }}</span>
          </div>
          <p class="mt-2 text-xs text-slate-600">{{ ticket.tenant?.name }} · {{ ticket.author?.name }}</p>
          <span v-if="ticket.priority === 'urgent'" class="mt-2 inline-flex rounded-full bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-700">Urgente</span>
          <span v-else-if="ticket.priority === 'high'" class="mt-2 inline-flex rounded-full bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-700">Prioridade alta</span>
          <p class="mt-1 truncate font-mono text-[11px] text-slate-400" :title="ticket.id">Protocolo: {{ ticket.id.slice(0, 8) }}</p>
        </button>
        <div v-if="result && result.last_page > 1" class="flex items-center justify-between gap-3">
          <button class="secondary-button w-auto" :disabled="page <= 1 || loading" @click="applyFilters(page - 1)">Anterior</button>
          <span class="text-sm text-slate-500">{{ page }} de {{ result.last_page }}</span>
          <button class="secondary-button w-auto" :disabled="page >= result.last_page || loading" @click="applyFilters(page + 1)">Próxima</button>
        </div>
      </section>
      <section class="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <p v-if="!selected" class="text-sm text-slate-500">Selecione um chamado para visualizar e responder.</p>
        <template v-else>
          <h2 class="font-semibold text-slate-900">{{ selected.subject }}</h2>
          <p class="mt-2 text-xs text-slate-500">{{ selected.tenant?.name }} · {{ selected.author?.email }}</p>
          <p class="mt-4 whitespace-pre-wrap text-sm text-slate-700">{{ selected.description }}</p>
          <div class="mt-5 grid gap-3 sm:grid-cols-2">
            <div>
              <label class="mb-2 block text-xs font-semibold">Status</label>
              <SearchSelect :model-value="selected.status" :options="statusOptions.filter(option => option.value)" :disabled="busy" @update:model-value="changeStatus" />
            </div>
            <div>
              <label class="mb-2 block text-xs font-semibold">Prioridade</label>
              <SearchSelect :model-value="selected.priority" :options="priorityOptions" :disabled="busy" @update:model-value="changePriority" />
            </div>
          </div>
          <h3 class="mt-6 border-t border-stone-100 pt-5 font-semibold">Histórico da conversa</h3>
          <div class="mt-3 max-h-80 space-y-3 overflow-y-auto pr-1">
            <article v-for="message in selected.messages ?? []" :key="message.id" class="rounded-lg bg-stone-50 p-3">
              <p class="text-xs font-semibold">{{ message.author?.name ?? 'Usuário' }}</p>
              <p class="mt-1 whitespace-pre-wrap text-sm">{{ message.body }}</p>
              <p class="mt-2 text-xs text-slate-400">{{ new Date(message.created_at).toLocaleString('pt-BR') }}</p>
            </article>
          </div>
          <form class="mt-5 space-y-3" @submit.prevent="sendReply">
            <label class="block text-xs font-semibold">Responder ao chamado
              <textarea v-model="replyBody" required minlength="2" maxlength="10000" rows="4" class="field mt-2" />
            </label>
            <button type="submit" class="primary-button w-full" :disabled="busy">{{ busy ? 'Enviando…' : 'Enviar resposta' }}</button>
          </form>
        </template>
      </section>
    </div>
  </AppShell>
</template>
