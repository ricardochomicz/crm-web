import { computed, ref, watch, type Ref } from 'vue'
import { tenantApi } from '../api'
import { can, type Tenant, type Subscription } from '../types'
import { dateLabel, errorMessage } from '@/lib/feedback'

export function useTenantSubscription(tenantId: Ref<string>) {
  const tenant = ref<Tenant>()
  const subscription = ref<Subscription>()
  const loading = ref(true)
  const error = ref('')
  const subscriptionError = ref('')
  let requestId = 0
  let subscriptionRequestId = 0

  const metrics = computed(() => {
    const current = subscription.value
    if (!current) return []
    return [
      { label: 'Pessoas na empresa', value: current.usage.users, detail: `de ${current.limits.users} vagas no plano` },
      { label: 'Convites reservados', value: current.usage.reserved_invitations, detail: 'aguardando aceite' },
      { label: 'Vagas disponíveis', value: current.remaining.users, detail: 'para novas conexões' },
      {
        label: 'Plano atual',
        value: current.plan.name ?? 'Não informado',
        detail: current.status === 'TRIALING'
          ? `Teste até ${dateLabel(current.trial_ends_at)}`
          : ({
              ACTIVE: 'Assinatura ativa',
              PAST_DUE: 'Pagamento pendente',
              CANCELLED: 'Assinatura cancelada',
            } as Record<string, string>)[current.status] ?? current.status,
      },
    ]
  })

  async function loadSubscription() {
    const current = tenant.value
    if (!current || !can(current, 'subscription.view')) return
    const request = ++subscriptionRequestId
    const id = tenantId.value
    subscriptionError.value = ''
    subscription.value = undefined
    try {
      const response = await tenantApi.subscription(current.id)
      if (request === subscriptionRequestId && id === tenantId.value) subscription.value = response.data
    } catch (failure) {
      if (request === subscriptionRequestId && id === tenantId.value) subscriptionError.value = errorMessage(failure)
    }
  }

  async function load() {
    const id = tenantId.value
    const request = ++requestId
    ++subscriptionRequestId
    loading.value = true
    error.value = ''
    subscriptionError.value = ''
    tenant.value = undefined
    subscription.value = undefined
    try {
      const response = await tenantApi.show(id)
      if (request !== requestId || id !== tenantId.value) return
      tenant.value = response.data
      await loadSubscription()
    } catch (failure) {
      if (request === requestId && id === tenantId.value) error.value = errorMessage(failure)
    } finally {
      if (request === requestId && id === tenantId.value) loading.value = false
    }
  }

  watch(tenantId, () => { void load() }, { immediate: true })
  return { tenant, subscription, loading, error, subscriptionError, metrics, load, loadSubscription }
}
