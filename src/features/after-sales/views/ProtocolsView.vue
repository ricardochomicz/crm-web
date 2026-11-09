<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import AppDialog from '@/components/ui/AppDialog.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import ListFilters from '@/components/ui/ListFilters.vue'
import ListTable from '@/components/ui/ListTable.vue'
import PagePagination from '@/components/ui/PagePagination.vue'
import SearchSelect from '@/components/ui/SearchSelect.vue'
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
const statusOptions = computed(() => [{ value: '', label: 'Todas as situações' }, ...Object.entries(statuses).map(([value, label]) => ({ value, label }))])
const memberOptions = computed(() => [{ value: '', label: 'Não atribuído' }, ...members.value.map(m => ({ value: m.id, label: m.name }))])
const categoryOptions = computed(() => Object.entries(categories).map(([value, label]) => ({ value, label })))
const priorityOptions = computed(() => Object.entries(priorities).map(([value, label]) => ({ value, label })))
const workflowStatusOptions = computed(() => Object.entries(statuses).map(([value, label]) => ({ value, label })))
const clientOptions = computed(() => [{ value: '', label: 'Selecione o cliente' }, ...clients.value.map(c => ({ value: c.id, label: c.company_name }))])
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
  form.value = { code: '', client_id: '', title: '', category: 'support', priority: 'normal', description: '', assigned_to_tenant_user_id: currentMemberId.value || null, due_at: null }
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
      await protocolApi.create(tenantId, { ...form.value, due_at: form.value.due_at ? new Date(form.value.due_at).toISOString() : null })
    }
    dialogOpen.value = false; toast.success('Protocolo salvo.'); void load()
  } catch (e) { error.value = errorMessage(e) } finally { saving.value = false }
}
function searchNow() { if (page.value === 1) void load(); else page.value = 1 }
</script>

