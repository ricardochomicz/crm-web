<script setup lang="ts">
import { onMounted, ref } from 'vue'
import AppShell from '@/components/layout/AppShell.vue'
import AsyncNotice from '@/components/ui/AsyncNotice.vue'
import PagePagination from '@/components/ui/PagePagination.vue'
import { adminApi, type PlatformTenant } from '../api'
import type { Page } from '@/features/tenants/types'
import { errorMessage } from '@/lib/feedback'
const result = ref<Page<PlatformTenant>>()
const name = ref('')
const status = ref('')
const loading = ref(true)
const error = ref('')
const labels: Record<string, string> = {
  ACTIVE: 'Ativa',
  SUSPENDED: 'Suspensa',
  CANCELLED: 'Cancelada',
}
async function load(page = 1) {
  loading.value = true
  error.value = ''
  try {
    result.value = await adminApi.tenants(page, name.value, status.value)
  } catch (failure) {
    error.value = errorMessage(failure)
  } finally {
    loading.value = false
  }
}
onMounted(() => load())
</script>
<template>
  <AppShell title="Administração da plataforma" subtitle="Acesso administrativo">
    <p class="eyebrow">VISÃO DA PLATAFORMA</p>
    <h1 class="mt-3 text-3xl font-semibold tracking-tight">Empresas conectadas.</h1>
    <p class="mt-3 text-sm text-slate-500">
      Consulte os espaços cadastrados, seus planos e a disponibilidade de acesso.
    </p>
    <form
      class="my-8 flex flex-wrap items-end gap-4 rounded-2xl border border-stone-200 bg-white p-5"
      @submit.prevent="load()"
    >
      <div class="min-w-48 flex-1">
        <label for="company-search" class="mb-2 block text-xs font-semibold text-slate-600"
          >Nome da empresa</label
        ><input
          id="company-search"
          v-model="name"
          type="search"
          placeholder="Buscar por nome…"
          maxlength="180"
          class="field"
        />
      </div>
      <div>
        <label for="status-filter" class="mb-2 block text-xs font-semibold text-slate-600"
          >Situação</label
        ><select id="status-filter" v-model="status" class="field">
          <option value="">Todas</option>
          <option v-for="(label, value) in labels" :key="value" :value="value">{{ label }}</option>
        </select>
      </div>
      <button class="primary-button w-auto" :disabled="loading">
        {{ loading ? 'Buscando…' : 'Filtrar empresas' }}
      </button>
    </form>
    <AsyncNotice :loading="loading" :error="error" @retry="load()" />
    <template v-if="!loading && !error && result"
      ><p class="mb-4 text-xs text-slate-500">{{ result.total }} empresas encontradas</p>
      <div class="overflow-x-auto rounded-2xl border border-stone-200 bg-white">
        <table class="w-full min-w-[640px] text-left text-sm">
          <caption class="sr-only">
            Empresas da plataforma
          </caption>
          <thead class="border-b border-stone-100 bg-stone-50 text-xs text-slate-500">
            <tr>
              <th scope="col" class="px-6 py-4 font-medium">Empresa</th>
              <th scope="col" class="px-6 py-4 font-medium">Situação</th>
              <th scope="col" class="px-6 py-4 font-medium">Pessoas</th>
              <th scope="col" class="px-6 py-4 font-medium">Plano</th>
              <th scope="col" class="px-6 py-4 font-medium">Alterações</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-stone-100">
            <tr v-for="tenant in result.data" :key="tenant.id">
              <th scope="row" class="px-6 py-5 font-medium">
                {{ tenant.name
                }}<span class="mt-1 block text-xs font-normal text-slate-400">{{
                  tenant.type === 'PJ' ? 'Pessoa jurídica' : 'Pessoa física'
                }}</span>
              </th>
              <td class="px-6 py-5">
                <span
                  class="rounded-full px-2.5 py-1 text-xs"
                  :class="
                    tenant.status === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-amber-50 text-amber-800'
                  "
                  >{{ labels[tenant.status] ?? tenant.status }}</span
                >
              </td>
              <td class="px-6 py-5">{{ tenant.users_count }}</td>
              <td class="px-6 py-5">{{ tenant.subscription?.plan_name ?? 'Sem assinatura' }}</td>
              <td class="px-6 py-5 text-xs text-slate-500">
                {{
                  tenant.status === 'ACTIVE' && tenant.subscription?.allows_operational_writes
                    ? 'Permitidas'
                    : 'Bloqueadas'
                }}
              </td>
            </tr>
            <tr v-if="!result.data.length">
              <td colspan="5" class="px-6 py-12 text-center text-slate-500">
                Nenhuma empresa encontrada com estes filtros.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <PagePagination
        :page="result.current_page"
        :last-page="result.last_page"
        :total="result.total"
        @change="load"
    /></template>
  </AppShell>
</template>
