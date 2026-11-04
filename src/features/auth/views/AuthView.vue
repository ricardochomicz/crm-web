<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AuthLayout from '../components/AuthLayout.vue'
import FormField from '@/components/ui/FormField.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import { useAuthStore } from '../store'
import { authApi } from '../api'
import { ApiError } from '@/lib/http'
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const mode = computed(() => String(route.meta.authMode ?? 'login'))
const form = reactive({ name: '', email: '', password: '', password_confirmation: '' })
const busy = ref(false)
const success = ref(false)
const errors = ref<Record<string, string>>({})
const alert = ref('')
const alertElement = ref<HTMLElement>()
const copy = computed(
  () =>
    ({
      login: {
        eyebrow: 'BOM TER VOCÊ DE VOLTA',
        title: 'Seu próximo passo\ncomeça aqui.',
        description: 'Entre na sua conta e continue de onde parou.',
        button: 'Entrar na minha conta',
      },
      register: {
        eyebrow: 'VAMOS CONSTRUIR JUNTOS',
        title: 'Boas conexões\ncomeçam com você.',
        description: 'Crie sua conta e faça parte do TelecomHub.',
        button: 'Criar minha conta',
      },
      forgot: {
        eyebrow: 'VAMOS RESOLVER ISSO',
        title: 'Esqueceu sua senha?',
        description: 'Acontece. Informe seu e-mail para receber as instruções de recuperação.',
        button: 'Enviar link de recuperação',
      },
      reset: {
        eyebrow: 'UM NOVO COMEÇO',
        title: 'Uma nova senha.\nTudo no seu lugar.',
        description: 'Escolha uma senha para voltar à sua conta.',
        button: 'Salvar nova senha',
      },
    })[mode.value]!,
)
const isNewPassword = computed(() => ['register', 'reset'].includes(mode.value))
const passwordRules = computed(() => [
  { label: 'Pelo menos 8 caracteres', valid: form.password.length >= 8 },
  {
    label: 'As senhas coincidem',
    valid: !!form.password_confirmation && form.password === form.password_confirmation,
  },
])
watch(mode, () => {
  form.password = ''
  form.password_confirmation = ''
  errors.value = {}
  alert.value = ''
  success.value = false
})
watch(
  () => route.query.email,
  (email) => {
    if (typeof email === 'string') form.email = email
  },
  { immediate: true },
)
function clearError(field: string) {
  delete errors.value[field]
  alert.value = ''
}
async function showErrors() {
  await nextTick()
  const invalid = document.querySelector<HTMLInputElement>('[aria-invalid="true"]')
  if (invalid) invalid.focus()
  else alertElement.value?.focus()
}
async function submit() {
  if (busy.value) return
  errors.value = {}
  alert.value = ''
  if (mode.value === 'register' && !form.name.trim())
    errors.value.name = 'Como podemos chamar você?'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
    errors.value.email = 'Informe um e-mail válido.'
  if (mode.value !== 'forgot' && !form.password) errors.value.password = 'Informe sua senha.'
  if (isNewPassword.value) {
    if (form.password.length < 8) errors.value.password = 'Use pelo menos 8 caracteres.'
    if (form.password !== form.password_confirmation)
      errors.value.password_confirmation = 'As senhas precisam ser iguais.'
  }
  if (Object.keys(errors.value).length) {
    await showErrors()
    return
  }
  busy.value = true
  try {
    const credentials = { email: form.email.trim().toLowerCase(), password: form.password }
    if (mode.value === 'forgot') {
      await authApi.forgotPassword(credentials.email)
      success.value = true
    } else if (mode.value === 'reset') {
      await authApi.resetPassword({
        ...credentials,
        token: String(route.params.token ?? ''),
        password_confirmation: form.password_confirmation,
      })
      form.password = ''
      form.password_confirmation = ''
      success.value = true
    } else {
      if (mode.value === 'register')
        await auth.register({
          ...credentials,
          name: form.name.trim(),
          password_confirmation: form.password_confirmation,
        })
      else await auth.login(credentials)
      await router.replace('/app')
    }
  } catch (error) {
    if (error instanceof ApiError) {
      errors.value = Object.fromEntries(
        Object.entries(error.errors).map(([key, values]) => [
          key,
          values[0] ?? 'Confira este campo.',
        ]),
      )
      alert.value =
        error.status === 422 ? 'Confira os dados destacados para continuar.' : error.message
    } else alert.value = 'Não foi possível concluir. Tente novamente.'
    await showErrors()
  } finally {
    busy.value = false
  }
}
</script>
<template>
  <AuthLayout>
    <template v-if="success">
      <div
        class="mb-7 flex size-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700"
      >
        <AppIcon :name="mode === 'forgot' ? 'mail' : 'check'" class="size-8" />
      </div>
      <div role="status">
        <p class="eyebrow">{{ mode === 'forgot' ? 'PRÓXIMO PASSO: SEU E-MAIL' : 'TUDO CERTO' }}</p>
        <h1 class="auth-title">
          {{ mode === 'forgot' ? 'Confira sua caixa de entrada.' : 'Senha atualizada!' }}
        </h1>
        <p class="mt-4 text-sm leading-7 text-slate-500">
          {{
            mode === 'forgot'
              ? 'Se houver uma conta com esse e-mail, você receberá um link para redefinir sua senha. Confira também a pasta de spam.'
              : 'Sua nova senha já está pronta. Entre para continuar.'
          }}
        </p>
      </div>
      <RouterLink to="/login" class="primary-button mt-8"
        >Voltar para o login <AppIcon class="size-4"
      /></RouterLink>
      <button
        v-if="mode === 'forgot'"
        class="mt-5 w-full text-sm text-slate-600 underline underline-offset-4"
        @click="success = false"
      >
        Usar outro e-mail ou tentar novamente
      </button>
    </template>
    <template v-else>
      <div
        v-if="['login', 'register'].includes(mode)"
        class="mb-9 grid grid-cols-2 rounded-xl bg-stone-100 p-1"
        aria-label="Acesso à conta"
      >
        <RouterLink
          v-for="item in [
            { path: '/login', label: 'Entrar' },
            { path: '/register', label: 'Criar conta' },
          ]"
          :key="item.path"
          :to="item.path"
          class="rounded-lg px-4 py-2.5 text-center text-sm font-medium transition"
          :class="
            route.path === item.path
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-900'
          "
          >{{ item.label }}</RouterLink
        >
      </div>
      <RouterLink
        v-else
        to="/login"
        class="mb-8 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-orange-700"
        ><AppIcon class="size-4 rotate-180" /> Voltar para entrar</RouterLink
      >
      <p class="eyebrow">{{ copy.eyebrow }}</p>
      <h1 class="auth-title whitespace-pre-line">{{ copy.title }}</h1>
      <p class="mb-8 mt-4 text-sm leading-6 text-slate-500">{{ copy.description }}</p>
      <p
        v-if="route.query.expired"
        class="mb-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-800"
        role="status"
      >
        Sua sessão terminou. Entre novamente para continuar.
      </p>
      <div
        v-if="alert"
        ref="alertElement"
        tabindex="-1"
        role="alert"
        class="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800"
      >
        {{ alert }}
      </div>
      <form class="space-y-5" novalidate :aria-busy="busy" @submit.prevent="submit">
        <fieldset :disabled="busy" class="space-y-5 disabled:opacity-70">
          <FormField
            v-if="mode === 'register'"
            id="name"
            v-model="form.name"
            label="Seu nome"
            autocomplete="name"
            placeholder="Como podemos chamar você?"
            maxlength="255"
            :error="errors.name"
            @update:model-value="clearError('name')"
          />
          <FormField
            id="email"
            v-model="form.email"
            label="E-mail"
            type="email"
            autocomplete="email"
            inputmode="email"
            placeholder="voce@empresa.com.br"
            maxlength="254"
            :error="errors.email"
            @update:model-value="clearError('email')"
          />
          <FormField
            v-if="mode !== 'forgot'"
            id="password"
            v-model="form.password"
            label="Senha"
            type="password"
            :autocomplete="isNewPassword ? 'new-password' : 'current-password'"
            :placeholder="
              isNewPassword ? 'Crie uma senha com 8 ou mais caracteres' : 'Digite sua senha'
            "
            maxlength="128"
            :error="errors.password"
            @update:model-value="clearError('password')"
            ><template v-if="mode === 'login'" #label-action
              ><RouterLink
                to="/forgot-password"
                class="text-xs font-medium text-orange-700 hover:underline"
                >Esqueceu a senha?</RouterLink
              ></template
            ></FormField
          >
          <FormField
            v-if="isNewPassword"
            id="password_confirmation"
            v-model="form.password_confirmation"
            label="Confirmar senha"
            type="password"
            autocomplete="new-password"
            placeholder="Digite a senha novamente"
            maxlength="128"
            :error="errors.password_confirmation"
            @update:model-value="clearError('password_confirmation')"
          />
          <ul v-if="isNewPassword" class="space-y-1.5" aria-label="Requisitos da senha">
            <li
              v-for="rule in passwordRules"
              :key="rule.label"
              class="flex items-center gap-2 text-xs"
              :class="rule.valid ? 'text-emerald-700' : 'text-slate-500'"
            >
              <AppIcon name="check" class="size-3.5" />{{ rule.label }}
            </li>
          </ul>
          <button type="submit" class="primary-button" :disabled="busy">
            <span v-if="busy" class="spinner" aria-hidden="true" />{{
              busy ? 'Só um instante…' : copy.button
            }}<AppIcon v-if="!busy" class="size-4" />
          </button>
        </fieldset>
      </form>
      <p class="mt-6 text-center text-xs leading-6 text-slate-400">
        <template v-if="mode === 'register'"
          >Já faz parte da equipe?
          <RouterLink to="/login" class="font-semibold text-slate-700 hover:text-orange-700"
            >Entre na sua conta</RouterLink
          ></template
        ><template v-else-if="mode === 'login'"
          >Sua equipe mais próxima. Seu trabalho mais leve.</template
        ><template v-else
          >Precisa de um novo link?
          <RouterLink to="/forgot-password" class="font-semibold text-slate-700"
            >Recuperar acesso</RouterLink
          ></template
        >
      </p>
    </template>
  </AuthLayout>
</template>
