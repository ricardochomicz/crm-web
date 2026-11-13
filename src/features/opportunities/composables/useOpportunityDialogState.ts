import { ref, type Ref } from 'vue'
import { opportunitiesApi, type Opportunity } from '../api'
import { errorMessage } from '@/lib/feedback'
import { toast } from '@/services/toast'

type DialogTab = 'details' | 'history'

interface OpportunityDialogDependencies {
  tenantId: Readonly<Ref<string>>
  reload: () => void
  refreshOverview: () => void
}

/** Owns the opportunity editor's selected record, tab and open/close lifecycle. */
export function useOpportunityDialogState(deps: OpportunityDialogDependencies) {
  const dialogTab = ref<DialogTab>('details')
  const dialogOpen = ref(false)
  const editing = ref<Opportunity | null>(null)
  let requestVersion = 0

  async function open(item: Opportunity | null = null, tab: DialogTab = 'details') {
    const current = ++requestVersion
    const tenant = deps.tenantId.value
    dialogTab.value = tab

    if (item) {
      try {
        const detail = await opportunitiesApi.show(tenant, item.id)
        if (current !== requestVersion || tenant !== deps.tenantId.value) return
        editing.value = detail.data
      } catch (e) {
        if (current === requestVersion && tenant === deps.tenantId.value) {
          toast.error(errorMessage(e))
        }
        return
      }
    } else {
      editing.value = null
    }

    if (current === requestVersion && tenant === deps.tenantId.value) dialogOpen.value = true
  }

  function saved() {
    dialogOpen.value = false
    toast.success('Oportunidade salva.')
    deps.reload()
    deps.refreshOverview()
  }

  return { dialogTab, dialogOpen, editing, open, saved }
}
