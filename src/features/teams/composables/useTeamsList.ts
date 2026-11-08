import { ref, watch, type Ref } from 'vue'
import type { Page } from '@/features/tenants/types'
import { teamApi } from '@/features/members/api'
import { teamsApi } from '../api'
import type { Team } from '../types'
import { errorMessage } from '@/lib/feedback'

export type SupervisorOption = { id: string; name: string | null; email: string | null; status: string; role: string; role_name?: string | null }

/** Consulta paginada, filtros e opções de supervisor para a feature de equipes. */
export function useTeamsList(tenantId: Ref<string>) {
  const teams = ref<Page<Team>>()
  const teamsLoading = ref(false)
  const teamsError = ref('')
  const teamsPage = ref(1)
  const teamNameFilter = ref('')
  const appliedTeamName = ref('')
  const allMembers = ref<SupervisorOption[]>([])
  const supervisorAssignments = ref<Record<string, string>>({})
  const membersLoading = ref(false)
  let sequence = 0

  async function loadTeams(page = teamsPage.value) {
    const requestId = ++sequence
    const id = tenantId.value
    teamsLoading.value = true
    teamsError.value = ''
    try {
      const result = await teamsApi.list(id, page, appliedTeamName.value)
      if (requestId !== sequence || id !== tenantId.value) return
      teams.value = result
      teamsPage.value = page
      // Collect supervisors across all pages, not just the current filtered table.
      const assignments: Record<string, string> = {}
      const first = await teamsApi.list(id, 1)
      const allTeams = [...first.data]
      for (let p = 2; p <= first.last_page; p++) {
        const part = await teamsApi.list(id, p)
        allTeams.push(...part.data)
      }
      if (requestId !== sequence || id !== tenantId.value) return
      for (const team of allTeams) if (team.supervisor) assignments[team.supervisor.membership_id] = team.name
      supervisorAssignments.value = assignments
    } catch (failure) {
      if (requestId === sequence) teamsError.value = errorMessage(failure)
    } finally {
      if (requestId === sequence) teamsLoading.value = false
    }
  }

  async function loadMembers() {
    const id = tenantId.value
    membersLoading.value = true
    allMembers.value = []
    try {
      const firstPage = await teamApi.members(id, 1)
      const members = [...firstPage.data]
      for (let page = 2; page <= firstPage.last_page; page++) {
        const result = await teamApi.members(id, page)
        members.push(...result.data)
      }
      if (id === tenantId.value) allMembers.value = members
    } catch (failure) {
      if (id === tenantId.value) teamsError.value = errorMessage(failure)
    } finally {
      if (id === tenantId.value) membersLoading.value = false
    }
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

  watch(tenantId, () => {
    ++sequence
    teams.value = undefined
    teamsPage.value = 1
    teamNameFilter.value = ''
    appliedTeamName.value = ''
    allMembers.value = []
    supervisorAssignments.value = {}
  })

  return {
    teams, teamsLoading, teamsError, teamsPage, teamNameFilter,
    allMembers, supervisorAssignments, membersLoading, loadTeams, loadMembers, searchTeams, clearTeamSearch,
  }
}
