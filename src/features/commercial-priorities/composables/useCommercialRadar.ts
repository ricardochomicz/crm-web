import { ref, watch, type Ref } from 'vue'
import { radarApi, type CommercialRadarResponse } from '../radarApi'
import { errorMessage } from '@/lib/feedback'

export function useCommercialRadar(
  tenantId: Readonly<Ref<string>>,
  enabled: Readonly<Ref<boolean>>,
) {
  const radar = ref<CommercialRadarResponse | null>(null)
  const loading = ref(false)
  const error = ref('')
  let version = 0

  async function load() {
    const current = ++version
    radar.value = null
    error.value = ''
    if (!enabled.value) {
      loading.value = false
      return
    }

    const id = tenantId.value
    loading.value = true
    try {
      const response = await radarApi.list(id)
      if (current === version && id === tenantId.value) {
        radar.value = response.data
      }
    } catch (failure) {
      if (current === version) error.value = errorMessage(failure)
    } finally {
      if (current === version) loading.value = false
    }
  }

  watch([tenantId, enabled], () => { void load() }, { immediate: true })

  return { radar, loading, error, load }
}
