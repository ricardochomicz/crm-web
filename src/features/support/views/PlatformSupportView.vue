<script setup lang="ts">
import { onMounted, ref } from 'vue'
import AppShell from '@/components/layout/AppShell.vue'
import SearchSelect from '@/components/ui/SearchSelect.vue'
import { usePlatformSupport } from '../composables/usePlatformSupport'

const { result, selected, loading, busy, error, load, open, update, reply } = usePlatformSupport()
const page = ref(1)
const status = ref('')
const search = ref('')
const replyBody = ref('')
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
function refresh(next = 1) { page.value = next; void load(next, status.value, search.value) }
async function sendReply() {
  if (!replyBody.value.trim()) return
  if (await reply(replyBody.value.trim())) { replyBody.value = ''; refresh(page.value) }
}
async function changeStatus(value: string | number) {
  if (await update({ status: String(value) })) refresh(page.value)
}
async function changePriority(value: string | number) {
  if (await update({ priority: String(value) })) refresh(page.value)
}
onMounted(() => refresh())
</script>

<template>
  <AppShell title="Suporte da plataforma" subtitle="Administração">
    <header class="mb-7">
      <p class="eyebrow">CENTRAL DE SUPORTE</p>
      <h1 class="mt-3 text-3xl font-semibold text-slate-900">Chamados das empresas</h1>
      <p class="mt-2 text-sm text-slate-500">Acompanhe solicitações e responda aos usuários.</p>
    </header>
    <p v-if="error" role="alert" class="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">{{ error }}</p>
    <div class="mb-5 flex flex-wrap items-end gap-3 rounded-xl border border-stone-200 bg-white p-4">
      <label class="min-w-52 flex-1 text-xs font-semibold text-slate-600">Assunto ou protocolo
        <input v-model="search" class="field mt-2" placeholder="Pesquisar chamado" @keyup.enter="refresh()" />
      </label>
      <div class="min-w-48 flex-1">
        <label class="mb-2 block text-xs font-semibold text-slate-600">Status</label>
        <SearchSelect v-model="status" :options="statusOptions" />
      </div>
      <button class="primary-button w-auto" type="button" @click="refresh()">Buscar</button>
      <button class="secondary-button w-auto" type="button" @click="search = ''; status = ''; refresh()">Limpar</button>
    </div>
    <div class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(360px,1fr)]">
      <section class="space-y-3">
        <p v-if="loading" class="text-sm text-slate-500">Carregando chamados…</p>
        <p v-if="!loading && !result?.data.length" class="text-sm text-slate-500">Nenhum chamado encontrado.</p>
        <button v-for="ticket in result?.data ?? []" :key="ticket.id" type="button" class="block w-full rounded-xl border bg-white p-4 text-left transition hover:border-orange-300" :class="selected?.id === ticket.id ? 'border-orange-400' : 'border-stone-200'" @click="open(ticket.id)">
          <div class="flex justify-between gap-3">
            <strong class="text-sm text-slate-900">{{ ticket.subject }}</strong>
            <span class="text-xs text-slate-500">{{ statusOptions.find(option => option.value === ticket.status)?.label ?? ticket.status }}</span>
          </div>
          <p class="mt-2 text-xs text-slate-600">{{ ticket.tenant?.name }} · {{ ticket.author?.name }}</p>
          <p class="mt-1 text-xs text-slate-400">{{ ticket.id }}</p>
        </button>
        <div v-if="result && result.last_page > 1" class="flex items-center justify-between gap-3">
          <button class="secondary-button w-auto" :disabled="page <= 1 || loading" @click="refresh(page - 1)">Anterior</button>
          <span class="text-sm text-slate-500">{{ page }} de {{ result.last_page }}</span>
          <button class="secondary-button w-auto" :disabled="page >= result.last_page || loading" @click="refresh(page + 1)">Próxima</button>
        </div>
      </section>
      <section class="rounded-xl border border-stone-200 bg-white p-5">
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
          <h3 class="mt-6 font-semibold">Histórico da conversa</h3>
          <div class="mt-3 max-h-80 space-y-3 overflow-y-auto">
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
