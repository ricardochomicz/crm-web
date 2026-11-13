import { computed, ref, watch, type Ref } from 'vue'
import { tenantApi } from '@/features/tenants/api'
import type { Tenant } from '@/features/tenants/types'
import { clientsApi } from '@/features/clients/api'

/** Loads dialog permissions per tenant and ignores stale responses after closing or switching tenants. */
export function useOpportunityDialogPermissions(open: Readonly<Ref<boolean>>, tenantId: Readonly<Ref<string>>) {
  const viewerTenant = ref<Tenant | null>(null)
  const canCreateClient = ref(false)
  const showResponsible = computed(() => {
    const tenant = viewerTenant.value
    return !!tenant && (
      ['OWNER', 'MANAGER'].includes(tenant.role) ||
      (tenant.role === 'CONSULTANT' && !!tenant.access?.permissions.includes('teams.view'))
    )
  })
  let generation = 0

  watch([open, tenantId], async ([isOpen, tenant]) => {
    const current = ++generation
    viewerTenant.value = null
    canCreateClient.value = false
    if (!isOpen) return

    const [tenantResult, clientResult] = await Promise.allSettled([
      tenantApi.show(tenant),
      clientsApi.list(tenant),
    ])
    if (current !== generation || !open.value || tenant !== tenantId.value) return
    if (tenantResult.status === 'fulfilled') viewerTenant.value = tenantResult.value.data
    if (clientResult.status === 'fulfilled') canCreateClient.value = clientResult.value.meta.can_create
  }, { immediate: true })

  return { showResponsible, canCreateClient }
}
