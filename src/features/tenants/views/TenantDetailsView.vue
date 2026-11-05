<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import AsyncNotice from '@/components/ui/AsyncNotice.vue'
import FormField from '@/components/ui/FormField.vue'
import { tenantApi } from '../api'
import { can, roleLabels, type CompanyDetails } from '../types'
import { errorMessage } from '@/lib/feedback'
import { toast } from '@/services/toast'
import { ApiError } from '@/lib/http'
const route = useRoute()
const tenantId = computed(() => String(route.params.tenantId))
const tenant = ref<CompanyDetails>()
const loading = ref(true)
const loadError = ref('')
const error = ref('')
const success = ref('')
const busy = ref(false)
const uploadingLogo = ref(false)
const logoInput = ref<HTMLInputElement | null>(null)
const errors = ref<Record<string, string>>({})
const form = reactive({ name: '', trade_name: '', email: '', phone: '', timezone: '' })
const editable = computed(
  () => can(tenant.value, 'company.update') && !!tenant.value?.access?.allows_operational_writes,
)
function reset() {
  if (!tenant.value) return
  const company = tenant.value
  Object.assign(form, {
    name: company.name,
    trade_name: company.trade_name ?? '',
    email: company.email,
    phone: company.phone ?? '',
    timezone: company.timezone,
  })
  errors.value = {}
  error.value = ''
  success.value = ''
}
async function load() {
  const id = tenantId.value
  loading.value = true
  loadError.value = ''
  tenant.value = undefined
  success.value = ''
  try {
    const result = await tenantApi.details(id)
    if (id !== tenantId.value) return
    tenant.value = result.data
    reset()
  } catch (failure) {
    if (id === tenantId.value) loadError.value = errorMessage(failure)
  } finally {
    if (id === tenantId.value) loading.value = false
  }
}
async function save() {
  if (busy.value || !editable.value) return
  errors.value = {}
  error.value = ''
  success.value = ''
  if (!form.name.trim()) errors.value.name = 'Informe o nome da empresa.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
    errors.value.email = 'Informe um e-mail válido.'
  if (!form.timezone.trim()) errors.value.timezone = 'Informe o fuso horário.'
  if (Object.keys(errors.value).length) {
    await nextTick()
    document.querySelector<HTMLInputElement>('[aria-invalid="true"]')?.focus()
    return
  }
  const id = tenantId.value
  const data = {
    name: form.name.trim(),
    trade_name: form.trade_name.trim() || null,
    email: form.email.trim().toLowerCase(),
    phone: form.phone.trim() || null,
    timezone: form.timezone.trim(),
  }
  busy.value = true
  try {
    await tenantApi.update(id, data)
    if (id !== tenantId.value || !tenant.value) return
    tenant.value = { ...tenant.value, ...data }
    reset()
    success.value = 'Dados da empresa atualizados com sucesso.'
    toast.success(success.value)
  } catch (failure) {
    if (id !== tenantId.value) return
    error.value = errorMessage(failure)
    if (failure instanceof ApiError) {
      errors.value = Object.fromEntries(
        Object.entries(failure.errors).map(([key, values]) => [
          key,
          values[0] ?? 'Confira este campo.',
        ]),
      )
    }
    await nextTick()
    document.getElementById('company-error')?.focus()
  } finally {
    busy.value = false
  }
}
async function uploadLogo(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file || !editable.value || uploadingLogo.value) return
  error.value = ''
  success.value = ''
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) {
    error.value = 'Selecione uma imagem PNG, JPG ou WebP de até 2 MB.'
    input.value = ''
    return
  }
  uploadingLogo.value = true
  try {
    const response = await tenantApi.uploadLogo(tenantId.value, file)
    if (tenant.value) tenant.value = { ...tenant.value, logo_url: response.data.logo_url + '?v=' + Date.now() }
    success.value = 'Logo atualizada com sucesso.'
    toast.success(success.value)
  } catch (failure) {
    error.value = errorMessage(failure)
  } finally {
    uploadingLogo.value = false
    input.value = ''
  }
}
watch(tenantId, load, { immediate: true })
</script>
<template>
  <AppShell :tenant="tenant" title="Dados da empresa" subtitle="Configurações">
    <header class="mb-8">
      <p class="eyebrow">CONFIGURAÇÕES</p>
      <h1 class="mt-3 text-3xl font-semibold tracking-tight">Dados da empresa</h1>
      <p class="mt-3 text-sm text-slate-500">
        Mantenha as informações do seu espaço de trabalho atualizadas.
      </p>
    </header>
    <AsyncNotice :loading="loading" :error="loadError" @retry="load" />
    <section
      v-if="!loading && tenant"
      class="max-w-3xl rounded-2xl border border-stone-200 bg-white p-6 sm:p-9"
    >
      <dl class="mb-8 grid gap-6 sm:grid-cols-3">
        <div>
          <dt class="text-xs text-slate-500">Tipo de cadastro</dt>
          <dd class="mt-2">{{ tenant.type === 'PJ' ? 'Pessoa jurídica' : 'Pessoa física' }}</dd>
        </div>
        <div>
          <dt class="text-xs text-slate-500">{{ tenant.type === 'PJ' ? 'CNPJ' : 'CPF' }}</dt>
          <dd class="mt-2">{{ tenant.document }}</dd>
        </div>
        <div>
          <dt class="text-xs text-slate-500">Seu cargo</dt>
          <dd class="mt-2">{{ roleLabels[tenant.role] }}</dd>
        </div>
      </dl>
      <p v-if="!editable" class="mb-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
        {{
          !can(tenant, 'company.update')
            ? 'Você tem acesso somente à consulta dos dados da empresa.'
            : 'A assinatura atual não permite alterações nos dados da empresa.'
        }}
      </p>
      <p
        v-if="success"
        role="status"
        class="mb-6 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800"
      >
        {{ success }}
      </p>
      <p
        v-if="error"
        id="company-error"
        tabindex="-1"
        role="alert"
        class="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-800"
      >
        {{ error }}
      </p>
      <div class="mb-8 grid gap-3">
        <label class="text-sm font-semibold">Logo da empresa</label>
        <img v-if="tenant.logo_url" :src="tenant.logo_url" alt="Logo da empresa" class="h-24 w-40 rounded-xl border border-stone-200 object-contain p-2" />
        <p v-else class="text-sm text-slate-500">Nenhuma logo cadastrada.</p>
        <input ref="logoInput" type="file" accept="image/png,image/jpeg,image/webp" class="hidden" :disabled="!editable || uploadingLogo" @change="uploadLogo" />
        <button v-if="editable" type="button" class="secondary-button w-fit" :disabled="uploadingLogo || busy" @click="logoInput?.click()">
          {{ uploadingLogo ? 'Enviando imagem…' : tenant.logo_url ? 'Substituir logo' : 'Enviar logo' }}
        </button>
        <p class="text-xs text-slate-500">PNG, JPG ou WebP, até 2 MB. A mesma logo será utilizada pela matriz e filiais.</p>
      </div>
      <form novalidate @submit.prevent="save">
        <fieldset :disabled="busy || !editable" class="grid gap-6">
          <legend class="sr-only">Informações da empresa</legend>
          <FormField
            id="company-name"
            v-model="form.name"
            label="Nome da empresa ou do profissional"
            maxlength="180"
            required
            :error="errors.name"
          />
          <FormField
            v-if="tenant.type === 'PJ'"
            id="trade-name"
            v-model="form.trade_name"
            label="Nome fantasia (opcional)"
            maxlength="180"
            :error="errors.trade_name"
          />
          <div class="grid gap-6 sm:grid-cols-2">
            <FormField
              id="company-email"
              v-model="form.email"
              label="E-mail de contato"
              type="email"
              autocomplete="email"
              maxlength="254"
              required
              :error="errors.email"
            />
            <FormField
              id="company-phone"
              v-model="form.phone"
              label="Telefone (opcional)"
              type="tel"
              autocomplete="tel"
              maxlength="20"
              :error="errors.phone"
            />
          </div>
          <FormField
            id="company-timezone"
            v-model="form.timezone"
            label="Fuso horário"
            maxlength="64"
            required
            hint="Exemplo: America/Sao_Paulo (Brasília)."
            :error="errors.timezone"
          />
          <div v-if="editable" class="flex flex-wrap justify-end gap-3">
            <button type="button" class="secondary-button" @click="reset">
              Descartar alterações
            </button>
            <button type="submit" class="primary-button w-auto">
              <span v-if="busy" class="spinner" />{{ busy ? 'Salvando…' : 'Salvar alterações' }}
            </button>
          </div>
        </fieldset>
      </form>
    </section>
  </AppShell>
</template>
