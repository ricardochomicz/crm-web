import { watch, type Ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

/** Keeps the selected order synchronized with the URL, including browser back/forward. */
export function useOrderDeepLink(selectedId: Ref<string | null>) {
  const route = useRoute()
  const router = useRouter()
  watch(() => route.query.pedido, value => {
    selectedId.value = typeof value === 'string' && value ? value : null
  }, { immediate: true })
  function close() {
    selectedId.value = null
    if (route.query.pedido) {
      const { pedido: _ignored, ...query } = route.query
      void router.replace({ query })
    }
  }
  return { close }
}
