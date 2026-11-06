<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import AsyncNotice from '@/components/ui/AsyncNotice.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import PagePagination from '@/components/ui/PagePagination.vue'
import ListFilters from '@/components/ui/ListFilters.vue'
import { tenantApi } from '@/features/tenants/api'
import { can } from '@/features/tenants/types'
import type { Tenant, Page } from '@/features/tenants/types'
import { teamApi } from '@/features/members/api'
import { errorMessage } from '@/lib/feedback'
import { toast } from '@/services/toast'
import { teamsApi } from '../api'
import type { Team } from '../types'
import TeamsTable from '../components/TeamsTable.vue'
import CreateTeamDialog from '../components/CreateTeamDialog.vue'
import EditTeamDialog from '../components/EditTeamDialog.vue'
import TeamMembersDrawer from '../components/TeamMembersDrawer.vue'

const route = useRoute()
const tenantId = String(route.params.tenantId)

const tenant = ref<Tenant>()
const loading = ref(true)
const error = ref('')

const teams = ref<Page<Team>>()
const teamsLoading = ref(false)
const teamsError = ref('')
const teamsPage = ref(1)
const teamNameFilter = ref('')
const appliedTeamName = ref('')

/** Lista de membros para selects de supervisor */
type SupervisorOption = { id: string; name: string | null; email: string | null; status: string }
const allMembers = ref<SupervisorOption[]>([])
const membersLoading = ref(false)

const createOpen = ref(false)
const editingTeam = ref<Team | null>(null)
const supervisorTeam = ref<Team | null>(null)
const viewingTeam = ref<Team | null>(null)


const canWrite = computed(() => !!tenant.value?.access?.allows_operational_writes)
const canCreate = computed(() => can(tenant.value, 'teams.create'))
const canUpdate = computed(() => can(tenant.value, 'teams.update'))
const canUpdateSupervisor = computed(() => can(tenant.value, 'teams.supervisor'))

const anyDialogOpen = computed(
  () => createOpen.value || !!editingTeam.value || !!supervisorTeam.value || !!viewingTeam.value,
)

async function loadTenant() {
  try {
    tenant.value = (await tenantApi.show(tenantId)).data
  } catch (failure) {
    error.value = errorMessage(failure)
  }
}

async function loadTeams(page = teamsPage.value) {
  teamsLoading.value = true
  teamsError.value = ''
  teamsPage.value = page
  try {
    teams.value = await teamsApi.list(tenantId, page, appliedTeamName.value)
  } catch (failure) {
    teamsError.value = errorMessage(failure)
  } finally {
    teamsLoading.value = false
  }
}

async function loadMembers() {
  membersLoading.value = true
  allMembers.value = []
  try {
    const firstPage = await teamApi.members(tenantId, 1)
    const members = [...firstPage.data]
    for (let page = 2; page <= firstPage.last_page; page++) {
      const result = await teamApi.members(tenantId, page)
      members.push(...result.data)
    }
    allMembers.value = members
  } catch (failure) {
    allMembers.value = []
    teamsError.value = errorMessage(failure)
  } finally {
    membersLoading.value = false
  }
}

async function load() {
  loading.value = true
  error.value = ''
  await Promise.all([loadTenant(), loadTeams(1), loadMembers()])
  loading.value = false
  if (route.query.createTeam === '1' && canCreate.value && canWrite.value) {
    openCreate()
  }
}

async function refresh() {
  await Promise.all([loadTenant(), loadTeams(teamsPage.value)])
}

function openCreate() {
  createOpen.value = true
}

function openEdit(team: Team) {
  editingTeam.value = team
}

function openSupervisor(team: Team) {
  notice.value = null
  supervisorTeam.value = team
}

function openMembers(team: Team) {
  viewingTeam.value = team
}

async function onCompleted(result: { message: string; tone: 'success' | 'warning' }) {
  createOpen.value = false
  editingTeam.value = null
  supervisorTeam.value = null
  if (result.tone === 'success') toast.success(result.message)
  else toast.warning(result.message)
  await refresh()
}

function searchTeams() {
  appliedTeamName.value = teamNameFilter.value.trim()
  void loadTeams(1)
}
function clearTeamSearch() {
  teamNameFilter.value = ''
  appliedTeamName.value = ''
  void loadTeams(1)
}

onMounted(load)
</script>

<template>
  <AppShell :tenant="tenant" :title="tenant?.name ?? 'Equipes'" subtitle="Gestão de equipes">
    <div class="mb-7 flex flex-wrap items-end justify-between gap-5">
      <div>
        <p class="eyebrow">ORGANIZAÇÃO INTERNA</p>
        <h1 class="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
          Equipes da empresa
        </h1>
        <p class="mt-3 text-sm text-slate-500">
          Organize os membros em equipes com supervisores definidos.
        </p>
      </div>
      <div v-if="!loading" class="flex gap-3">
        <button
          type="button"
          class="secondary-button"
          :disabled="teamsLoading || anyDialogOpen"
          @click="refresh"
        >
          {{ teamsLoading ? 'Atualizando…' : 'Atualizar' }}
        </button>
        <button
          v-if="canCreate"
          type="button"
          class="primary-button w-auto"
          :disabled="!canWrite || anyDialogOpen"
          :title="!canWrite ? 'A assinatura não permite criar equipes no momento.' : undefined"
          @click="openCreate"
        >
          <AppIcon name="mail" class="size-4" />Nova equipe
        </button>
      </div>
    </div>

    <AsyncNotice :loading="loading" :error="error" @retry="load" />

    <template v-if="!loading && !error">
      <AsyncNotice
        :loading="teamsLoading && !teams"
        :error="teamsError"
        label="Buscando equipes…"
        @retry="loadTeams()"
      />

      <template v-if="teams">
        <ListFilters :columns="1" :busy="teamsLoading || anyDialogOpen" :count-label="`${teams.total} equipe(s) encontrada(s)`" @search="searchTeams" @clear="clearTeamSearch">
          <label class="text-xs font-semibold text-slate-600">Nome da equipe
            <input v-model="teamNameFilter" type="search" class="field mt-2" placeholder="Digite o nome da equipe" />
          </label>
        </ListFilters>
        <TeamsTable
          :teams="teams.data"
          :can-update="canUpdate"
          :can-update-supervisor="canUpdateSupervisor"
          :busy="anyDialogOpen"
          @edit="openEdit"
          @edit-supervisor="openSupervisor"
          @view-members="openMembers"
        />
        <PagePagination
          :page="teams.current_page"
          :last-page="teams.last_page"
          :total="teams.total"
          :busy="anyDialogOpen"
          class="mt-4"
          @change="loadTeams"
        />
      </template>
    </template>

    <CreateTeamDialog
      :open="createOpen"
      :tenant-id="tenantId"
      :can-write="canWrite"
      :members="allMembers"
      :members-loading="membersLoading"
      @close="createOpen = false"
      @completed="onCompleted"
    />

    <EditTeamDialog
      :team="editingTeam"
      :tenant-id="tenantId"
      :can-write="canWrite"
      :members="allMembers"
      :members-loading="membersLoading"
      @close="editingTeam = null"
      @completed="onCompleted"
    />

    <EditTeamDialog
      :team="supervisorTeam"
      :tenant-id="tenantId"
      :can-write="canWrite"
      :members="allMembers"
      :members-loading="membersLoading"
      supervisor-mode
      @close="supervisorTeam = null"
      @completed="onCompleted"
    />

    <TeamMembersDrawer
      :tenant-id="tenantId"
      :team="viewingTeam"
      @close="viewingTeam = null"
    />
  </AppShell>
</template>
