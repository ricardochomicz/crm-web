<script setup lang="ts">
import { ref, watch } from 'vue'
import { request } from '@/lib/http'
import { errorMessage } from '@/lib/feedback'

type Document = { id: string; category: string; original_name: string; size_bytes: number; created_at: string }
const props = defineProps<{ tenantId: string; clientId: string; canUpload: boolean }>()
const documents = ref<Document[]>([])
const category = ref('contrato_social')
const file = ref<File | null>(null)
const loading = ref(false)
const uploading = ref(false)
const error = ref('')
const base = () => '/api/v1/tenants/' + encodeURIComponent(props.tenantId) + '/clients/' + encodeURIComponent(props.clientId) + '/documents'
const categories: Record<string, string> = { contrato_social: 'Contrato social', fatura: 'Fatura', documento: 'Documento', outro: 'Outro' }
async function load() {
  if (!props.clientId) return
  loading.value = true
  error.value = ''
  try { documents.value = (await request<{ data: Document[] }>(base())).data }
  catch (e) { error.value = errorMessage(e) }
  finally { loading.value = false }
}
watch(() => [props.tenantId, props.clientId], () => { void load() }, { immediate: true })
function selectFile(event: Event) {
  file.value = (event.target as HTMLInputElement).files?.[0] ?? null
}
async function upload() {
  if (!file.value || uploading.value) return
  uploading.value = true
  error.value = ''
  try {
    const data = new FormData()
    data.append('category', category.value)
    data.append('file', file.value)
    await request(base(), { method: 'POST', body: data })
    file.value = null
    const input = document.getElementById('client-document-file') as HTMLInputElement | null
    if (input) input.value = ''
    await load()
  } catch (e) { error.value = errorMessage(e) }
  finally { uploading.value = false }
}
async function download(doc: Document) {
  error.value = ''
  try {
    const response = await fetch((import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '') + base() + '/' + encodeURIComponent(doc.id) + '/download', { credentials: 'include' })
    if (!response.ok) throw new Error('Não foi possível baixar o documento.')
    const url = URL.createObjectURL(await response.blob())
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = doc.original_name
    anchor.click()
    URL.revokeObjectURL(url)
  } catch (e) { error.value = errorMessage(e) }
}
</script>

<template>
  <section class="space-y-5">
    <header>
      <h3 class="text-lg font-semibold text-slate-800">Anexos do cliente</h3>
      <p class="mt-1 text-sm text-slate-500">Documentos compartilhados entre as oportunidades deste cliente, somente nesta empresa.</p>
    </header>
    <form v-if="canUpload" class="grid gap-3 rounded-xl border border-stone-200 bg-stone-50 p-4 sm:grid-cols-[200px_minmax(0,1fr)_auto] sm:items-end" @submit.prevent="upload">
      <label class="text-sm font-semibold text-slate-700">Tipo de documento
        <select v-model="category" class="field mt-2 w-full">
          <option v-for="(label, value) in categories" :key="value" :value="value">{{ label }}</option>
        </select>
      </label>
      <label class="text-sm font-semibold text-slate-700">Arquivo (até 10 MB)
        <input id="client-document-file" type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp" class="mt-2 block w-full text-sm" @change="selectFile" />
      </label>
      <button type="submit" class="primary-button w-auto" :disabled="!file || uploading">{{ uploading ? 'Enviando…' : 'Anexar documento' }}</button>
    </form>
    <p v-if="error" class="text-sm text-rose-700" role="alert">{{ error }}</p>
    <p v-if="loading" class="text-sm text-slate-500">Carregando anexos…</p>
    <p v-else-if="!documents.length" class="rounded-xl border border-dashed border-stone-200 p-6 text-sm text-slate-500">Nenhum documento anexado a este cliente.</p>
    <div v-else class="overflow-hidden rounded-xl border border-stone-200">
      <div v-for="doc in documents" :key="doc.id" class="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 p-4 last:border-0">
        <div class="min-w-0">
          <p class="break-all text-sm font-semibold text-slate-800">{{ doc.original_name }}</p>
          <p class="mt-1 text-xs text-slate-500">{{ categories[doc.category] || doc.category }} · {{ (doc.size_bytes / 1024).toFixed(0) }} KB · {{ new Date(doc.created_at).toLocaleDateString('pt-BR') }}</p>
        </div>
        <button type="button" class="secondary-button w-auto" @click="download(doc)">Baixar</button>
      </div>
    </div>
  </section>
</template>
