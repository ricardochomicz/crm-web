<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { proposalsApi, type OpportunityProposal } from '../api'
import { errorMessage } from '@/lib/feedback'
import type { Opportunity } from '../api'

const props = defineProps<{ opportunity: Opportunity; companyName: string; tenantId: string }>()
const versions = ref<OpportunityProposal[]>([])
const loading = ref(false)
const publishing = ref(false)
const message = ref('')
const failure = ref('')
const validityDays = ref(15)
const notes = ref('')
const conditions = ref('Valores sujeitos à confirmação de disponibilidade e condições comerciais.')
const operatorName = computed(() => props.opportunity.operator?.name?.trim() || 'Operadora')
const title = computed(() => 'Proposta Comercial ' + operatorName.value + ' Empresas')
const items = computed(() => props.opportunity.items ?? [])
const monthly = computed(() => items.value.reduce((total, item) => total + Number(item.monthly_unit_amount || 0) * Number(item.quantity || 0), 0))
const once = computed(() => items.value.reduce((total, item) => total + Number(item.one_time_unit_amount || 0) * Number(item.quantity || 0), 0))
const money = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const expiry = computed(() => {
  const date = new Date()
  date.setDate(date.getDate() + validityDays.value)
  return date.toLocaleDateString('pt-BR')
})
async function loadVersions() {
  loading.value = true
  failure.value = ''
  try { versions.value = (await proposalsApi.list(props.tenantId, props.opportunity.id)).data }
  catch (e) { failure.value = errorMessage(e) }
  finally { loading.value = false }
}
watch(() => [props.opportunity.id, props.tenantId], () => {
  validityDays.value = 15
  notes.value = ''
  conditions.value = 'Valores sujeitos à confirmação de disponibilidade e condições comerciais.'
  message.value = ''
  void loadVersions()
}, { immediate: true })
async function publish() {
  if (publishing.value) return
  publishing.value = true
  failure.value = ''
  message.value = ''
  try {
    await proposalsApi.publish(props.tenantId, props.opportunity.id, {
      validity_days: validityDays.value, conditions: conditions.value, notes: notes.value,
    })
    await loadVersions()
    message.value = 'Nova versão publicada. O link pode ser enviado ao cliente.'
  } catch (e) { failure.value = errorMessage(e) }
  finally { publishing.value = false }
}
async function revoke(version: OpportunityProposal) {
  if (!window.confirm('Revogar o link desta versão? O cliente perderá o acesso.')) return
  failure.value = ''
  try {
    await proposalsApi.revoke(props.tenantId, props.opportunity.id, version.id)
    await loadVersions()
  } catch (e) { failure.value = errorMessage(e) }
}
function link(version: OpportunityProposal) {
  return window.location.origin + '/proposta-comercial/' + encodeURIComponent(version.public_token)
}
async function copyLink(version: OpportunityProposal) {
  try { await navigator.clipboard.writeText(link(version)); message.value = 'Link copiado.' }
  catch { failure.value = 'Não foi possível copiar automaticamente. Abra o link e copie o endereço.' }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] ?? char)
}
function printProposal() {
  const rows = items.value.map(item => `<tr><td>${escapeHtml(item.description || 'Serviço')}</td><td>${Number(item.quantity || 0)}</td><td>${money(Number(item.monthly_unit_amount || 0))}</td><td>${money(Number(item.monthly_unit_amount || 0) * Number(item.quantity || 0))}</td></tr>`).join('')
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${escapeHtml(title.value)}</title><style>body{font:14px Arial,sans-serif;color:#1e293b;margin:48px}h1{font-size:27px;margin-bottom:5px}.sub{color:#64748b}.header{border-bottom:3px solid #c2410c;padding-bottom:24px;margin-bottom:32px}.grid{display:flex;gap:40px;margin-bottom:28px}.grid>div{flex:1}small{color:#64748b}table{width:100%;border-collapse:collapse;margin:24px 0}th,td{text-align:left;border-bottom:1px solid #e2e8f0;padding:12px 8px}th{background:#f8fafc}.total{background:#f8fafc;padding:18px;text-align:right;font-size:20px;font-weight:bold}.notes{white-space:pre-wrap;overflow-wrap:anywhere;margin-top:24px}@media print{body{margin:18mm}@page{size:A4;margin:12mm}}</style></head><body><header class="header"><small>${escapeHtml(props.companyName)}</small><h1>${escapeHtml(title.value)}</h1><span class="sub">Validade: ${escapeHtml(expiry.value)}</span></header><div class="grid"><div><small>CLIENTE</small><p><strong>${escapeHtml(props.opportunity.client?.company_name ?? 'Cliente')}</strong></p></div><div><small>CONSULTOR RESPONSÁVEL</small><p><strong>${escapeHtml(props.opportunity.assignee?.user?.name ?? 'Não informado')}</strong></p></div></div><table><thead><tr><th>Plano / serviço</th><th>Quantidade</th><th>Valor unitário</th><th>Total mensal</th></tr></thead><tbody>${rows}</tbody></table><div class="total">Investimento mensal: ${money(monthly.value)}</div>${once.value ? `<p>Investimento único: <strong>${money(once.value)}</strong></p>` : ''}<section class="notes"><h3>Condições comerciais</h3><p>${escapeHtml(conditions.value)}</p>${notes.value ? `<h3>Observações</h3><p>${escapeHtml(notes.value)}</p>` : ''}</section></body></html>`
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const frame = document.createElement('iframe')
  frame.style.position = 'fixed'
  frame.style.width = '0'
  frame.style.height = '0'
  frame.style.border = '0'
  frame.setAttribute('title', 'Impressão da proposta')
  document.body.appendChild(frame)
  frame.onload = () => {
    try { frame.contentWindow?.focus(); frame.contentWindow?.print() }
    finally { window.setTimeout(() => { URL.revokeObjectURL(url); frame.remove() }, 60000) }
  }
  frame.src = url
}
</script>

<template>
  <section class="space-y-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div><h3 class="text-lg font-semibold">Proposta comercial</h3><p class="text-sm text-slate-500">Modelo único da empresa, com identificação automática da operadora.</p></div>
      <div class="flex flex-wrap gap-2"><button type="button" class="secondary-button w-auto" @click="printProposal">Imprimir / salvar PDF</button><button type="button" class="primary-button w-auto" :disabled="publishing || !items.length" @click="publish">{{ publishing ? 'Publicando…' : 'Publicar proposta' }}</button></div>
    </div>
    <div class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
      <article class="min-w-0 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <div class="mb-6 border-b-2 border-orange-600 pb-5">
          <p class="text-xs font-bold uppercase tracking-wider text-slate-500">{{ companyName }}</p>
          <h4 class="mt-2 text-2xl font-bold text-slate-900">{{ title }}</h4>
          <p class="mt-1 text-sm text-slate-500">Válida até {{ expiry }}</p>
        </div>
        <div class="mb-6 grid gap-4 sm:grid-cols-2">
          <div><p class="text-xs uppercase text-slate-500">Cliente</p><p class="font-semibold">{{ opportunity.client?.company_name ?? 'Cliente' }}</p></div>
          <div><p class="text-xs uppercase text-slate-500">Consultor</p><p class="font-semibold">{{ opportunity.assignee?.user?.name ?? 'Não informado' }}</p></div>
        </div>
        <div class="overflow-x-auto rounded-xl border border-stone-200">
          <table class="w-full min-w-[420px] text-left text-sm">
            <thead class="bg-stone-50 text-xs uppercase text-slate-500"><tr><th class="p-3">Plano / serviço</th><th class="p-3">Qtd.</th><th class="p-3 text-right">Mensal</th></tr></thead>
            <tbody><tr v-for="(item, index) in items" :key="item.id ?? index" class="border-t border-stone-100"><td class="p-3">{{ item.description }}</td><td class="p-3">{{ item.quantity }}</td><td class="p-3 text-right">{{ money(Number(item.monthly_unit_amount) * Number(item.quantity)) }}</td></tr></tbody>
          </table>
        </div>
        <div class="mt-4 rounded-xl bg-stone-50 p-4 text-right"><p class="text-xs text-slate-500">Investimento mensal</p><p class="text-2xl font-bold">{{ money(monthly) }}</p><p v-if="once" class="text-sm">Investimento único: {{ money(once) }}</p></div>
        <div class="mt-6 space-y-3 text-sm"><div><strong>Condições comerciais</strong><p class="mt-1 whitespace-pre-wrap text-slate-600">{{ conditions }}</p></div><div v-if="notes"><strong>Observações</strong><p class="mt-1 whitespace-pre-wrap text-slate-600">{{ notes }}</p></div></div>
      </article>
      <aside class="space-y-4 rounded-2xl border border-stone-200 bg-stone-50 p-4">
        <h4 class="font-semibold">Personalizar proposta</h4>
        <label class="block space-y-1 text-sm">Validade (dias)<input v-model.number="validityDays" type="number" min="1" max="365" class="field w-full" /></label>
        <label class="block space-y-1 text-sm">Condições comerciais<textarea v-model="conditions" rows="5" maxlength="2000" class="field w-full" /></label>
        <label class="block space-y-1 text-sm">Observações<textarea v-model="notes" rows="5" maxlength="2000" class="field w-full" /></label>
        <p class="text-xs text-slate-500">Publicar cria uma versão imutável com os valores atuais. Mudanças futuras exigem uma nova versão. A impressão acima usa o rascunho.</p>
      </aside>
    </div>
    <p v-if="failure" role="alert" class="rounded-xl bg-red-50 p-3 text-sm text-red-700">{{ failure }}</p>
    <p v-if="message" role="status" class="rounded-xl bg-green-50 p-3 text-sm text-green-800">{{ message }}</p>
    <section class="rounded-2xl border border-stone-200 bg-white p-5">
      <h4 class="mb-3 font-semibold">Histórico de versões</h4>
      <p v-if="loading" class="text-sm text-slate-500">Carregando propostas…</p>
      <p v-else-if="!versions.length" class="text-sm text-slate-500">Nenhuma proposta publicada ainda.</p>
      <div v-for="version in versions" :key="version.id" class="flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 py-3">
        <div><p class="font-semibold">Versão {{ version.version }}</p><p class="text-xs text-slate-500">Criada em {{ new Date(version.created_at).toLocaleString('pt-BR') }} · Expira em {{ new Date(version.expires_at).toLocaleDateString('pt-BR') }}</p><p v-if="version.revoked_at" class="text-xs font-semibold text-red-700">Revogada</p><p v-else-if="new Date(version.expires_at).getTime() <= Date.now()" class="text-xs font-semibold text-amber-700">Expirada</p></div>
        <div v-if="!version.revoked_at && new Date(version.expires_at).getTime() > Date.now()" class="flex flex-wrap gap-2">
          <a :href="link(version)" target="_blank" rel="noopener noreferrer" class="secondary-button w-auto">Visualizar</a>
          <button type="button" class="secondary-button w-auto" @click="copyLink(version)">Copiar link</button>
          <button type="button" class="secondary-button w-auto text-red-700" @click="revoke(version)">Revogar</button>
        </div>
      </div>
    </section>
  </section>
</template>
