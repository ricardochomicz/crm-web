<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import AsyncNotice from '@/components/ui/AsyncNotice.vue'
import { tenantApi } from '../api'
import { roleLabels, type Tenant } from '../types'
import { errorMessage } from '@/lib/feedback'
const tenantId = String(useRoute().params.tenantId)
const tenant = ref<Tenant>()
const loading = ref(true)
const error = ref('')
async function load() {
  loading.value = true
  error.value = ''
  tenant.value = undefined
  try {
    tenant.value = (await tenantApi.show(tenantId)).data
  } catch (failure) {
    error.value = errorMessage(failure)
  } finally {
    loading.value = false
  }
}
onMounted(load)
</script>
<template>
  <AppShell :tenant="tenant" title="Dados da empresa" subtitle="Configurações">
    <header class="mb-8">
      <p class="eyebrow">CONFIGURAÇÕES</p>
      <h1 class="mt-3 text-3xl font-semibold tracking-tight">Dados da empresa</h1>
      <p class="mt-3 text-sm text-slate-500">Informações do seu espaço de trabalho.</p>
    </header>
    <AsyncNotice :loading="loading" :error="error" @retry="load" />
    <section v-if="!loading && tenant" class="rounded-2xl border border-stone-200 bg-white p-7">
      <dl class="grid gap-7 sm:grid-cols-3">
        <div>
          <dt class="text-xs text-slate-500">Empresa</dt>
          <dd class="mt-2 font-semibold">{{ tenant.name }}</dd>
        </div>
        <div>
          <dt class="text-xs text-slate-500">Tipo de cadastro</dt>
          <dd class="mt-2">{{ tenant.type === 'PJ' ? 'Pessoa jurídica' : 'Pessoa física' }}</dd>
        </div>
        <div>
          <dt class="text-xs text-slate-500">Seu cargo</dt>
          <dd class="mt-2">{{ roleLabels[tenant.role] }}</dd>
        </div>
      </dl>
    </section>
  </AppShell>
</template>
