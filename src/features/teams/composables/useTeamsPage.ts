import { computed, onMounted, ref, watch, type Ref } from 'vue'
import { useRoute } from 'vue-router'
import { tenantApi } from '@/features/tenants/api'
import { can, type Tenant } from '@/features/tenants/types'
import { errorMessage } from '@/lib/feedback'
import { toast } from '@/services/toast'
import { useTeamsList } from './useTeamsList'
import type { Team } from '../types'

export function useTeamsPage(tenantId: Ref<string>) {
  const route = useRoute()
  const tenant = ref<Tenant>()
  const loading = ref(true)
  const error = ref('')
  const {
    teams, teamsLoading, teamsError, teamsPage, teamNameFilter,
    allMembers, membersLoading, loadTeams, loadMembers, searchTeams, clearTeamSearch,
  } = useTeamsList(tenantId)

  const createOpen = ref(false)
  const editingTeam = ref<Team | null>(null)
  const supervisorTeam = ref<Team | null>(null)
  const viewingTeam = ref<Team | null>(null)
  const canWrite = computed(() => !!tenant.value?.access?.allows_operational_writes)
  const canCreate = computed(() => can(tenant.value, 'teams.create'))
  const canUpdate = computed(() => can(tenant.value, 'teams.update'))
  const canUpdateSupervisor = computed(() => can(tenant.value, 'teams.supervisor'))
  const anyDialogOpen = computed(() =>
    createOpen.value || !!editingTeam.value || !!supervisorTeam.value || !!viewingTeam.value,
  )

  async function loadTenant(id: string) {
    try {
      const result = await tenantApi.show(id)
      if (tenantId.value === id) tenant.value = result.data
    } catch (failure) {
      if (tenantId.value === id) error.value = errorMessage(failure)
    }
  }

  async function load() {
    const id = tenantId.value
    loading.value = true
    error.value = ''
    await Promise.all([loadTenant(id), loadTeams(1), loadMembers()])
    if (id !== tenantId.value) return
    loading.value = false
    if (route.query.createTeam === '1' && canCreate.value && canWrite.value) openCreate()
  }

  async function refresh() {
    await Promise.all([loadTenant(tenantId.value), loadTeams(teamsPage.value)])
  }

  function openCreate() {
    if (canCreate.value && canWrite.value) createOpen.value = true
  }
  function openEdit(team: Team) {
    if (canUpdate.value && canWrite.value) editingTeam.value = team
  }
  function openSupervisor(team: Team) {
    if (canUpdateSupervisor.value && canWrite.value) supervisorTeam.value = team
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

  watch(tenantId, (id, previous) => {
    if (id === previous) return
    tenant.value = undefined
    createOpen.value = false
    editingTeam.value = null
    supervisorTeam.value = null
    viewingTeam.value = null
    void load()
  })
  onMounted(load)

  return {
    tenant, loading, error, teams, teamsLoading, teamsError, teamNameFilter,
    allMembers, membersLoading, loadTeams, searchTeams, clearTeamSearch,
    createOpen, editingTeam, supervisorTeam, viewingTeam, canWrite, canCreate,
    canUpdate, canUpdateSupervisor, anyDialogOpen, load, refresh, openCreate,
    openEdit, openSupervisor, openMembers, onCompleted,
  }
}
