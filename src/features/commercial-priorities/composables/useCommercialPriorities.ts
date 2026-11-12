import { ref, watch, type Ref } from 'vue'
import {
  commercialPrioritiesApi,
  type CommercialPrioritySummary,
} from '../api'

export function useCommercialPriorities(
  tenantId: Readonly<Ref<string>>,
  enabled: Readonly<Ref<boolean>>,
) {
  const summary = ref<CommercialPrioritySummary | null>(null)
  const loading = ref(false)
  const error = ref('')
  const acknowledgingId = ref<string | null>(null)
  const acknowledgingRenewalId = ref<string | null>(null)
  const acknowledgingAll = ref<'opportunities' | 'renewals' | null>(null)
  let version = 0

  async function load() {
    if (!enabled.value) return

    const id = tenantId.value
    const current = ++version
    loading.value = true
    error.value = ''

    try {
      const response = await commercialPrioritiesApi.list(id)
      if (current === version && id === tenantId.value) {
        summary.value = response.data
      }
    } catch (failure) {
      if (current === version) {
        error.value = failure instanceof Error
          ? failure.message
          : 'Não foi possível carregar as prioridades.'
      }
    } finally {
      if (current === version) loading.value = false
    }
  }

  async function acknowledge(opportunityId: string) {
    if (acknowledgingId.value || acknowledgingAll.value || !summary.value) return

    const id = tenantId.value
    acknowledgingId.value = opportunityId

    try {
      await commercialPrioritiesApi.acknowledge(id, opportunityId)
      if (id === tenantId.value) {
        const item = summary.value?.items.find((entry) => entry.id === opportunityId)
        if (item) item.acknowledged = true
      }
    } catch (failure) {
      error.value = failure instanceof Error
        ? failure.message
        : 'Não foi possível confirmar a ciência.'
    } finally {
      acknowledgingId.value = null
    }
  }

  async function acknowledgeRenewal(contractId: string) {
    if (acknowledgingRenewalId.value || acknowledgingAll.value || !summary.value) return

    const id = tenantId.value
    acknowledgingRenewalId.value = contractId

    try {
      await commercialPrioritiesApi.acknowledgeRenewal(id, contractId)
      if (id === tenantId.value) {
        const item = summary.value?.renewals.items.find((entry) => entry.id === contractId)
        if (item) item.acknowledged = true
      }
    } catch (failure) {
      error.value = failure instanceof Error
        ? failure.message
        : 'Não foi possível confirmar a ciência da renovação.'
    } finally {
      acknowledgingRenewalId.value = null
    }
  }

  async function acknowledgeAll(type: 'opportunities' | 'renewals') {
    if (acknowledgingAll.value || acknowledgingId.value || acknowledgingRenewalId.value) return

    const id = tenantId.value
    acknowledgingAll.value = type
    error.value = ''

    try {
      await commercialPrioritiesApi.acknowledgeAll(id, type)
      if (id === tenantId.value) {
        const items = type === 'renewals'
          ? summary.value?.renewals.items
          : summary.value?.items
        items?.forEach((item) => { item.acknowledged = true })
      }
    } catch (failure) {
      error.value = failure instanceof Error
        ? failure.message
        : 'Não foi possível confirmar todas as prioridades.'
    } finally {
      acknowledgingAll.value = null
    }
  }

  watch([tenantId, enabled], () => {
    ++version
    summary.value = null
    error.value = ''
    if (enabled.value) void load()
  }, { immediate: true })

  return {
    summary,
    loading,
    error,
    acknowledgingId,
    acknowledgingRenewalId,
    acknowledgingAll,
    acknowledgeAll,
    load,
    acknowledge,
    acknowledgeRenewal,
  }
}
