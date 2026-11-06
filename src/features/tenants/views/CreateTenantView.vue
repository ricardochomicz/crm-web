<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import SearchSelect from '@/components/ui/SearchSelect.vue'
import FormField from '@/components/ui/FormField.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import AsyncNotice from '@/components/ui/AsyncNotice.vue'
import { useAuthStore } from '@/features/auth/store'
import { ApiError } from '@/lib/http'
import { currency, errorMessage } from '@/lib/feedback'
import { tenantApi } from '../api'
import { operatorsApi, type Operator } from '@/features/operators/api'
import type { Plan } from '../types'
const auth = useAuthStore()
const router = useRouter()
const plans = ref<Plan[]>([])
const operators = ref<Operator[]>([])
const selectedOperators = ref<number[]>([])
const loading = ref(true)
const loadError = ref('')
const error = ref('')
const errors = ref<Record<string, string>>({})
const step = ref(1)
const busy = ref(false)
const selected = ref('')
const selectedPlan = computed(() => plans.value.find((plan) => plan.id === selected.value))
const form = reactive({
  name: '',
  type: 'PJ' as 'PF' | 'PJ',
  document: '',
  email: auth.user?.email ?? '',
  trade_name: '',
  phone: '',
})
function resetDocument() {
  form.document = ''
  errors.value = {}
}
async function load() {
  loading.value = true
  loadError.value = ''
  try {
    const [availablePlans, availableOperators] = await Promise.all([tenantApi.plans(), operatorsApi.available()])
    plans.value = availablePlans.data
    operators.value = availableOperators.data
    selected.value = plans.value[0]?.id ?? ''
  } catch (failure) {
    loadError.value = errorMessage(failure)
  } finally {
    loading.value = false
  }
}
async function next() {
  errors.value = {}
  error.value = ''
  if (!form.name.trim()) errors.value['tenant.name'] = 'Informe o nome da empresa.'
  const document = form.document.replace(/\D/g, '')
  if (document.length !== (form.type === 'PJ' ? 14 : 11))
    errors.value['tenant.document'] =
      form.type === 'PJ' ? 'Informe um CNPJ com 14 dígitos.' : 'Informe um CPF com 11 dígitos.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
    errors.value['tenant.email'] = 'Informe um e-mail válido.'
  if (Object.keys(errors.value).length) {
    await nextTick()
    window.document.querySelector<HTMLInputElement>('[aria-invalid="true"]')?.focus()
    return
  }
  step.value = 2
  await nextTick()
  window.document.getElementById('plan-heading')?.focus()
}
function nextOperators() {
  if (!selected.value) {
    error.value = 'Selecione um plano para continuar.'
    return
  }
  error.value = ''
  step.value = 3
}
function toggleOperator(id: number, checked: boolean) {
  selectedOperators.value = checked ? [...selectedOperators.value, id] : selectedOperators.value.filter((value) => value !== id)
}
async function submit() {
  if (busy.value) return
  if (!selected.value) {
    error.value = 'Selecione um plano para continuar.'
    return
  }
  if (!selectedOperators.value.length) {
    error.value = 'Selecione pelo menos uma operadora para continuar.'
    return
  }
  busy.value = true
  error.value = ''
  errors.value = {}
  try {
    const result = await tenantApi.create({
      subscription_plan_id: selected.value,
      operator_ids: selectedOperators.value,
      tenant: {
        ...form,
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        document: form.document.replace(/\D/g, ''),
        timezone: 'America/Sao_Paulo',
      },
    })
    await router.replace(`/empresas/${result.data.id}`)
  } catch (failure) {
    error.value = errorMessage(failure)
    if (failure instanceof ApiError) {
      errors.value = Object.fromEntries(
        Object.entries(failure.errors).map(([key, values]) => [
          key,
          values[0] ?? 'Confira este campo.',
        ]),
      )
      if (Object.keys(errors.value).some((key) => key.startsWith('tenant.'))) step.value = 1
      else if (errors.value.operator_ids || errors.value['operator_ids.0']) step.value = 3
    }
    await nextTick()
    document.getElementById('create-error')?.focus()
  } finally {
    busy.value = false
  }
}
onMounted(load)
</script>
<template>
  <AppShell title="Criar empresa">
    <RouterLink
      to="/empresas"
      class="mb-6 inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-orange-700"
      ><AppIcon class="size-4 rotate-180" />Minhas empresas</RouterLink
    >
    <p class="eyebrow">O COMEÇO DE UMA NOVA HISTÓRIA</p>
    <h1 class="mt-3 text-3xl font-semibold tracking-tight">Vamos dar um nome ao seu espaço.</h1>
    <p class="mt-3 text-sm leading-6 text-slate-500">
      Poucos detalhes para começar. Você será o proprietário desta empresa.
    </p>
    <ol class="my-8 flex gap-6 text-sm" aria-label="Etapas">
      <li
        :aria-current="step === 1 ? 'step' : undefined"
        class="flex items-center gap-2"
        :class="step === 1 ? 'font-semibold text-orange-700' : 'text-slate-500'"
      >
        <span
          class="flex size-7 items-center justify-center rounded-full bg-orange-100 text-xs text-orange-800"
          >1</span
        >Sua empresa
      </li>
      <li
        :aria-current="step === 2 ? 'step' : undefined"
        class="flex items-center gap-2"
        :class="step === 2 ? 'font-semibold text-orange-700' : 'text-slate-500'"
      >
        <span class="flex size-7 items-center justify-center rounded-full bg-stone-200 text-xs"
          >2</span
        >Seu plano
      </li>
      <li :aria-current="step === 3 ? 'step' : undefined" class="flex items-center gap-2" :class="step === 3 ? 'font-semibold text-orange-700' : 'text-slate-500'">
        <span class="flex size-7 items-center justify-center rounded-full bg-stone-200 text-xs">3</span>Suas operadoras
      </li>
    </ol>
    <div
      v-if="error"
      id="create-error"
      tabindex="-1"
      role="alert"
      class="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
    >
      {{ error }}
    </div>
    <form
      v-if="step === 1"
      class="max-w-3xl rounded-3xl border border-stone-200 bg-white p-6 sm:p-9"
      novalidate
      @submit.prevent="next"
    >
      <fieldset :disabled="busy" class="space-y-6">
        <legend class="mb-6 text-lg font-semibold">Conte um pouco sobre sua empresa</legend>
        <div class="grid gap-5 sm:grid-cols-2">
          <div>
            <label for="tenant-type" class="mb-2 block text-sm font-semibold text-slate-700"
              >Tipo de cadastro</label
            ><SearchSelect v-model="form.type" :options="[{value:'PJ',label:'Pessoa jurídica · CNPJ'},{value:'PF',label:'Pessoa física · CPF'}]" @update:model-value="resetDocument"/>
          </div>
          <FormField
            id="document"
            v-model="form.document"
            :label="form.type === 'PJ' ? 'CNPJ' : 'CPF'"
            inputmode="numeric"
            :maxlength="form.type === 'PJ' ? 18 : 14"
            placeholder="Somente números ou com pontuação"
            :error="errors['tenant.document']"
          />
        </div>
        <FormField
          id="company-name"
          v-model="form.name"
          label="Nome da empresa ou do profissional"
          maxlength="180"
          placeholder="Como seu espaço será chamado?"
          :error="errors['tenant.name']"
        /><FormField
          v-if="form.type === 'PJ'"
          id="trade-name"
          v-model="form.trade_name"
          label="Nome fantasia (opcional)"
          maxlength="180"
          placeholder="Nome pelo qual seus clientes conhecem você"
          :error="errors['tenant.trade_name']"
        />
        <div class="grid gap-5 sm:grid-cols-2">
          <FormField
            id="company-email"
            v-model="form.email"
            label="E-mail de contato"
            type="email"
            autocomplete="email"
            maxlength="254"
            :error="errors['tenant.email']"
          /><FormField
            id="company-phone"
            v-model="form.phone"
            label="Telefone (opcional)"
            type="tel"
            autocomplete="tel"
            maxlength="20"
            placeholder="(00) 00000-0000"
            :error="errors['tenant.phone']"
          />
        </div>
        <p class="text-xs text-slate-400">Fuso horário inicial: Brasília · America/Sao_Paulo.</p>
        <button class="primary-button sm:ml-auto sm:max-w-xs" type="submit">
          Escolher meu plano<AppIcon class="size-4" />
        </button>
      </fieldset>
    </form>
    <section v-else-if="step === 2">
      <h2 id="plan-heading" tabindex="-1" class="mb-2 text-xl font-semibold">
        Um plano para o seu momento.
      </h2>
      <p class="mb-6 text-sm text-slate-500">
        Todos começam com 14 dias de teste. A criação da empresa não realiza uma cobrança.
      </p>
      <AsyncNotice
        :loading="loading"
        :error="loadError"
        label="Buscando os planos disponíveis…"
        @retry="load"
      />
      <div
        v-if="!loading && !loadError && !plans.length"
        class="rounded-2xl border border-stone-200 bg-white p-6"
      >
        <p class="text-sm text-slate-600">
          Nenhum plano está disponível no momento. Entre em contato com o administrador.
        </p>
        <button class="secondary-button mt-4" @click="load">Atualizar planos</button>
      </div>
      <fieldset v-if="!loading && plans.length" :disabled="busy" class="grid gap-4 md:grid-cols-3">
        <legend class="sr-only">Selecione seu plano</legend>
        <label
          v-for="plan in plans"
          :key="plan.id"
          class="relative cursor-pointer rounded-2xl border-2 bg-white p-6 transition"
          :class="
            selected === plan.id
              ? 'border-orange-500 shadow-sm'
              : 'border-stone-200 hover:border-orange-200'
          "
          ><div class="flex items-center justify-between">
            <span class="text-lg font-semibold">{{ plan.name }}</span
            ><input
              v-model="selected"
              type="radio"
              name="plan"
              :value="plan.id"
              class="size-4 accent-orange-600"
            />
          </div>
          <p class="mt-3 min-h-10 text-xs leading-5 text-slate-500">{{ plan.description }}</p>
          <p class="mt-6 text-3xl font-semibold tracking-tight">
            {{ currency(plan.monthly_price, plan.currency)
            }}<span class="text-xs font-normal text-slate-400"> / mês</span>
          </p>
          <ul class="mt-6 space-y-3 text-xs text-slate-600">
            <li class="flex items-center gap-2">
              <AppIcon name="check" class="size-4 text-emerald-600" />Até {{ plan.user_limit }}
              {{ plan.user_limit === 1 ? 'pessoa' : 'pessoas' }}, incluindo você
            </li>
            <li class="flex items-center gap-2">
              <AppIcon name="check" class="size-4 text-emerald-600" />{{ plan.storage_limit_mb }} MB
              de armazenamento
            </li>
            <li class="flex items-center gap-2">
              <AppIcon name="check" class="size-4 text-emerald-600" />14 dias para experimentar
            </li>
          </ul></label
        >
      </fieldset>
      <div
        class="mt-7 flex flex-wrap items-center justify-between gap-5 rounded-2xl border border-stone-200 bg-white p-6"
      >
        <button type="button" class="secondary-button" :disabled="busy" @click="step = 1">
          Voltar aos dados
        </button>
        <div class="flex flex-wrap items-center gap-5">
          <p v-if="selectedPlan" class="text-xs text-slate-500">
            {{ form.name }} · Plano {{ selectedPlan.name }}
          </p>
          <button
            class="primary-button w-auto"
            :disabled="busy || !selectedPlan || !!loadError || loading"
            @click="nextOperators"
          >
            <span v-if="busy" class="spinner" />{{
              'Continuar para operadoras'
            }}<AppIcon v-if="!busy" class="size-4" />
          </button>
        </div>
      </div>
    </section>
    <section v-else class="max-w-3xl">
      <h2 class="mb-2 text-xl font-semibold">Com quais operadoras sua empresa trabalha?</h2>
      <p class="mb-6 text-sm text-slate-500">Selecione pelo menos uma. Você poderá alterar essa escolha depois, em Configurações → Minhas operadoras.</p>
      <div class="rounded-2xl border border-stone-200 bg-white p-6">
        <p v-if="!operators.length" class="text-sm text-slate-500">Nenhuma operadora disponível. Solicite ao administrador que configure o catálogo.</p>
        <label v-for="operator in operators" :key="operator.id" class="flex cursor-pointer items-center justify-between gap-4 border-b border-stone-100 py-4">
          <span class="font-semibold text-slate-800">{{ operator.name }}</span>
          <input type="checkbox" class="size-5 accent-orange-600" :checked="selectedOperators.includes(operator.id)" :disabled="busy" @change="toggleOperator(operator.id, ($event.target as HTMLInputElement).checked)" />
        </label>
        <p class="mt-5 text-xs text-slate-500">{{ selectedOperators.length }} operadora(s) selecionada(s)</p>
      </div>
      <div class="mt-7 flex flex-wrap items-center justify-between gap-4">
        <button type="button" class="secondary-button" :disabled="busy" @click="step = 2">Voltar ao plano</button>
        <button class="primary-button w-auto" :disabled="busy || !selectedOperators.length" @click="submit">
          {{ busy ? 'Criando seu espaço…' : 'Criar empresa e iniciar teste' }}
        </button>
      </div>
    </section>
  </AppShell>
</template>
