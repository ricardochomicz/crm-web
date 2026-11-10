import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/features/auth/store'
import { ApiError } from '@/lib/http'
import { errorMessage } from '@/lib/feedback'
import { operatorsApi, type Operator } from '@/features/operators/api'
import { tenantApi } from '../api'
import type { Plan } from '../types'
import { maskBrazilianPhone } from '@/lib/phoneMask'

export function useCreateTenant() {
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
const maskedPhone = computed({
  get: () => maskBrazilianPhone(form.phone),
  set: (value: string) => { form.phone = maskBrazilianPhone(value) },
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
return {
  plans, operators, selectedOperators, loading, loadError, error, errors,
  step, busy, selected, selectedPlan, form, maskedPhone, resetDocument, load, next,
  nextOperators, toggleOperator, submit,
}
}
