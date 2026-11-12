import { watch, type Ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { opportunitiesApi, type Opportunity } from '../api'
import { toast } from '@/services/toast'
import { errorMessage } from '@/lib/feedback'

export function useOpportunityDeepLink(
  tenantId: Ref<string>,
  dialogOpen: Ref<boolean>,
  open: (item: Opportunity) => Promise<void>,
) {
  const route = useRoute()
  const router = useRouter()
  let version = 0
  watch([tenantId, () => route.query.oportunidade], async ([tenant, value]) => {
    const current = ++version
    if (typeof value !== 'string' || !value || !tenant) return
    try {
      const response = await opportunitiesApi.show(tenant, value)
      if (current === version) await open(response.data)
    } catch (error) {
      if (current === version) toast.error(errorMessage(error))
    }
  }, { immediate: true })

  watch(dialogOpen, isOpen => {
    if (!isOpen && route.query.oportunidade) {
      const { oportunidade: _ignored, ...query } = route.query
      void router.replace({ query })
    }
  })
}
