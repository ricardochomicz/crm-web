import { computed, ref, watch, type Ref } from 'vue'
import { tenantApi } from '../api'
import type { Plan, Subscription } from '../types'
import { errorMessage } from '@/lib/feedback'

export function useSubscriptionUpgrade(
  tenantId: Readonly<Ref<string>>,
  subscription: Readonly<Ref<Subscription | undefined>>,
  onSuccess: () => Promise<void>,
) {
  const plans = ref<Plan[]>([])
  const loading = ref(false)
  const saving = ref(false)
  const error = ref('')
  const selectedPlanId = ref('')
  const open = ref(false)
  let version = 0

  const available = computed(() => plans.value.filter((plan) =>
    plan.id !== subscription.value?.plan.id &&
    plan.user_limit > (subscription.value?.limits.users ?? 0) &&
    plan.storage_limit_mb >= (subscription.value?.limits.storage_mb ?? 0) &&
    plan.currency === subscription.value?.currency &&
    Number(plan.monthly_price) > Number(subscription.value?.monthly_price ?? 0),
  ))
  const canUpgrade = computed(() => ['ACTIVE', 'TRIALING'].includes(subscription.value?.status ?? ''))
  const selected = computed(() => available.value.find((plan) => plan.id === selectedPlanId.value))
  const options = computed(() => available.value.map((plan) => ({
    value: plan.id,
    label: `${plan.name} — ${plan.user_limit} usuários — R$ ${Number(plan.monthly_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês`,
  })))

  async function show() {
    open.value = true
    error.value = ''
    selectedPlanId.value = ''
    const current = ++version
    loading.value = true
    try {
      const response = await tenantApi.plans()
      if (current === version) plans.value = response.data
    } catch (failure) {
      if (current === version) error.value = errorMessage(failure)
    } finally {
      if (current === version) loading.value = false
    }
  }

  function close() {
    if (saving.value) return
    open.value = false
    ++version
  }

  async function confirm() {
    if (!canUpgrade.value || !selected.value || saving.value) return
    saving.value = true
    error.value = ''
    try {
      await tenantApi.upgradePlan(tenantId.value, selected.value.id)
      await onSuccess()
      open.value = false
    } catch (failure) {
      error.value = errorMessage(failure)
    } finally {
      saving.value = false
    }
  }

  watch(tenantId, () => {
    ++version
    open.value = false
    plans.value = []
    selectedPlanId.value = ''
  })

  return { open, loading, saving, error, selectedPlanId, selected, options, available, canUpgrade, show, close, confirm }
}
