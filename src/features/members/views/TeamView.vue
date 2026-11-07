<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import AsyncNotice from '@/components/ui/AsyncNotice.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import PagePagination from '@/components/ui/PagePagination.vue'
import ListFilters from '@/components/ui/ListFilters.vue'
import SearchSelect from '@/components/ui/SearchSelect.vue'
import { useAuthStore } from '@/features/auth/store'
import { useTeamManagement } from '../composables/useTeamManagement'
import MembersTable from '../components/MembersTable.vue'
import MemberProfileDialog from '../components/MemberProfileDialog.vue'
import type { Member } from '../types'
import InvitationsTable from '../components/InvitationsTable.vue'
import InviteMemberDialog from '../components/InviteMemberDialog.vue'
import TeamActionDialog from '../components/TeamActionDialog.vue'
import type { TeamAction, TeamNotice } from '../types'
import { toast } from '@/services/toast'
const tenantId = String(useRoute().params.tenantId)
const auth = useAuthStore()
const {
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
} = useTeamManagement(tenantId)
const tab = ref<'members' | 'invitations'>('members')
watch([canViewMembers, canViewInvitations], () => {
  if (!canViewMembers.value && canViewInvitations.value) tab.value = 'invitations'
  else if (!canViewInvitations.value && canViewMembers.value) tab.value = 'members'
})
const inviteOpen = ref(false)
const profileMember = ref<Member | null>(null)
const action = ref<TeamAction | null>(null)
const actionAllowed = computed(() =>
  action.value
    ? has(
        {
          role: 'members.role',
          status: 'members.status',
          remove: 'members.remove',
          resend: 'invitations.resend',
          revoke: 'invitations.revoke',
        }[action.value.kind],
      )
    : false,
)
const modalOpen = computed(() => inviteOpen.value || !!action.value || !!profileMember.value)
const usedSeats = computed(() =>
  subscription.value
    ? subscription.value.usage.users + subscription.value.usage.reserved_invitations
    : 0,
)
const usagePercent = computed(() =>
  subscription.value
    ? Math.min(100, (usedSeats.value / Math.max(subscription.value.limits.users, 1)) * 100)
    : 0,
)
const actionResendBlocked = computed(() =>
  action.value?.kind === 'resend' ? resendBlockedReason(action.value.invitation) : '',
)
function profileSaved() {
  profileMember.value = null
  toast.success('Cadastro do colaborador atualizado.')
  void loadMembers()
}
function openInvite() {
  if (!inviteBlockedReason.value) inviteOpen.value = true
}
function openAction(value: TeamAction) {
  action.value = value
}
function filterInvitations() {
  void loadInvitations(1)
}
async function completed(result: TeamNotice, created = false) {
  inviteOpen.value = false
  action.value = null
  if (result.tone === 'success') toast.success(result.message)
  else toast.warning(result.message)
  if (created) {
    tab.value = 'invitations'
    invitationFilter.value = ''
    invitationPage.value = 1
  }
  await refresh()
}
function keyboardTab(event: KeyboardEvent) {
  if (!canViewMembers.value || !canViewInvitations.value) return
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
  event.preventDefault()
  tab.value =
    event.key === 'Home'
      ? 'members'
      : event.key === 'End'
        ? 'invitations'
        : tab.value === 'members'
          ? 'invitations'
          : 'members'
  document.getElementById(`tab-${tab.value}`)?.focus()
}
onMounted(load)
</script>
<template>
  <AppShell :tenant="tenant" :title="tenant?.name ?? 'Sua equipe'" subtitle="Gestão de acesso">
    <div class="mb-7 flex flex-wrap items-center justify-between gap-4">
      <div>
        <p class="eyebrow">AS PESSOAS FAZEM A DIFERENÇA</p>
        <h1 class="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
          Sua equipe, mais conectada.
        </h1>
        <p class="mt-2 text-sm text-slate-500">
          Gerencie quem faz parte da empresa e convide novas pessoas.
        </p>
      </div>
      <div v-if="canAccess && !loading" class="flex gap-3">
        <button
          type="button"
          class="secondary-button"
          :disabled="refreshing || modalOpen"
          @click="refresh"
        >
          {{ refreshing ? 'Atualizando…' : 'Atualizar' }}</button
        ><button
          type="button"
          v-if="has('invitations.create')"
          class="primary-button w-auto"
          :disabled="!!inviteBlockedReason || modalOpen"
          :title="inviteBlockedReason"
          @click="openInvite"
        >
          <AppIcon name="mail" class="size-4" />Convidar pessoa
        </button>
      </div>
    </div>
    <AsyncNotice :loading="loading" :error="error || subscriptionError" @retry="load" />
    <section
      v-if="!loading && tenant && !canAccess"
      class="rounded-2xl border border-stone-200 bg-white p-8"
    >
      <AppIcon name="lock" class="mb-4 size-8 text-orange-600" />
      <h2 class="text-lg font-semibold">Seu cargo não permite acessar esta área.</h2>
      <p class="mt-3 text-sm leading-7 text-slate-500">
        Para solicitar acesso, entre em contato com o proprietário desta empresa.
      </p>
      <RouterLink :to="`/empresas/${tenant.id}`" class="secondary-button mt-5"
        >Voltar à visão geral</RouterLink
      >
    </section>
    <template v-if="!loading && canAccess">
      <AsyncNotice v-if="subscriptionError" :error="subscriptionError" @retry="loadSubscription" />
      <section
        v-if="subscription"
        class="mb-7 grid overflow-hidden rounded-2xl border border-stone-200 bg-white md:grid-cols-[1.2fr_2fr]"
      >
        <div class="border-b border-stone-100 bg-[#f3f5f0] p-6 md:border-b-0 md:border-r">
          <div class="flex items-center justify-between gap-3">
            <h2 class="text-sm font-semibold">Capacidade da equipe</h2>
            <span class="rounded-full bg-white px-2.5 py-1 text-[10px] font-medium text-slate-500"
              >Vagas do plano</span
            >
          </div>
          <p class="mt-5 text-3xl font-semibold tracking-tight">
            {{ usedSeats
            }}<span class="text-base font-normal text-slate-400">
              / {{ subscription.limits.users }} vagas</span
            >
          </p>
          <div
            role="progressbar"
            aria-label="Ocupação das vagas do plano"
            :aria-valuenow="Math.min(usedSeats, subscription.limits.users)"
            :aria-valuemax="subscription.limits.users"
            aria-valuemin="0"
            class="mt-4 h-1.5 overflow-hidden rounded-full bg-stone-200"
          >
            <div
              class="h-full rounded-full transition-all motion-reduce:transition-none"
              :class="subscription.remaining.users ? 'bg-emerald-600' : 'bg-orange-500'"
              :style="{ width: `${usagePercent}%` }"
            />
          </div>
        </div>
        <dl class="grid grid-cols-3 gap-3 p-6">
          <div>
            <dt class="text-xs leading-5 text-slate-500">Vínculos</dt>
            <dd class="mt-4 text-2xl font-semibold">{{ subscription.usage.users }}</dd>
            <p class="mt-2 text-[10px] leading-5 text-slate-400">inclui suspensos</p>
          </div>
          <div>
            <dt class="text-xs leading-5 text-slate-500">Reservas</dt>
            <dd class="mt-4 text-2xl font-semibold">
              {{ subscription.usage.reserved_invitations }}
            </dd>
            <p class="mt-2 text-[10px] leading-5 text-slate-400">convites válidos</p>
          </div>
          <div>
            <dt class="text-xs leading-5 text-slate-500">Disponíveis</dt>
            <dd class="mt-4 text-2xl font-semibold text-emerald-700">
              {{ subscription.remaining.users }}
            </dd>
            <p class="mt-2 text-[10px] leading-5 text-slate-400">para convidar</p>
          </div>
        </dl>
      </section>
      <div
        v-if="subscription && !subscription.allows_operational_writes"
        role="status"
        class="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900"
      >
        Sua assinatura está bloqueada para alterações. Você pode consultar os dados autorizados para
        seu cargo. A revogação de convites continua disponível quando permitida.
      </div>
      <p
        v-else-if="inviteBlockedReason && !subscriptionLoading"
        class="mb-6 rounded-xl bg-stone-100 p-4 text-xs leading-6 text-slate-600"
      >
        {{ inviteBlockedReason }}
      </p>
      <div class="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div
          role="tablist"
          aria-label="Gestão da equipe"
          class="inline-flex rounded-xl border border-stone-200 bg-white p-1"
          @keydown="keyboardTab"
        >
          <button
            v-if="canViewMembers"
            id="tab-members"
            role="tab"
            :aria-selected="tab === 'members'"
            aria-controls="panel-members"
            :tabindex="tab === 'members' ? 0 : -1"
            class="rounded-lg px-5 py-2.5 text-sm font-medium"
            :class="
              tab === 'members' ? 'bg-[#202a26] text-white' : 'text-slate-500 hover:bg-stone-50'
            "
            @click="tab = 'members'"
          >
            Membros<span v-if="members" class="ml-2 text-xs opacity-60">{{
              members.total
            }}</span></button
          ><button
            v-if="canViewInvitations"
            id="tab-invitations"
            role="tab"
            :aria-selected="tab === 'invitations'"
            aria-controls="panel-invitations"
            :tabindex="tab === 'invitations' ? 0 : -1"
            class="rounded-lg px-5 py-2.5 text-sm font-medium"
            :class="
              tab === 'invitations' ? 'bg-[#202a26] text-white' : 'text-slate-500 hover:bg-stone-50'
            "
            @click="tab = 'invitations'"
          >
            Convites
          </button>
        </div>

      </div>
      <section
        v-show="tab === 'members' && canViewMembers"
        id="panel-members"
        role="tabpanel"
        aria-labelledby="tab-members"
        tabindex="0"
      >
        <AsyncNotice
          :loading="membersLoading"
          :error="membersError"
          label="Buscando as pessoas da equipe…"
          @retry="loadMembers()"
        /><template v-if="!membersLoading && !membersError && members"
          ><MembersTable
            :members="members.data"
            :can-write="canWrite"
            :can-view-profiles="has('members.profile.view')"
            :can-edit-profiles="has('members.profile.update')"
            :can-change-role="has('members.role')"
            :can-change-status="has('members.status')"
            :can-remove="has('members.remove')"
            :busy="modalOpen"
            :user-id="auth.user?.id"
            @action="openAction"
            @profile="profileMember = $event" /><PagePagination
            :page="members.current_page"
            :last-page="members.last_page"
            :total="members.total"
            :busy="membersLoading || modalOpen"
            @change="loadMembers"
        /></template>
        <p class="mt-4 text-xs leading-6 text-slate-400">
          Suspender preserva o vínculo e não libera vaga. Desvincular libera a vaga, mas exige retirar a pessoa das equipes e supervisões. O proprietário é protegido.
        </p>
      </section>
      <section
        v-show="tab === 'invitations' && canViewInvitations"
        id="panel-invitations"
        role="tabpanel"
        aria-labelledby="tab-invitations"
        tabindex="0"
      >
        <ListFilters
          :columns="1"
          :busy="invitationsLoading || modalOpen"
          :count-label="`${invitations?.total ?? 0} convite(s) encontrado(s)`"
          @search="filterInvitations"
          @clear="invitationFilter = ''; filterInvitations()"
        >
          <label class="text-xs font-semibold text-slate-600">
            Situação do convite
            <SearchSelect
              v-model="invitationFilter"
              :disabled="invitationsLoading || modalOpen"
              :options="[
                { value: '', label: 'Todos os convites' },
                { value: 'PENDING', label: 'Pendentes e expirados' },
                { value: 'ACCEPTED', label: 'Aceitos' },
                { value: 'REVOKED', label: 'Revogados' },
              ]"
            />
          </label>
        </ListFilters>
        <AsyncNotice
          :loading="invitationsLoading"
          :error="invitationsError"
          label="Buscando os convites da empresa…"
          @retry="loadInvitations()"
        /><template v-if="!invitationsLoading && !invitationsError && invitations"
          ><InvitationsTable
            :invitations="invitations.data"
            :can-resend="has('invitations.resend')"
            :can-revoke="has('invitations.revoke')"
            :busy="modalOpen"
            :resend-blocked-reason="resendBlockedReason"
            @action="openAction" /><PagePagination
            :page="invitations.current_page"
            :last-page="invitations.last_page"
            :total="invitations.total"
            :busy="invitationsLoading || modalOpen"
            @change="loadInvitations"
        /></template>
        <p class="mt-4 text-xs leading-6 text-slate-400">
          Somente convites pendentes e ainda válidos reservam vagas. Datas exibidas no seu horário
          local.
        </p>
      </section>
    </template>
    <MemberProfileDialog :tenant-id="tenantId" :member="profileMember"
      :can-edit="has('members.profile.update')" :can-write="canWrite"
      @close="profileMember = null" @saved="profileSaved" />
    <InviteMemberDialog
      :open="inviteOpen"
      :allowed-roles="allowedRoles"
      :company-roles="companyRoles"
      :tenant-id="tenantId"
      :blocked-reason="inviteBlockedReason"
      @close="inviteOpen = false"
      @completed="completed($event, true)"
    /><TeamActionDialog
      :action="action"
      :allowed="actionAllowed"
      :allowed-roles="allowedRoles"
      :company-roles="companyRoles"
      :tenant-id="tenantId"
      :can-write="canWrite"
      :resend-blocked="actionResendBlocked"
      @close="action = null"
      @completed="completed($event)"
    />
  </AppShell>
</template>
