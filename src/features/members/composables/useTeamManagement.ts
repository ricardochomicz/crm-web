import { computed, ref } from 'vue'
import { tenantApi } from '@/features/tenants/api'
import type { Page, Subscription, Tenant } from '@/features/tenants/types'
import { errorMessage } from '@/lib/feedback'
import { teamApi } from '../api'
import type { Invitation, InvitationStatus, Member } from '../types'
export function useTeamManagement(tenantId: string) {
  const tenant = ref<Tenant>()
  const loading = ref(true)
  const error = ref('')
  const members = ref<Page<Member>>()
  const invitations = ref<Page<Invitation>>()
  const subscription = ref<Subscription>()
  const membersLoading = ref(false)
  const invitationsLoading = ref(false)
  const subscriptionLoading = ref(false)
  const membersError = ref('')
  const invitationsError = ref('')
  const subscriptionError = ref('')
  const memberPage = ref(1)
  const invitationPage = ref(1)
  const invitationFilter = ref<InvitationStatus | ''>('')
  const isOwner = computed(() => tenant.value?.role === 'OWNER')
  const canWrite = computed(
    () =>
      isOwner.value &&
      !subscriptionLoading.value &&
      !!subscription.value?.allows_operational_writes,
  )
  const inviteBlockedReason = computed(() => {
    if (subscriptionLoading.value) return 'Conferindo a disponibilidade de vagas…'
    if (!subscription.value) return 'Atualize os dados da assinatura para convidar pessoas.'
    if (!canWrite.value) return 'A assinatura não permite novos convites no momento.'
    if (subscription.value.remaining.users <= 0)
      return 'Não há vagas disponíveis. Revogue um convite pendente ou revise seu plano.'
    return ''
  })
  const refreshing = computed(
    () => membersLoading.value || invitationsLoading.value || subscriptionLoading.value,
  )
  function resendBlockedReason(invitation: Invitation): string {
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
    if (!isOwner.value) return
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
    if (!isOwner.value) return
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
    if (!isOwner.value) return
    subscriptionLoading.value = true
    subscriptionError.value = ''
    subscription.value = undefined
    try {
      subscription.value = (await tenantApi.subscription(tenantId)).data
    } catch (failure) {
      subscriptionError.value = errorMessage(failure)
    } finally {
      subscriptionLoading.value = false
    }
  }
  async function refresh() {
    await Promise.all([loadMembers(), loadInvitations(), loadSubscription()])
  }
  async function load() {
    loading.value = true
    error.value = ''
    try {
      tenant.value = (await tenantApi.show(tenantId)).data
      if (isOwner.value) await refresh()
    } catch (failure) {
      tenant.value = undefined
      error.value = errorMessage(failure)
    } finally {
      loading.value = false
    }
  }
  return {
    tenant,
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
    isOwner,
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
