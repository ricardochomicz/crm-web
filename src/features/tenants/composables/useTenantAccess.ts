import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/features/auth/store'
import { errorMessage } from '@/lib/feedback'
import { tenantApi } from '../api'
import type { Page, Tenant } from '../types'

export function useTenantAccess() {
  const auth = useAuthStore()
  const router = useRouter()
  const route = useRoute()
  const result = ref<Page<Tenant>>()
  const loading = ref(true)
  const error = ref('')
  const selecting = ref('')
  const selectionError = ref('')
  let loadSequence = 0

  async function enter(tenant: Tenant) {
    if (selecting.value) return
    selecting.value = tenant.id
    selectionError.value = ''
    try {
      await tenantApi.select(tenant.id)
      await router.push(`/empresas/${tenant.id}`)
    } catch (failure) {
      selectionError.value = errorMessage(failure)
    } finally {
      selecting.value = ''
    }
  }

  async function load(page = 1) {
    const sequence = ++loadSequence
    loading.value = true
    error.value = ''
    try {
      const response = await tenantApi.list(page)
      if (sequence !== loadSequence) return
      result.value = response
      if (route.meta.autoEnter && response.total === 1 && response.data[0]) {
        await enter(response.data[0])
      }
    } catch (failure) {
      if (sequence === loadSequence) error.value = errorMessage(failure)
    } finally {
      if (sequence === loadSequence) loading.value = false
    }
  }

  onMounted(() => { void load() })
  return { auth, result, loading, error, selecting, selectionError, enter, load }
}
