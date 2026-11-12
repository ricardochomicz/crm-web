import { ref, watch, type Ref } from 'vue'
import { opportunitiesApi } from '../api'
import { errorMessage } from '@/lib/feedback'
import { toast } from '@/services/toast'

/** Encapsulates opportunity highlights and guards stale tenant requests. */
export function useOpportunityHighlights(tenantId: Ref<string>) {
  const showHighlightsOnly = ref(false)
  const highlightedIds = ref<string[]>([])
  const highlightingId = ref<string | null>(null)
  let version = 0

  watch(tenantId, async id => {
    const current = ++version
    highlightedIds.value = []
    showHighlightsOnly.value = false
    if (!id) return
    try {
      const response = await opportunitiesApi.highlights(id)
      if (current === version) highlightedIds.value = response.data
    } catch (cause) {
      if (current === version) toast.error('Não foi possível carregar os destaques: ' + errorMessage(cause))
    }
  }, { immediate: true })

  async function toggleHighlight(id: string, highlighted: boolean) {
    if (highlightingId.value || !tenantId.value) return
    highlightingId.value = id
    const currentTenant = tenantId.value
    try {
      await opportunitiesApi.setHighlight(currentTenant, id, highlighted)
      if (currentTenant === tenantId.value) {
        highlightedIds.value = highlighted
          ? [...new Set([...highlightedIds.value, id])]
          : highlightedIds.value.filter(value => value !== id)
      }
    } catch (cause) {
      toast.error('Não foi possível salvar o destaque: ' + errorMessage(cause))
    } finally {
      highlightingId.value = null
    }
  }

  return { showHighlightsOnly, highlightedIds, highlightingId, toggleHighlight }
}
