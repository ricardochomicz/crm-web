import { computed, onBeforeUnmount, ref, watch, type Ref } from 'vue'
import { globalSearchApi, type GlobalSearchItem, type GlobalSearchResults } from '../api/globalSearchApi'
import { errorMessage } from '@/lib/feedback'

const empty = (): GlobalSearchResults => ({ clients: [], opportunities: [], orders: [] })

export function useGlobalSearch(tenantId: Readonly<Ref<string | undefined>>, open: Readonly<Ref<boolean>>) {
  const query = ref('')
  const results = ref<GlobalSearchResults>(empty())
  const loading = ref(false)
  const error = ref('')
  const items = computed<GlobalSearchItem[]>(() => [
    ...results.value.clients, ...results.value.opportunities, ...results.value.orders,
  ])
  let timer: ReturnType<typeof setTimeout> | undefined
  let controller: AbortController | undefined
  let sequence = 0

  function cancel() {
    sequence++
    if (timer) clearTimeout(timer)
    timer = undefined
    controller?.abort()
    controller = undefined
    loading.value = false
  }
  watch([query, tenantId, open], ([term, tenant, isOpen]) => {
    cancel()
    results.value = empty()
    error.value = ''
    if (!isOpen || !tenant || term.trim().length < 2) return
    loading.value = true
    const current = sequence
    timer = setTimeout(async () => {
      const requestController = new AbortController()
      controller = requestController
      try {
        const response = await globalSearchApi.search(tenant, term.trim(), requestController.signal)
        if (current === sequence) results.value = response.data
      } catch (failure) {
        if (current === sequence && !requestController.signal.aborted) error.value = errorMessage(failure)
      } finally {
        if (current === sequence) loading.value = false
      }
    }, 300)
  }, { immediate: true })
  onBeforeUnmount(cancel)
  return { query, results, items, loading, error }
}
