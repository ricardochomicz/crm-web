import { computed, ref } from 'vue'
import { tenantApi } from '@/features/tenants/api'
import { can, canViewTeam, type Page, type Tenant } from '@/features/tenants/types'
import { errorMessage } from '@/lib/feedback'
import { teamApi, type CompanyRole } from '../api'
import type { AssignableRole, Invitation, InvitationStatus, Member } from '../types'
export function useTeamManagement(tenantId: string) {
  const tenant = ref<Tenant>()
  const loading = ref(true)
  const error = ref('')
  const members = ref<Page<Member>>()
  const companyRoles = ref<CompanyRole[]>([])
  const invitations = ref<Page<Invitation>>()
  const membersLoading = ref(false)
  const invitationsLoading = ref(false)
  const subscriptionLoading = ref(false)
  const membersError = ref('')
  const invitationsError = ref('')
  const subscriptionError = ref('')
  const memberPage = ref(1)
  const invitationPage = ref(1)
  const invitationFilter = ref<InvitationStatus | ''>('')
  const has = (permission: string) => can(tenant.value, permission)
  const canAccess = computed(() => canViewTeam(tenant.value))
  const canViewMembers = computed(() => has('members.view'))
  const canViewInvitations = computed(() => has('invitations.view'))
  const allowedRoles = computed<AssignableRole[]>(() => {
    // The membership role is authoritative for these management choices. Avoid
    // hiding valid roles when an older tenant response returns a partial list.
    if (tenant.value?.role === 'OWNER') return ['MANAGER', 'CONSULTANT', 'ASSISTANT']
    if (tenant.value?.role === 'MANAGER') return ['CONSULTANT', 'ASSISTANT']
    return tenant.value?.access?.assignable_roles ?? []
  })
  const subscription = computed(() =>
    tenant.value?.access?.capacity
      ? {
          ...tenant.value.access.capacity,
          allows_operational_writes: tenant.value.access.allows_operational_writes,
        }
      : undefined,
  )
  const canWrite = computed(
    () =>
      !subscriptionLoading.value &&
      !subscriptionError.value &&
      !!tenant.value?.access?.allows_operational_writes,
  )
  const inviteBlockedReason = computed(() => {
    if (!has('invitations.create')) return 'Seu cargo não permite convidar pessoas.'
    if (!allowedRoles.value.length) return 'Nenhum cargo disponível para atribuição.'
    if (subscriptionLoading.value) return 'Conferindo a disponibilidade de vagas…'
    if (!subscription.value || subscriptionError.value)
      return 'Atualize os dados da empresa para convidar pessoas.'
    if (!canWrite.value) return 'A assinatura não permite novos convites no momento.'
    if (subscription.value.remaining.users <= 0)
      return 'Não há vagas disponíveis. Revogue um convite pendente ou revise seu plano.'
    return ''
  })
  const refreshing = computed(
    () => membersLoading.value || invitationsLoading.value || subscriptionLoading.value,
  )
  function resendBlockedReason(invitation: Invitation): string {
    if (!has('invitations.resend')) return 'Seu cargo não permite reenviar convites.'
    if (!allowedRoles.value.includes(invitation.role)) return 'Você não pode atribuir este cargo.'
    if (!canWrite.value || !subscription.value)
      return 'A assinatura precisa permitir alterações para reenviar.'
    const otherSeats =
      subscription.value.usage.users +
      subscription.value.usage.reserved_invitations -
      (invitation.reserves_seat ? 1 : 0)
    return otherSeats >= subscription.value.limits.users
      ? 'Não há vaga disponível para renovar este convite.'
      : ''
  }
  async function loadMembers(page = memberPage.value) {
    if (!canViewMembers.value) {
      members.value = undefined
      return
    }
    membersLoading.value = true
    membersError.value = ''
    memberPage.value = page
    try {
      members.value = await teamApi.members(tenantId, page)
    } catch (failure) {
      membersError.value = errorMessage(failure)
    } finally {
      membersLoading.value = false
    }
  }
  async function loadInvitations(page = invitationPage.value) {
    if (!canViewInvitations.value) {
      invitations.value = undefined
      return
    }
    invitationsLoading.value = true
    invitationsError.value = ''
    invitationPage.value = page
    try {
      invitations.value = await teamApi.invitations(tenantId, page, invitationFilter.value)
    } catch (failure) {
      invitationsError.value = errorMessage(failure)
    } finally {
      invitationsLoading.value = false
    }
  }
  async function loadSubscription() {
    subscriptionLoading.value = true
    subscriptionError.value = ''
    try {
      tenant.value = (await tenantApi.show(tenantId)).data
      companyRoles.value = (await teamApi.roles(tenantId)).data
    } catch (failure) {
      tenant.value = undefined
      subscriptionError.value = errorMessage(failure)
    } finally {
      subscriptionLoading.value = false
    }
  }
  async function refresh() {
    await loadSubscription()
    await Promise.all([loadMembers(), loadInvitations()])
  }
  async function load() {
    subscriptionError.value = ''
    loading.value = true
    error.value = ''
    try {
      tenant.value = (await tenantApi.show(tenantId)).data
      await Promise.all([loadMembers(), loadInvitations()])
    } catch (failure) {
      tenant.value = undefined
      error.value = errorMessage(failure)
    } finally {
      loading.value = false
    }
  }
  return {
    tenant,
    companyRoles,
    loading,
    error,
    members,
    invitations,
    subscription,
    membersLoading,
    invitationsLoading,
    subscriptionLoading,
    membersError,
    invitationsError,
    subscriptionError,
    memberPage,
    invitationPage,
    invitationFilter,
    canAccess,
    canViewMembers,
    canViewInvitations,
    has,
    allowedRoles,
    canWrite,
    inviteBlockedReason,
    refreshing,
    resendBlockedReason,
    loadMembers,
    loadInvitations,
    loadSubscription,
    refresh,
    load,
  }
}
