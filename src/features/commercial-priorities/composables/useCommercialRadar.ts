import { ref, watch, type Ref } from 'vue'
import { radarApi, type CommercialRadarResponse } from '../radarApi'
import { errorMessage } from '@/lib/feedback'
import { useCommercialRadarAutoRefresh } from './useCommercialRadarAutoRefresh'

export function useCommercialRadar(
  tenantId: Readonly<Ref<string>>,
  enabled: Readonly<Ref<boolean>>,
  memberId?: Readonly<Ref<string>>,
  scope?: Readonly<Ref<'mine' | 'team'>>,
) {
  const radar = ref<CommercialRadarResponse | null>(null)
  const loading = ref(false)
  const error = ref('')
  let version = 0
  let foregroundRequests = 0

  async function load(silent = false) {
    const current = ++version
    if (!silent) {
      radar.value = null
      error.value = ''
    }
    if (!enabled.value) {
      loading.value = false
      return
    }

    const id = tenantId.value
    if (!silent) {
      ++foregroundRequests
      loading.value = true
    }
    try {
      const response = await radarApi.list(id, memberId?.value ?? '', scope?.value ?? 'mine')
      if (current === version && id === tenantId.value) {
        radar.value = response.data
      }
    } catch (failure) {
      if (current === version && !silent) error.value = errorMessage(failure)
    } finally {
      if (!silent) {
        --foregroundRequests
        if (foregroundRequests === 0) loading.value = false
      }
    }
  }

  watch([tenantId, enabled, ...(memberId ? [memberId] : []), ...(scope ? [scope] : [])], () => { void load() }, { immediate: true })

  useCommercialRadarAutoRefresh(tenantId, enabled, () => load(true))

  return { radar, loading, error, load }
}
