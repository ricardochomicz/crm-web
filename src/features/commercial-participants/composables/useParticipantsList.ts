import { ref, watch, type Ref } from 'vue'
import { participantsApi, type Participant } from '../api'
import { errorMessage } from '@/lib/feedback'
import { toast } from '@/services/toast'

/** Estado e consultas da listagem de participantes, isolados da apresentação. */
export function useParticipantsList(tenantId: Ref<string>) {
  const rows = ref<Participant[]>([])
  const currentPage = ref(1)
  const lastPage = ref(1)
  const total = ref(0)
  const filtersBusy = ref(false)
  const canManage = ref(false)
  const search = ref('')
  const filterRole = ref('')
  const appliedSearch = ref('')
  const appliedRole = ref('')
  let requestSequence = 0

  async function loadRows(page = currentPage.value) {
    const sequence = ++requestSequence
    const id = tenantId.value
    filtersBusy.value = true
    try {
      const result = await participantsApi.list(id, page, appliedSearch.value, appliedRole.value)
      if (sequence !== requestSequence || id !== tenantId.value) return
      rows.value = result.data
      currentPage.value = result.meta.current_page
      lastPage.value = result.meta.last_page
      total.value = result.meta.total
      canManage.value = result.meta.can_manage
    } catch (error) {
      if (sequence === requestSequence) toast.error(errorMessage(error))
    } finally {
      if (sequence === requestSequence) filtersBusy.value = false
    }
  }

  function applyFilters() {
    appliedSearch.value = search.value.trim()
    appliedRole.value = filterRole.value
    void loadRows(1)
  }

  function clearFilters() {
    search.value = ''
    filterRole.value = ''
    applyFilters()
  }

  watch(tenantId, () => {
    ++requestSequence
    rows.value = []
    currentPage.value = 1
    lastPage.value = 1
    total.value = 0
    search.value = ''
    filterRole.value = ''
    appliedSearch.value = ''
    appliedRole.value = ''
    filtersBusy.value = false
  })

  return {
    rows, currentPage, lastPage, total, filtersBusy, canManage,
    search, filterRole, appliedSearch, appliedRole,
    loadRows, applyFilters, clearFilters,
  }
}
