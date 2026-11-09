<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import AppDialog from '@/components/ui/AppDialog.vue'
import { tenantApi } from '@/features/tenants/api'
import type { Tenant } from '@/features/tenants/types'
import { protocolApi, type Protocol, type ProtocolDetail, type ProtocolInput, type ProtocolStatus } from '../api'
import { errorMessage } from '@/lib/feedback'
import { toast } from '@/services/toast'

const tenantId = String(useRoute().params.tenantId)
const tenant = ref<Tenant>()
const protocols = ref<Protocol[]>([])
const clients = ref<{ id: string; company_name: string }[]>([])
const currentMemberId = ref('')
const members = ref<{ id: string; name: string }[]>([])
const search = ref('')
const statusFilter = ref('')
const page = ref(1)
const total = ref(0)
const lastPage = ref(1)
const loading = ref(false)
const error = ref('')
const saving = ref(false)
const dialogOpen = ref(false)
const detail = ref<ProtocolDetail | null>(null)
const form = ref<ProtocolInput>({ code: '', client_id: '', title: '', category: 'support', priority: 'normal', description: '', assigned_to_tenant_user_id: currentMemberId.value || null, due_at: null })
const updateStatus = ref<ProtocolStatus>('open')
const updateAssignee = ref('')
const note = ref('')
const statuses: Record<ProtocolStatus, string> = { open: 'Aberto', in_progress: 'Em atendimento', waiting: 'Aguardando retorno', resolved: 'Resolvido', cancelled: 'Cancelado', reopened: 'Reaberto' }
const categories: Record<string, string> = { activation: 'Ativação', portability: 'Portabilidade', billing: 'Financeiro', support: 'Suporte', contract: 'Contratos', cancellation: 'Cancelamento', other: 'Outros' }
const priorities: Record<string, string> = { low: 'Baixa', normal: 'Normal', high: 'Alta', urgent: 'Urgente' }
const overdue = (p: Protocol) => !!p.due_at && new Date(p.due_at).getTime() < Date.now() && !['resolved', 'cancelled'].includes(p.status)
const editing = computed(() => !!detail.value)
async function load() {
  loading.value = true; error.value = ''
  try {
    const response = await protocolApi.list(tenantId, { page: String(page.value), ...(search.value ? { search: search.value } : {}), ...(statusFilter.value ? { status: statusFilter.value } : {}) })
    protocols.value = response.data; total.value = response.total; lastPage.value = response.last_page
  } catch (e) { error.value = errorMessage(e) } finally { loading.value = false }
}
watch(page, () => { void load() })
void Promise.all([tenantApi.show(tenantId), protocolApi.options(tenantId)]).then(([t, o]) => { tenant.value = t.data; clients.value = o.data.clients; members.value = o.data.members; currentMemberId.value = o.data.current_member_id }).catch(e => { error.value = errorMessage(e) })
void load()
function newProtocol() {
  detail.value = null
  form.value = { code: '', client_id: '', title: '', category: 'support', priority: 'normal', description: '', assigned_to_tenant_user_id: null, due_at: null }
  dialogOpen.value = true
}
async function openProtocol(p: Protocol) {
  error.value = ''
  try {
    detail.value = await protocolApi.show(tenantId, p.id)
    updateStatus.value = detail.value.data.status
    updateAssignee.value = detail.value.data.assigned_to_tenant_user_id ?? ''
    note.value = ''
    dialogOpen.value = true
  } catch (e) { error.value = errorMessage(e) }
}
async function save() {
  saving.value = true; error.value = ''
  try {
    if (detail.value) {
      detail.value = await protocolApi.update(tenantId, detail.value.data.id, { status: updateStatus.value, assigned_to_tenant_user_id: updateAssignee.value || null, note: note.value })
    } else {
      await protocolApi.create(tenantId, form.value)
    }
    dialogOpen.value = false; toast.success('Protocolo salvo.'); void load()
  } catch (e) { error.value = errorMessage(e) } finally { saving.value = false }
}
function searchNow() { if (page.value === 1) void load(); else page.value = 1 }
</script>

