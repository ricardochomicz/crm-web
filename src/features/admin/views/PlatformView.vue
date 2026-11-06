<script setup lang="ts">
import { onMounted, ref } from 'vue'
import AppShell from '@/components/layout/AppShell.vue'
import AsyncNotice from '@/components/ui/AsyncNotice.vue'
import ListFilters from '@/components/ui/ListFilters.vue'
import ListTable from '@/components/ui/ListTable.vue'
import PagePagination from '@/components/ui/PagePagination.vue'
import SearchSelect from '@/components/ui/SearchSelect.vue'
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

const statusOptions = [
  { value: '', label: 'Todas as situações' },
  ...Object.entries(labels).map(([value, label]) => ({ value, label })),
]

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

function clearFilters() {
  name.value = ''
  status.value = ''
  void load(1)
}

onMounted(() => void load())
</script>

<template>
  <AppShell title="Administração da plataforma" subtitle="Acesso administrativo">
    <header class="mb-7">
      <p class="eyebrow">VISÃO DA PLATAFORMA</p>
      <h1 class="mt-3 text-3xl font-semibold tracking-tight">Empresas conectadas.</h1>
      <p class="mt-2 text-sm text-slate-500">
        Consulte os espaços cadastrados, seus planos e a disponibilidade de acesso.
      </p>
    </header>

    <AsyncNotice :loading="loading && !result" :error="error" @retry="load()" />

    <template v-if="!error">
      <ListFilters
        :columns="2"
        :busy="loading"
        :count-label="`${result?.total ?? 0} empresa(s) encontrada(s)`"
        @search="load(1)"
        @clear="clearFilters"
      >
        <label class="text-xs font-semibold text-slate-600">
          Nome da empresa
          <input
            v-model="name"
            type="search"
            placeholder="Buscar por nome…"
            maxlength="180"
            class="field"
          />
        </label>
        <label class="text-xs font-semibold text-slate-600">
          Situação
          <SearchSelect v-model="status" :options="statusOptions" />
        </label>
      </ListFilters>

      <section class="overflow-hidden rounded-2xl border border-stone-200 bg-white">
        <ListTable min-width="640px" :busy="loading">
          <thead class="bg-stone-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th scope="col" class="px-6 py-4">Empresa</th>
              <th scope="col" class="px-6 py-4">Situação</th>
              <th scope="col" class="px-6 py-4">Pessoas</th>
              <th scope="col" class="px-6 py-4">Plano</th>
              <th scope="col" class="px-6 py-4">Alterações</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-stone-100">
            <tr v-for="tenant in result?.data ?? []" :key="tenant.id" class="hover:bg-stone-50/70">
              <td class="px-6 py-4">
                <p class="font-semibold text-slate-800">{{ tenant.name }}</p>
                <span class="text-xs text-slate-400">
                  {{ tenant.type === 'PJ' ? 'Pessoa jurídica' : 'Pessoa física' }}
                </span>
              </td>
              <td class="px-6 py-4">
                <span
                  class="rounded-full px-2.5 py-1 text-xs font-semibold"
                  :class="
                    tenant.status === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-amber-50 text-amber-800'
                  "
                >
                  {{ labels[tenant.status] ?? tenant.status }}
                </span>
              </td>
              <td class="px-6 py-4 text-slate-600">{{ tenant.users_count }}</td>
              <td class="px-6 py-4 text-slate-600">
                {{ tenant.subscription?.plan_name ?? 'Sem assinatura' }}
              </td>
              <td class="px-6 py-4 text-xs text-slate-500">
                {{
                  tenant.status === 'ACTIVE' && tenant.subscription?.allows_operational_writes
                    ? 'Permitidas'
                    : 'Bloqueadas'
                }}
              </td>
            </tr>
            <tr v-if="!result?.data?.length && !loading">
              <td colspan="5" class="px-6 py-12 text-center text-slate-500">
                Nenhuma empresa encontrada com estes filtros.
              </td>
            </tr>
          </tbody>
        </ListTable>
      </section>

      <PagePagination
        v-if="result"
        :page="result.current_page"
        :last-page="result.last_page"
        :total="result.total"
        :busy="loading"
        @change="load"
      />
    </template>
  </AppShell>
</template>
