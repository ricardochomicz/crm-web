<script setup lang="ts">
import { ref, watch } from 'vue'
import SearchSelect from '@/components/ui/SearchSelect.vue'
import { useSupportTickets } from '../composables/useSupportTickets'

const props = defineProps<{ open: boolean; tenantId: string }>()
const emit = defineEmits<{ close: []; read: [] }>()
const { tickets, messages, selectedTicketId, messagesLoading, loading, submitting, error, success, load, create, openTicket, reply } = useSupportTickets()
const tab = ref<'new' | 'history'>('new')
const category = ref('technical')
const subject = ref('')
const description = ref('')
const replyBody = ref('')
async function viewTicket(id: string) {
  await openTicket(props.tenantId, id)
  await load(props.tenantId)
  emit('read')
}
watch(() => [props.open, props.tenantId] as const, ([open, tenantId]) => {
  if (open && tenantId) void load(tenantId)
}, { immediate: true })
async function sendReply() {
  if (!selectedTicketId.value || !replyBody.value.trim()) return
  if (await reply(props.tenantId, selectedTicketId.value, replyBody.value.trim())) replyBody.value = ''
}
async function submit() {
  if (!subject.value.trim() || !description.value.trim()) return
  if (await create(props.tenantId, { category: category.value, subject: subject.value.trim(), description: description.value.trim() })) {
    subject.value = ''
    description.value = ''
    tab.value = 'history'
  }
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-[80] flex justify-end">
      <button type="button" class="absolute inset-0 bg-slate-950/40" aria-label="Fechar suporte" @click="emit('close')" />
      <section role="dialog" aria-modal="true" aria-labelledby="support-title" class="relative flex h-full w-full max-w-lg flex-col bg-white shadow-2xl">
        <header class="flex items-center justify-between border-b border-stone-200 px-6 py-5">
          <div>
            <h2 id="support-title" class="text-lg font-semibold text-slate-900">Central de suporte</h2>
            <p class="text-xs text-slate-500">Atendimento da plataforma</p>
          </div>
          <button type="button" class="secondary-button w-auto" aria-label="Fechar" @click="emit('close')">Fechar</button>
        </header>
        <div class="flex gap-2 border-b border-stone-200 px-6 py-3">
          <button type="button" class="rounded-lg px-4 py-2 text-sm font-semibold" :class="tab === 'new' ? 'bg-orange-50 text-orange-700' : 'text-slate-500'" @click="tab = 'new'">Novo chamado</button>
          <button type="button" class="rounded-lg px-4 py-2 text-sm font-semibold" :class="tab === 'history' ? 'bg-orange-50 text-orange-700' : 'text-slate-500'" @click="tab = 'history'">Meus chamados</button>
        </div>
        <div class="flex-1 space-y-5 overflow-y-auto px-6 py-6">
          <p v-if="error" role="alert" class="rounded-lg bg-red-50 p-3 text-sm text-red-700">{{ error }}</p>
          <p v-if="success" role="status" class="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{{ success }}</p>
          <form v-if="tab === 'new'" class="space-y-5" @submit.prevent="submit">
            <label class="block text-sm font-semibold text-slate-700">Categoria
              <SearchSelect v-model="category" :options="[
                { value: 'technical', label: 'Problema técnico' },
                { value: 'question', label: 'Dúvida' },
                { value: 'suggestion', label: 'Sugestão' },
                { value: 'other', label: 'Outro' },
              ]" />
            </label>
            <label class="block text-sm font-semibold text-slate-700">Assunto
              <input v-model="subject" required minlength="5" maxlength="160" class="mt-2 w-full rounded-xl border border-stone-300 px-3 py-3 text-sm" placeholder="Resumo do problema" />
            </label>
            <label class="block text-sm font-semibold text-slate-700">Descrição
              <textarea v-model="description" required minlength="10" maxlength="10000" rows="7" class="mt-2 w-full rounded-xl border border-stone-300 px-3 py-3 text-sm" placeholder="Explique o que aconteceu e como reproduzir." />
            </label>
            <button type="submit" class="primary-button w-full" :disabled="submitting">{{ submitting ? 'Enviando…' : 'Abrir chamado' }}</button>
          </form>
          <div v-else-if="selectedTicketId" class="space-y-4">
            <button type="button" class="text-sm font-semibold text-orange-700" @click="selectedTicketId = null">← Voltar aos chamados</button>
            <p v-if="messagesLoading" class="text-sm text-slate-500">Carregando conversa…</p>
            <article v-for="message in messages" :key="message.id" class="rounded-xl border border-stone-200 bg-stone-50 p-4">
              <p class="text-xs font-semibold text-slate-600">{{ message.author?.name ?? 'Usuário' }}</p>
              <p class="mt-2 whitespace-pre-wrap text-sm text-slate-800">{{ message.body }}</p>
              <p class="mt-2 text-xs text-slate-400">{{ new Date(message.created_at).toLocaleString('pt-BR') }}</p>
            </article>
            <form v-if="tickets.find(ticket => ticket.id === selectedTicketId)?.status !== 'closed'" class="space-y-3" @submit.prevent="sendReply">
              <label class="block text-sm font-semibold text-slate-700">Nova mensagem
                <textarea v-model="replyBody" required minlength="2" maxlength="10000" rows="4" class="mt-2 w-full rounded-xl border border-stone-300 p-3 text-sm" />
              </label>
              <button type="submit" class="primary-button w-full" :disabled="submitting">{{ submitting ? 'Enviando…' : 'Enviar mensagem' }}</button>
            </form>
          </div>
          <div v-else class="space-y-3">
            <p v-if="loading" class="text-sm text-slate-500">Carregando chamados…</p>
            <p v-else-if="!tickets.length" class="text-sm text-slate-500">Você ainda não abriu chamados.</p>
            <button v-for="ticket in tickets" :key="ticket.id" type="button" class="block w-full rounded-xl border border-stone-200 p-4 text-left transition hover:border-orange-300" @click="viewTicket(ticket.id)">
              <div class="flex items-start justify-between gap-3">
                <h3 class="font-semibold text-slate-900">{{ ticket.subject }} <span v-if="ticket.has_unread_reply" class="ml-1 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] text-orange-800">Nova resposta</span></h3>
                <span class="rounded-full bg-stone-100 px-2 py-1 text-xs text-slate-600">{{ ticket.status === 'open' ? 'Aberto' : ticket.status }}</span>
              </div>
              <p class="mt-2 whitespace-pre-wrap text-sm text-slate-600">{{ ticket.description }}</p>
              <p class="mt-3 break-all text-xs text-slate-400">Protocolo: {{ ticket.id }}</p>
            </button>
          </div>
        </div>
      </section>
    </div>
  </Teleport>
</template>
