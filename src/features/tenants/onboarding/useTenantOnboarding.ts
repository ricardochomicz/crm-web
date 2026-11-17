import { computed, ref, watch, type Ref } from 'vue'
import { useRouter } from 'vue-router'
import { errorMessage } from '@/lib/feedback'
import { tenantApi } from '../api'
import { operatorsApi, type TenantOperator } from '@/features/operators/api'
import type { Tenant } from '../types'
import { onboardingApi, type OnboardingStep, type OnboardingProgress } from './api'

export const onboardingSteps: { key: OnboardingStep; title: string; description: string; path: string }[] = [
  { key: 'company', title: 'Dados da empresa', description: 'Revise os dados cadastrais.', path: 'dados' },
  { key: 'plan', title: 'Plano e assinatura', description: 'Confira o plano escolhido.', path: 'assinatura' },
  { key: 'operators', title: 'Operadoras', description: 'Selecione as operadoras atendidas.', path: 'operadoras' },
  { key: 'commissions', title: 'Tabelas de comissão', description: 'Cadastre uma tabela ativa para cada operadora.', path: 'comissoes' },
  { key: 'classifications', title: 'Classificações', description: 'Cadastre uma classificação ativa para cada operadora.', path: 'classificacoes' },
]

export function useTenantOnboarding(tenantId: Readonly<Ref<string>>) {
  const router = useRouter()
  const tenant = ref<Tenant | null>(null)
  const progress = ref<OnboardingProgress | null>(null)
  const operators = ref<TenantOperator[]>([])
  const loading = ref(true)
  const busy = ref(false)
  const error = ref('')
  let version = 0
  const completedCount = computed(() => onboardingSteps.filter(step => progress.value?.steps[step.key].complete).length)
  const canComplete = computed(() => !!progress.value && !progress.value.completed && completedCount.value === onboardingSteps.length && tenant.value?.role === 'OWNER')
  const nextStep = computed(() => onboardingSteps.find(step => !progress.value?.steps[step.key].complete) ?? null)
  const operatorNames = (ids: number[]) => ids.map(id => operators.value.find(operator => operator.id === id)?.name ?? `Operadora #${id}`)
  const missingOperators = (key: 'commissions' | 'classifications') =>
    operatorNames(progress.value?.steps[key].missing_operator_ids ?? [])
  const base = computed(() => `/empresas/${tenantId.value}`)

  async function load() {
    const current = ++version
    loading.value = true
    error.value = ''
    try {
      const [company, status, operatorList] = await Promise.all([tenantApi.show(tenantId.value), onboardingApi.progress(tenantId.value), operatorsApi.tenantList(tenantId.value)])
      if (current !== version) return
      tenant.value = company.data
      progress.value = status.data
      operators.value = operatorList.data
    } catch (failure) {
      if (current === version) error.value = errorMessage(failure)
    } finally {
      if (current === version) loading.value = false
    }
  }
  async function complete() {
    if (!canComplete.value || busy.value) return
    busy.value = true
    error.value = ''
    try {
      const response = await onboardingApi.complete(tenantId.value)
      progress.value = response.data
      await router.replace(base.value)
    } catch (failure) {
      const message = errorMessage(failure)
      await load()
      error.value = message
    } finally {
      busy.value = false
    }
  }
  watch(tenantId, () => { tenant.value = null; progress.value = null; operators.value = []; void load() }, { immediate: true })
  return { tenant, progress, loading, busy, error, completedCount, canComplete, nextStep, missingOperators, base, load, complete }
}
