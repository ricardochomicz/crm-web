import { ref, watch, type Ref } from 'vue'
import { tenantApi } from '../api'
import type { Tenant } from '../types'
import { errorMessage } from '@/lib/feedback'

export function useTenantDashboard(tenantId: Ref<string>) {
  const tenant = ref<Tenant>()
  const loading = ref(true)
  const error = ref('')
  let requestId = 0

  async function load() {
    const id = tenantId.value
    const request = ++requestId
    loading.value = true
    error.value = ''
    tenant.value = undefined
    try {
      const response = await tenantApi.show(id)
      if (request === requestId && id === tenantId.value) tenant.value = response.data
    } catch (failure) {
      if (request === requestId && id === tenantId.value) error.value = errorMessage(failure)
    } finally {
      if (request === requestId && id === tenantId.value) loading.value = false
    }
  }

  watch(tenantId, () => { void load() }, { immediate: true })
  return { tenant, loading, error, load }
}