<template>
  <AppShell :tenant="tenant" title="Pós-venda" subtitle="Central de protocolos">
    <header class="mb-7 flex flex-wrap items-center justify-between gap-4">
      <div>
        <p class="eyebrow">PÓS-VENDA</p>
        <h1 class="mt-3 text-3xl font-semibold text-slate-900">Protocolos</h1>
        <p class="mt-2 text-sm text-slate-500">Acompanhe os atendimentos e protocolos registrados junto às operadoras.</p>
      </div>
      <button type="button" class="primary-button inline-flex w-auto items-center gap-2" @click="newProtocol">
        <span class="text-lg leading-none">+</span> Novo protocolo
      </button>
    </header>
    <ListFilters title="Filtros" :busy="loading" :columns="2" :count-label="`${total} protocolo(s) encontrado(s)`" :active-count="Number(!!search) + Number(!!statusFilter)" collapsible initially-collapsed @search="searchNow" @clear="search = ''; statusFilter = ''; searchNow()">
      <div>
        <label for="protocol-search" class="mb-2 block text-sm font-semibold text-slate-700">Pesquisar protocolos</label>
        <input id="protocol-search" v-model="search" class="field w-full" placeholder="Número do protocolo, cliente ou assunto" />
      </div>
      <div>
        <label class="mb-2 block text-sm font-semibold text-slate-700">Situação</label>
        <SearchSelect v-model="statusFilter" :options="statusOptions" placeholder="Todas as situações" />
      </div>
    </ListFilters>
    <div v-if="error && !dialogOpen" class="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{{ error }} <button type="button" class="ml-2 font-semibold underline" @click="load">Tentar novamente</button></div>
    <section v-if="!error" class="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
      <div v-if="loading" class="p-6 text-sm text-slate-500">Carregando protocolos…</div>
      <template v-else>
        <ListTable min-width="800px">
          <thead class="bg-stone-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr><th class="p-4">Protocolo</th><th class="p-4">Cliente / assunto</th><th class="p-4">Categoria</th><th class="p-4">Responsável</th><th class="p-4">Situação</th><th class="p-4">Prazo</th><th class="p-4 text-right">Ações</th></tr>
          </thead>
          <tbody>
            <tr v-for="p in protocols" :key="p.id" class="border-t border-stone-100 hover:bg-stone-50/70">
              <td class="p-4 font-semibold text-slate-800">{{ p.code }}</td>
              <td class="p-4"><div class="font-semibold text-slate-800">{{ p.client_name }}</div><div class="mt-1 text-xs text-slate-500">{{ p.title }}</div></td>
              <td class="p-4 text-slate-600">{{ categories[p.category] ?? p.category }}</td>
              <td class="p-4 text-slate-600">{{ p.assignee_name || 'Não atribuído' }}</td>
              <td class="p-4"><span class="inline-flex rounded-lg px-3 py-1 text-xs font-semibold" :class="p.status === 'resolved' ? 'bg-emerald-50 text-emerald-700' : p.status === 'cancelled' ? 'bg-stone-100 text-slate-600' : p.status === 'waiting' ? 'bg-amber-50 text-amber-700' : 'bg-orange-50 text-orange-700'">{{ statuses[p.status] }}</span></td>
              <td class="p-4" :class="overdue(p) ? 'font-semibold text-rose-700' : 'text-slate-600'">{{ p.due_at ? new Date(p.due_at).toLocaleDateString('pt-BR') : '—' }}<span v-if="overdue(p)" class="ml-1 inline-flex items-center gap-1"><AppIcon name="alertTriangle" class="size-4" /> Atrasado</span></td>
              <td class="p-4 text-right"><button type="button" class="secondary-button w-auto whitespace-nowrap" @click="openProtocol(p)">Movimentar protocolo</button></td>
            </tr>
          </tbody>
        </ListTable>
        <p v-if="!protocols.length" class="p-8 text-center text-sm text-slate-500">Nenhum protocolo encontrado. Ajuste os filtros ou cadastre um novo protocolo.</p>
      </template>
    </section>
    <PagePagination v-if="!error" :page="page" :last-page="lastPage" :total="total" :busy="loading" @change="page = $event" />
    <AppDialog :open="dialogOpen" :title="editing ? 'Movimentar protocolo' : 'Novo protocolo'" @close="dialogOpen = false">
      <div class="space-y-4 p-1">
        <template v-if="detail">
          <div class="rounded-xl bg-stone-50 p-3"><div class="text-xs text-slate-500">{{ detail.data.code }}</div><div class="font-semibold">{{ detail.data.title }}</div><p class="mt-1 text-sm text-slate-600">{{ detail.data.description }}</p></div>
          <label class="block text-sm font-medium">Situação<SearchSelect v-model="updateStatus" :options="workflowStatusOptions" /></label>
          <label class="block text-sm font-medium">Responsável pelo atendimento<SearchSelect v-model="updateAssignee" :options="memberOptions" /></label>
          <label class="block text-sm font-medium">Observação / resolução<textarea v-model="note" class="field mt-1 w-full" rows="3" placeholder="Registre a movimentação…" /></label>
          <div class="max-h-56 space-y-2 overflow-auto border-t pt-3"><h3 class="font-semibold">Histórico</h3><div v-for="h in detail.history" :key="h.id" class="rounded-lg bg-stone-50 p-3 text-sm"><div class="text-xs text-slate-500">{{ h.actor_name }} · {{ new Date(h.created_at).toLocaleString('pt-BR') }}</div><p>{{ h.from_status ? statuses[h.from_status as ProtocolStatus] : 'Abertura' }} → {{ statuses[h.to_status as ProtocolStatus] }}</p><p v-if="h.note">{{ h.note }}</p></div></div>
        </template>
        <template v-else>
          <label class="block text-sm font-medium">Número do protocolo da operadora<input v-model.trim="form.code" class="field mt-1 w-full" maxlength="40" placeholder="Informe o número fornecido pela operadora" /></label>
          <label class="block text-sm font-medium">Cliente<SearchSelect v-model="form.client_id" :options="clientOptions" placeholder="Selecione o cliente" /></label>
          <label class="block text-sm font-medium">Assunto<input v-model="form.title" class="field mt-1 w-full" maxlength="180" /></label>
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2"><label class="text-sm font-medium">Categoria<SearchSelect v-model="form.category" :options="categoryOptions" /></label><label class="text-sm font-medium">Prioridade<SearchSelect v-model="form.priority" :options="priorityOptions" /></label></div>
          <label class="block text-sm font-medium">Responsável pelo atendimento (você por padrão)<SearchSelect v-model="form.assigned_to_tenant_user_id" :options="memberOptions" placeholder="Selecione o responsável" /></label>
          <label class="block text-sm font-medium">Prazo de tratamento <span class="font-normal text-slate-400">(opcional)</span><input v-model="form.due_at" type="datetime-local" class="field mt-1 w-full" /></label>
          <label class="block text-sm font-medium">Descrição<textarea v-model="form.description" class="field mt-1 w-full" rows="4" /></label>
        </template>
        <p v-if="error" class="text-sm text-red-700">{{ error }}</p>
        <div class="flex flex-wrap justify-end gap-2 border-t border-stone-100 pt-4"><button type="button" class="secondary-button w-auto" :disabled="saving" @click="dialogOpen = false">Cancelar</button><button type="button" class="primary-button w-auto" :disabled="saving" @click="save">{{ saving ? 'Salvando…' : editing ? 'Salvar movimentação' : 'Salvar protocolo' }}</button></div>
      </div>
    </AppDialog>
  </AppShell>
</template>
