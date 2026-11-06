<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import AsyncNotice from '@/components/ui/AsyncNotice.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import PagePagination from '@/components/ui/PagePagination.vue'
import ListFilters from '@/components/ui/ListFilters.vue'
import TeamsTable from '../components/TeamsTable.vue'
import CreateTeamDialog from '../components/CreateTeamDialog.vue'
import EditTeamDialog from '../components/EditTeamDialog.vue'
import TeamMembersDrawer from '../components/TeamMembersDrawer.vue'
import { useTeamsPage } from '../composables/useTeamsPage'

const route = useRoute()
const tenantId = computed(() => String(route.params.tenantId))
const {
  tenant,
  loading,
  error,
  teams,
  teamsLoading,
  teamsError,
  teamNameFilter,
  allMembers,
  membersLoading,
  loadTeams,
  searchTeams,
  clearTeamSearch,
  createOpen,
  editingTeam,
  supervisorTeam,
  viewingTeam,
  canWrite,
  canCreate,
  canUpdate,
  canUpdateSupervisor,
  anyDialogOpen,
  load,
  refresh,
  openCreate,
  openEdit,
  openSupervisor,
  openMembers,
  onCompleted,
} = useTeamsPage(tenantId)
</script>
<template>
  <AppShell :tenant="tenant" :title="tenant?.name ?? 'Equipes'" subtitle="Gestão de equipes">
    <div class="mb-7 flex flex-wrap items-center justify-between gap-4">
      <div>
        <p class="eyebrow">ORGANIZAÇÃO INTERNA</p>
        <h1 class="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
          Equipes da empresa
        </h1>
        <p class="mt-2 text-sm text-slate-500">
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
        <ListFilters
          :columns="1"
          :busy="teamsLoading || anyDialogOpen"
          :count-label="`${teams.total} equipe(s) encontrada(s)`"
          @search="searchTeams"
          @clear="clearTeamSearch"
        >
          <label class="text-xs font-semibold text-slate-600"
            >Nome da equipe
            <input
              v-model="teamNameFilter"
              type="search"
              class="field"
              placeholder="Digite o nome da equipe"
            />
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
          :busy="teamsLoading || anyDialogOpen"
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

    <TeamMembersDrawer :tenant-id="tenantId" :team="viewingTeam" @close="viewingTeam = null" />
  </AppShell>
</template>
