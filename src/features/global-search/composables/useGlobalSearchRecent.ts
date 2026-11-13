import { ref, watch, type Ref } from 'vue'
import type { GlobalSearchItem } from '../api/globalSearchApi'

/** Recent selections are scoped by tenant and user and kept only for this browser tab. */
export function useGlobalSearchRecent(tenantId: Readonly<Ref<string>>, userId: Readonly<Ref<string>>) {
  const recent = ref<GlobalSearchItem[]>([])
  const key = () => 'crm:global-search:recent:' + userId.value + ':' + tenantId.value

  watch([tenantId, userId], () => {
    recent.value = []
    if (!tenantId.value || !userId.value) return
    try {
      const stored: unknown = JSON.parse(sessionStorage.getItem(key()) ?? '[]')
      if (Array.isArray(stored)) {
        recent.value = stored.filter((item): item is GlobalSearchItem =>
          !!item && typeof item.id === 'string' && typeof item.title === 'string'
          && ['clients', 'opportunities', 'orders'].includes(item.type),
        ).slice(0, 5)
      }
    } catch {
      recent.value = []
    }
  }, { immediate: true })

  function remember(item: GlobalSearchItem) {
    if (!tenantId.value || !userId.value) return
    recent.value = [item, ...recent.value.filter(old => old.id !== item.id || old.type !== item.type)].slice(0, 5)
    try {
      sessionStorage.setItem(key(), JSON.stringify(recent.value))
    } catch {
      // History remains available in memory when browser storage is disabled.
    }
  }

  function clear() {
    recent.value = []
    if (!tenantId.value || !userId.value) return
    try { sessionStorage.removeItem(key()) } catch { /* Storage may be unavailable. */ }
  }
  return { recent, remember, clear }
}
