<script setup lang="ts">
import AppShell from '@/components/layout/AppShell.vue'
import AsyncNotice from '@/components/ui/AsyncNotice.vue'
import PagePagination from '@/components/ui/PagePagination.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import { roleLabels } from '../types'
import { useTenantAccess } from '../composables/useTenantAccess'

const { auth, result, loading, error, selecting, selectionError, enter, load } = useTenantAccess()
</script>
<template>
  <AppShell title="Minhas empresas">
    <div class="mb-9 flex flex-wrap items-end justify-between gap-5">
      <div>
        <p class="eyebrow">UM NOVO DIA, NOVAS POSSIBILIDADES</p>
        <h1 class="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
          Olá, {{ auth.user?.name.split(' ')[0] }}<span class="text-orange-600">.</span>
        </h1>
        <p class="mt-3 text-sm leading-6 text-slate-500">
          Escolha seu espaço de trabalho e vamos em frente.
        </p>
      </div>
      <RouterLink
        v-if="result?.total && !result.data.some((tenant) => tenant.role === 'OWNER')"
        to="/empresas/nova"
        class="secondary-button"
        >+ Criar empresa</RouterLink
      >
    </div>
    <AsyncNotice :loading="loading" :error="error" @retry="load()" />
    <p
      v-if="selectionError"
      role="alert"
      class="mb-5 rounded-xl bg-red-50 p-4 text-sm text-red-800"
    >
      {{ selectionError }}
    </p>
    <template v-if="!loading && !error && result">
      <section
        v-if="result.total === 0"
        class="overflow-hidden rounded-3xl border border-stone-200 bg-white lg:grid lg:grid-cols-[1.3fr_1fr]"
      >
        <div class="p-7 sm:p-12">
          <span
            class="mb-6 flex size-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-600"
            ><AppIcon name="grid" class="size-7"
          /></span>
          <h2 class="max-w-md text-3xl font-semibold leading-tight tracking-tight">
            Sua próxima conquista<br />precisa de um espaço.
          </h2>
          <p class="mt-4 max-w-md text-sm leading-7 text-slate-500">
            Você ainda não tem acesso a uma empresa ativa. Crie a sua e reúna as pessoas que vão
            construir essa história com você.
          </p>
          <RouterLink to="/empresas/nova" class="primary-button mt-8 max-w-xs"
            >Criar minha empresa<AppIcon class="size-4"
          /></RouterLink>
          <p class="mt-3 text-xs text-slate-400">
            Escolha seu plano e comece com 14 dias de teste.
          </p>
        </div>
        <div
          class="flex flex-col justify-center border-t border-stone-100 bg-[#f3f5f0] p-7 sm:p-12 lg:border-l lg:border-t-0"
        >
          <AppIcon name="mail" class="mb-5 size-8 text-emerald-700" />
          <h3 class="text-xl font-semibold">Vai entrar em uma equipe?</h3>
          <p class="mt-3 text-sm leading-7 text-slate-500">
            Abra o link do convite enviado ao seu e-mail. Você poderá aceitar usando esta conta,
            desde que o endereço convidado seja o mesmo.
          </p>
          <p
            class="mt-6 break-all rounded-xl border border-white bg-white/70 p-3 text-xs text-slate-600"
          >
            Sua conta: {{ auth.user?.email }}
          </p>
          <p class="mt-4 text-xs leading-6 text-slate-400">
            Já participava de uma empresa? Peça ao responsável para verificar se seu acesso está
            ativo.
          </p>
        </div>
      </section>
      <template v-else
        ><div class="mb-4 flex items-center justify-between">
          <h2 class="text-sm font-semibold text-slate-700">Seus espaços</h2>
          <span class="text-xs text-slate-400"
            >{{ result.total }}
            {{ result.total === 1 ? 'empresa disponível' : 'empresas disponíveis' }}</span
          >
        </div>
        <div class="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <button
            v-for="tenant in result.data"
            :key="tenant.id"
            class="group rounded-2xl border border-stone-200 bg-white p-6 text-left transition hover:-translate-y-1 hover:border-orange-300 hover:shadow-lg disabled:cursor-wait disabled:opacity-60 motion-reduce:transform-none"
            :disabled="!!selecting"
            @click="enter(tenant)"
          >
            <div class="flex items-center justify-between">
              <span
                class="flex size-12 items-center justify-center rounded-2xl bg-[#f3f5f0] text-xl font-semibold text-emerald-800"
                >{{ tenant.name.slice(0, 1).toUpperCase() }}</span
              ><span
                class="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700"
                >Ativa</span
              >
            </div>
            <h3 class="mt-5 truncate text-lg font-semibold">{{ tenant.name }}</h3>
            <p class="mt-2 text-xs text-slate-500">
              {{ roleLabels[tenant.role] }} ·
              {{ tenant.type === 'PJ' ? 'Pessoa jurídica' : 'Pessoa física' }}
            </p>
            <div
              class="mt-7 flex items-center justify-between border-t border-stone-100 pt-4 text-xs font-semibold text-orange-700"
            >
              <span>{{ selecting === tenant.id ? 'Abrindo seu espaço…' : 'Acessar empresa' }}</span
              ><AppIcon class="size-4 transition group-hover:translate-x-1" />
            </div>
          </button>
        </div>
        <PagePagination
          :page="result.current_page"
          :last-page="result.last_page"
          :total="result.total"
          :busy="!!selecting"
          @change="load"
      /></template>
      <RouterLink
        v-if="auth.user?.is_platform_admin"
        to="/admin"
        class="mt-7 flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-[#202a26] p-6 text-white"
        ><div>
          <p class="text-sm font-semibold">Administração da plataforma</p>
          <p class="mt-1 text-xs text-slate-300">
            Consulte empresas e acompanhe seus acessos e assinaturas.
          </p>
        </div>
        <AppIcon class="size-5 shrink-0"
      /></RouterLink>
    </template>
  </AppShell>
</template>
