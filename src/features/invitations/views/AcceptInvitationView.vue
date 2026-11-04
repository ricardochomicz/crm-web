<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AuthLayout from '@/features/auth/components/AuthLayout.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import AsyncNotice from '@/components/ui/AsyncNotice.vue'
import { useAuthStore } from '@/features/auth/store'
import { invitationApi } from '../api'
import { tenantApi } from '@/features/tenants/api'
import { ApiError } from '@/lib/http'
import { errorMessage } from '@/lib/feedback'
const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const token = computed(() => new URLSearchParams(route.hash.slice(1)).get('token') ?? '')
const validToken = computed(() => /^[A-Za-z0-9]{64}$/.test(token.value))
const loading = ref(true)
const available = ref(false)
const error = ref('')
const busy = ref(false)
const acceptedTenant = ref('')
const loginLink = computed(() => ({
  path: '/login',
  query: { continue: 'invitation' },
  hash: `#token=${token.value}`,
}))
async function load() {
  loading.value = true
  error.value = ''
  try {
    available.value = validToken.value && (await invitationApi.show(token.value)).data.is_available
  } catch (failure) {
    if (failure instanceof ApiError && failure.status === 410) available.value = false
    else error.value = errorMessage(failure)
  } finally {
    loading.value = false
  }
}
async function accept() {
  if (busy.value) return
  busy.value = true
  error.value = ''
  try {
    if (!acceptedTenant.value)
      acceptedTenant.value = (await invitationApi.accept(token.value)).data.tenant_id
    await tenantApi.select(acceptedTenant.value)
    await router.replace(`/empresas/${acceptedTenant.value}`)
  } catch (failure) {
    error.value = errorMessage(failure)
  } finally {
    busy.value = false
  }
}
async function switchAccount() {
  if (busy.value) return
  busy.value = true
  error.value = ''
  try {
    await auth.logout()
    await router.replace(loginLink.value)
  } catch (failure) {
    error.value = errorMessage(failure)
  } finally {
    busy.value = false
  }
}
onMounted(load)
</script>
<template>
  <AuthLayout>
    <span
      class="mb-6 flex size-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-700"
      ><AppIcon name="mail" class="size-7"
    /></span>
    <p class="eyebrow">UMA NOVA CONEXÃO</p>
    <h1 class="auth-title">Sua equipe está<br />esperando você.</h1>
    <p class="mb-7 mt-4 text-sm leading-7 text-slate-500">
      Um convite é o primeiro passo para construir algo juntos.
    </p>
    <AsyncNotice v-if="loading" loading label="Conferindo seu convite…" />
    <template v-else>
      <p
        v-if="error"
        role="alert"
        class="mb-5 rounded-xl bg-red-50 p-4 text-sm leading-6 text-red-800"
      >
        {{ error
        }}<button v-if="!available" class="mt-2 block underline" @click="load">
          Tentar novamente
        </button>
      </p>
      <template v-if="available">
        <template v-if="auth.user"
          ><p
            class="mb-6 rounded-xl border border-stone-200 bg-white p-4 text-sm leading-6 text-slate-600"
          >
            Você está conectado como <strong class="break-all">{{ auth.user.email }}</strong
            >. Esse deve ser o e-mail que recebeu o convite.
          </p>
          <button class="primary-button" :disabled="busy" @click="accept">
            <span v-if="busy" class="spinner" />{{
              busy
                ? 'Só um instante…'
                : acceptedTenant
                  ? 'Abrir minha empresa'
                  : 'Aceitar convite e entrar'
            }}<AppIcon v-if="!busy" class="size-4" /></button
          ><button
            class="mt-5 w-full text-center text-sm text-slate-500 underline underline-offset-4"
            :disabled="busy"
            @click="switchAccount"
          >
            Entrar com outra conta
          </button></template
        >
        <template v-else
          ><p class="mb-6 text-sm leading-7 text-slate-500">
            Entre ou crie uma conta com o mesmo e-mail que recebeu o convite. Seu link será
            preservado.
          </p>
          <RouterLink :to="loginLink" class="primary-button"
            >Entrar para aceitar<AppIcon class="size-4" /></RouterLink
          ><RouterLink
            :to="{ ...loginLink, path: '/register' }"
            class="secondary-button mt-3 w-full"
            >Criar minha conta</RouterLink
          ></template
        >
      </template>
      <div v-else-if="!error" class="rounded-2xl border border-stone-200 bg-white p-6">
        <h2 class="font-semibold">Este convite não está disponível</h2>
        <p class="mt-3 text-sm leading-7 text-slate-500">
          O link pode ter expirado, sido revogado, substituído ou já aceito. Peça um novo convite ao
          responsável pela empresa.
        </p>
        <RouterLink to="/app" class="secondary-button mt-5">Ir para minha conta</RouterLink>
      </div>
    </template>
  </AuthLayout>
</template>
