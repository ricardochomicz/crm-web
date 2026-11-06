<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import AsyncNotice from '@/components/ui/AsyncNotice.vue'
import FormField from '@/components/ui/FormField.vue'
import { can, roleLabels } from '../types'
import { useTenantDetails } from '../composables/useTenantDetails'

const route = useRoute()
const tenantId = computed(() => String(route.params.tenantId))
const {
  tenant, loading, loadError, busy, uploadingLogo, logoInput, errors, form,
  editable, reset, load, save, uploadLogo,
} = useTenantDetails(tenantId)
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
