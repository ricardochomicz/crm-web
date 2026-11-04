<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import AsyncNotice from '@/components/ui/AsyncNotice.vue'
import { tenantApi } from '../api'
import { type Tenant } from '../types'
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
  <AppShell :tenant="tenant" :title="tenant?.name ?? 'Início'" subtitle="Visão geral">
    <header class="mb-8">
      <p class="eyebrow">INÍCIO</p>
      <h1 class="mt-3 text-3xl font-semibold tracking-tight">
        {{ tenant?.name ?? 'Seu espaço de trabalho' }}
      </h1>
      <p class="mt-3 text-sm text-slate-500">Uma visão do seu negócio, em um só lugar.</p>
    </header>
    <AsyncNotice :loading="loading" :error="error" @retry="load" />
    <section
      v-if="!loading && tenant"
      class="rounded-3xl border border-stone-200 bg-white px-7 py-14 text-center sm:py-20"
    >
      <span
        class="inline-flex rounded-full bg-orange-50 px-4 py-2 text-xs font-semibold text-orange-700"
        >Dashboard comercial em breve</span
      >
      <h2 class="mt-6 text-2xl font-semibold tracking-tight">
        Suas próximas conquistas começam aqui.
      </h2>
      <p class="mx-auto mt-4 max-w-lg text-sm leading-7 text-slate-500">
        Este espaço reunirá os indicadores de vendas, metas e atividades. Enquanto isso, use o menu
        para acessar as áreas disponíveis da sua empresa.
      </p>
    </section>
  </AppShell>
</template>
