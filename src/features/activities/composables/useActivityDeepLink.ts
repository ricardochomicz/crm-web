import { watch, ref, type Ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { calendarApi } from '@/features/calendar/api'
import type { CalendarEvent } from '@/features/calendar/types'
import { errorMessage } from '@/lib/feedback'

export function useActivityDeepLink(tenantId: Ref<string>) {
  const route = useRoute()
  const router = useRouter()
  const selected = ref<CalendarEvent | null>(null)
  const dialogOpen = ref(false)
  const loading = ref(false)
  const error = ref('')
  let version = 0

  watch([tenantId, () => route.query.atividade], async ([tenant, id]) => {
    const current = ++version
    selected.value = null
    dialogOpen.value = false
    error.value = ''
    if (!tenant || typeof id !== 'string' || !id) return
    loading.value = true
    try {
      const response = await calendarApi.show(tenant, id)
      if (current === version) {
        selected.value = response.data
        dialogOpen.value = true
      }
    } catch (cause) {
      if (current === version) error.value = errorMessage(cause)
    } finally {
      if (current === version) loading.value = false
    }
  }, { immediate: true })

  function close() {
    dialogOpen.value = false
    if (route.query.atividade) {
      const { atividade: _ignored, ...query } = route.query
      void router.replace({ query })
    }
  }
  return { selected, dialogOpen, loading, error, close }
}
