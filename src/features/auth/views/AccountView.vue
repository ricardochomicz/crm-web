<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../store'
import BrandLogo from '@/components/ui/BrandLogo.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
const auth = useAuthStore()
const router = useRouter()
const busy = ref(false)
const error = ref('')
async function logout() {
  busy.value = true
  error.value = ''
  try {
    await auth.logout()
    await router.replace('/login')
  } catch (failure) {
    error.value = failure instanceof Error ? failure.message : 'Não foi possível sair.'
  } finally {
    busy.value = false
  }
}
</script>
<template>
  <div class="min-h-dvh bg-stone-50">
    <header
      class="flex flex-wrap items-center justify-between gap-5 border-b border-stone-200 bg-white px-6 py-5 sm:px-12"
    >
      <BrandLogo /><button
        class="inline-flex items-center gap-2 rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-medium hover:bg-stone-50 disabled:opacity-50"
        :disabled="busy"
        @click="logout"
      >
        <AppIcon name="logout" class="size-4" />{{ busy ? 'Saindo…' : 'Sair da conta' }}
      </button>
    </header>
    <main id="main-content" class="mx-auto max-w-4xl px-6 py-16 sm:py-24">
      <p class="eyebrow">SEU ESPAÇO NO TELECOMHUB</p>
      <h1 class="mt-4 text-4xl font-semibold tracking-tight text-slate-900">
        Olá, {{ auth.user?.name.split(' ')[0] }}<span class="text-orange-600">.</span>
      </h1>
      <p class="mt-4 text-slate-500">Que bom ter você por aqui. Sua conta está conectada.</p>
      <p v-if="error" class="mt-5 rounded-xl bg-red-50 p-4 text-red-700" role="alert">
        {{ error }}
      </p>
      <section class="mt-10 rounded-3xl border border-stone-200 bg-white p-7 sm:p-10">
        <div
          class="mb-6 flex size-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-600"
        >
          <AppIcon name="check" class="size-6" />
        </div>
        <h2 class="text-xl font-semibold">Tudo pronto para começar</h2>
        <p class="mt-3 max-w-lg text-sm leading-7 text-slate-500">
          Este é o seu espaço de acesso. Se você recebeu um convite para uma empresa, abra o link
          enviado ao seu e-mail para continuar.
        </p>
        <dl class="mt-7 grid gap-5 border-t border-stone-100 pt-6 sm:grid-cols-2">
          <div>
            <dt class="text-xs text-slate-500">Nome</dt>
            <dd class="mt-1 font-medium">{{ auth.user?.name }}</dd>
          </div>
          <div>
            <dt class="text-xs text-slate-500">E-mail da conta</dt>
            <dd class="mt-1 break-all font-medium">{{ auth.user?.email }}</dd>
          </div>
        </dl>
      </section>
    </main>
  </div>
</template>