<template>
  <AppShell :tenant="tenant" title="Pós-venda" subtitle="Central de protocolos">
    <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div><h1 class="text-2xl font-bold text-slate-800">Protocolos</h1><p class="text-sm text-slate-500">Acompanhe solicitações e atendimentos dos clientes.</p></div>
      <button class="primary-button" @click="newProtocol">+ Novo protocolo</button>
    </div>
    <div class="mb-4 flex flex-wrap gap-2 rounded-xl border border-stone-200 bg-white p-3">
      <input v-model="search" class="field min-w-48 flex-1" placeholder="Protocolo, cliente ou assunto" @keyup.enter="searchNow" />
      <select v-model="statusFilter" class="field"><option value="">Todas as situações</option><option v-for="(label, key) in statuses" :key="key" :value="key">{{ label }}</option></select>
      <button class="secondary-button" @click="searchNow">Buscar</button>
      <button class="secondary-button" @click="search = ''; statusFilter = ''; searchNow()">Limpar</button>
    </div>
    <p v-if="error && !dialogOpen" class="mb-3 text-sm text-red-700">{{ error }}</p>
    <div class="overflow-hidden rounded-xl border border-stone-200 bg-white">
      <p v-if="loading" class="p-5 text-sm text-slate-500">Carregando protocolos…</p>
      <p v-else-if="!protocols.length" class="p-6 text-center text-sm text-slate-500">Nenhum protocolo encontrado.</p>
      <div v-else class="overflow-x-auto"><table class="w-full text-left text-sm">
        <thead class="bg-stone-50 text-slate-500"><tr><th class="p-3">Protocolo</th><th class="p-3">Cliente / assunto</th><th class="p-3">Categoria</th><th class="p-3">Responsável</th><th class="p-3">Situação</th><th class="p-3">Prazo</th></tr></thead>
        <tbody><tr v-for="p in protocols" :key="p.id" class="cursor-pointer border-t border-stone-100 hover:bg-stone-50" @click="openProtocol(p)">
          <td class="p-3 font-semibold text-orange-700">{{ p.code }}</td><td class="p-3"><div class="font-semibold">{{ p.client_name }}</div><div class="text-xs text-slate-500">{{ p.title }}</div></td>
          <td class="p-3">{{ categories[p.category] ?? p.category }}</td><td class="p-3">{{ p.assignee_name || 'Não atribuído' }}</td>
          <td class="p-3"><span class="rounded-lg bg-stone-100 px-2 py-1 text-xs">{{ statuses[p.status] }}</span></td>
          <td class="p-3" :class="{ 'font-semibold text-red-700': overdue(p) }">{{ p.due_at ? new Date(p.due_at).toLocaleDateString('pt-BR') : '—' }}<span v-if="overdue(p)"> · Atrasado</span></td>
        </tr></tbody>
      </table></div>
    </div>
    <div class="mt-4 flex items-center justify-between text-sm text-slate-500"><span>{{ total }} protocolo(s)</span><div class="flex items-center gap-3"><button class="secondary-button" :disabled="page <= 1" @click="page--">Anterior</button><span>{{ page }} / {{ lastPage }}</span><button class="secondary-button" :disabled="page >= lastPage" @click="page++">Próximo</button></div></div>
    <AppDialog :open="dialogOpen" :title="editing ? 'Movimentar protocolo' : 'Novo protocolo'" @close="dialogOpen = false">
      <div class="space-y-4 p-1">
        <template v-if="detail">
          <div class="rounded-xl bg-stone-50 p-3"><div class="text-xs text-slate-500">{{ detail.data.code }}</div><div class="font-semibold">{{ detail.data.title }}</div><p class="mt-1 text-sm text-slate-600">{{ detail.data.description }}</p></div>
          <label class="block text-sm font-medium">Situação<select v-model="updateStatus" class="field mt-1 w-full"><option v-for="(label, key) in statuses" :key="key" :value="key">{{ label }}</option></select></label>
          <label class="block text-sm font-medium">Responsável pelo atendimento<select v-model="updateAssignee" class="field mt-1 w-full"><option value="">Não atribuído</option><option v-for="m in members" :key="m.id" :value="m.id">{{ m.name }}</option></select></label>
          <label class="block text-sm font-medium">Observação / resolução<textarea v-model="note" class="field mt-1 w-full" rows="3" placeholder="Registre a movimentação…" /></label>
          <div class="max-h-56 space-y-2 overflow-auto border-t pt-3"><h3 class="font-semibold">Histórico</h3><div v-for="h in detail.history" :key="h.id" class="rounded-lg bg-stone-50 p-3 text-sm"><div class="text-xs text-slate-500">{{ h.actor_name }} · {{ new Date(h.created_at).toLocaleString('pt-BR') }}</div><p>{{ h.from_status ? statuses[h.from_status as ProtocolStatus] : 'Abertura' }} → {{ statuses[h.to_status as ProtocolStatus] }}</p><p v-if="h.note">{{ h.note }}</p></div></div>
        </template>
        <template v-else>
          <label class="block text-sm font-medium">Número do protocolo da operadora<input v-model.trim="form.code" class="field mt-1 w-full" maxlength="40" placeholder="Informe o número fornecido pela operadora" /></label>
          <label class="block text-sm font-medium">Cliente<select v-model="form.client_id" class="field mt-1 w-full"><option value="">Selecione o cliente</option><option v-for="c in clients" :key="c.id" :value="c.id">{{ c.company_name }}</option></select></label>
          <label class="block text-sm font-medium">Assunto<input v-model="form.title" class="field mt-1 w-full" maxlength="180" /></label>
          <div class="grid grid-cols-2 gap-3"><label class="text-sm font-medium">Categoria<select v-model="form.category" class="field mt-1 w-full"><option v-for="(label, key) in categories" :key="key" :value="key">{{ label }}</option></select></label><label class="text-sm font-medium">Prioridade<select v-model="form.priority" class="field mt-1 w-full"><option v-for="(label, key) in priorities" :key="key" :value="key">{{ label }}</option></select></label></div>
          <label class="block text-sm font-medium">Responsável pelo atendimento (você por padrão)<select v-model="form.assigned_to_tenant_user_id" class="field mt-1 w-full"><option :value="null">Não atribuído</option><option v-for="m in members" :key="m.id" :value="m.id">{{ m.name }}</option></select></label>
          <label class="block text-sm font-medium">Descrição<textarea v-model="form.description" class="field mt-1 w-full" rows="4" /></label>
        </template>
        <p v-if="error" class="text-sm text-red-700">{{ error }}</p>
        <div class="flex justify-end gap-2"><button class="secondary-button" @click="dialogOpen = false">Cancelar</button><button class="primary-button" :disabled="saving" @click="save">{{ saving ? 'Salvando…' : 'Salvar' }}</button></div>
      </div>
    </AppDialog>
  </AppShell>
</template>
