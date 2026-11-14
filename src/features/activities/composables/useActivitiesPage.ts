import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useActivityDeepLink } from '../composables/useActivityDeepLink'
import { calendarApi } from '@/features/calendar/api'
import { subscribeActivityChanged } from '@/features/calendar/activityEvents'
import { subscribeCommercialRealtime } from '@/services/realtime/orders'
import type { CalendarEvent } from '@/features/calendar/types'
import { tenantApi } from '@/features/tenants/api'
import { can, type Tenant } from '@/features/tenants/types'
import { errorMessage } from '@/lib/feedback'
import { toast } from '@/services/toast'
import { activityUrgency, activityUrgencyLabels } from '../utils/activityUrgency'

export function useActivitiesPage() {
  const route = useRoute()
  const tenantId = String(route.params.tenantId)
  const activityLink = useActivityDeepLink(computed(() => tenantId))
  const activityLinkLoading = activityLink.loading
  const activityLinkError = activityLink.error
  const tenant = ref<Tenant>()
  const events = ref<CalendarEvent[]>([])
  const loading = ref(false)
  const refreshing = ref(false)
  const completingIds = ref<string[]>([])
  const refreshError = ref('')
  const hasLoaded = ref(false)
  const error = ref('')
  const scope = ref<'mine' | 'team'>('mine')
  const filter = ref<'pending' | 'overdue' | 'critical' | 'completed' | 'cancelled' | 'all'>('pending')
  const consultantId = ref('')
  const consultants = ref<{ id: string; name: string }[]>([])
  const consultantsError = ref('')
  const search = ref('')
  const appliedSearch = ref('')
  const dialogOpen = activityLink.dialogOpen
  const selected = activityLink.selected
  const historyEvent = ref<CalendarEvent | null>(null)
  const now = ref(Date.now())
  const page = ref(1)
  const pagination = ref({ current_page: 1, last_page: 1, total: 0, per_page: 20 })
  const canCreate = computed(() => can(tenant.value, 'calendar.create') && !!tenant.value?.access?.allows_operational_writes)
  const canEdit = computed(() => can(tenant.value, 'calendar.update') && !!tenant.value?.access?.allows_operational_writes)
  const canDelete = computed(() => can(tenant.value, 'calendar.delete') && !!tenant.value?.access?.allows_operational_writes)
  const canTeam = computed(() => can(tenant.value, 'calendar.team.view'))
  const urgency = (event: CalendarEvent) => activityUrgency(event, now.value)
  const isOverdue = (event: CalendarEvent) => urgency(event) === 'overdue'
  const visible = computed(() => events.value.filter(event => {
    if (filter.value === 'pending' || filter.value === 'overdue' || filter.value === 'critical') {
      return event.status === 'pending'
    }
    if (filter.value === 'completed') return event.status === 'completed'
    if (filter.value === 'cancelled') return event.status === 'cancelled'
    return true
  }))
  const overview = ref({ total: 0, pending: 0, overdue: 0, due_soon: 0, completed: 0, cancelled: 0 })
  const overviewLoading = ref(false)
  const overviewError = ref('')
  const overviewRefreshing = ref(false)
  let unsubscribeActivityChanged: (() => void) | undefined
  let unsubscribeRealtime: (() => void) | undefined
  let refreshTimer: ReturnType<typeof setTimeout> | undefined
  let pollingTimer: ReturnType<typeof setInterval> | undefined
  function scheduleRefresh() {
    if (document.hidden) return
    if (refreshTimer) clearTimeout(refreshTimer)
    refreshTimer = setTimeout(() => {
      refreshTimer = undefined
      void load(true)
      void loadOverview(true)
    }, 250)
  }
  function onVisibilityChange() {
    if (!document.hidden) scheduleRefresh()
  }
  let overviewVersion = 0
  async function loadOverview(background = false) {
    const current = ++overviewVersion
    if (background) overviewRefreshing.value = true
    else overviewLoading.value = true
    overviewError.value = ''
    try {
      const response = await calendarApi.activitiesOverview(tenantId, { scope: scope.value, search: appliedSearch.value,
        tenant_user_id: scope.value === 'team' ? consultantId.value || undefined : undefined })
      if (current === overviewVersion) overview.value = response.data
    } catch (e) {
      if (current === overviewVersion) overviewError.value = errorMessage(e)
    } finally {
      if (current === overviewVersion) {
        overviewLoading.value = false
        overviewRefreshing.value = false
      }
    }
  }
  const dateLabel = (value: string) => new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
  let version = 0
  async function load(background = false) {
    const current = ++version
    const silent = background && hasLoaded.value
    if (silent) {
      refreshing.value = true
      refreshError.value = ''
    } else {
      loading.value = true
      error.value = ''
    }
    try {
      // Reutiliza a agenda existente: nenhum segundo cadastro de tarefas é criado.
      const response = await calendarApi.activities(tenantId, { scope: scope.value, status: filter.value, search: appliedSearch.value,
        tenant_user_id: scope.value === 'team' ? consultantId.value || undefined : undefined,
        page: page.value, per_page: 20 })
      if (current === version) {
        // Never reintroduce a completed item while its reconciliation is pending.
        events.value = response.data.filter(item =>
          !completingIds.value.includes(item.id) || item.status !== 'pending'
        )
        pagination.value = response.meta
        now.value = Date.now()
        hasLoaded.value = true
        refreshError.value = ''
        if (page.value > response.meta.last_page && response.meta.last_page > 0) {
          page.value = response.meta.last_page
        }
      }
    } catch (e) {
      if (current === version) {
        if (silent) refreshError.value = errorMessage(e)
        else error.value = errorMessage(e)
      }
    } finally {
      if (current === version) {
        loading.value = false
        refreshing.value = false
      }
    }
  }
  onMounted(() => {
    if (canTeam.value) void loadConsultants()
    unsubscribeActivityChanged = subscribeActivityChanged(id => {
      if (id === tenantId) {
        scheduleRefresh()
      }
    })
    unsubscribeRealtime = subscribeCommercialRealtime(tenantId, scheduleRefresh)
    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('focus', scheduleRefresh)
    pollingTimer = setInterval(scheduleRefresh, 60000)
  })
  onUnmounted(() => {
    unsubscribeActivityChanged?.()
    unsubscribeRealtime?.()
    if (refreshTimer) clearTimeout(refreshTimer)
    if (pollingTimer) clearInterval(pollingTimer)
    document.removeEventListener('visibilitychange', onVisibilityChange)
    window.removeEventListener('focus', scheduleRefresh)
    version++
    overviewVersion++
  })
  watch([scope, filter, appliedSearch, consultantId], () => {
    if (page.value !== 1) page.value = 1
    else void load()
  }, { immediate: true })
  watch(page, () => { void load() })
  watch([scope, appliedSearch, consultantId], () => { void loadOverview() }, { immediate: true })
  watch(scope, value => {
    if (value !== 'team') consultantId.value = ''
  })
  watch(canTeam, allowed => {
    if (allowed && !consultants.value.length) void loadConsultants()
  })
  async function loadConsultants() {
    consultantsError.value = ''
    try {
      const response = await calendarApi.assignees(tenantId)
      consultants.value = response.data
    } catch (e) {
      consultantsError.value = errorMessage(e)
    }
  }

  function submitSearch() {
    const next = search.value.trim()
    if (appliedSearch.value !== next) {
      appliedSearch.value = next
    } else if (page.value !== 1) {
      page.value = 1
    } else {
      void load()
      void loadOverview()
    }
  }
  function clearFilters() {
    const changed = appliedSearch.value !== '' || filter.value !== 'all' ||
      scope.value !== 'mine' || consultantId.value !== '' || page.value !== 1
    search.value = ''
    appliedSearch.value = ''
    filter.value = 'all'
    scope.value = 'mine'
    consultantId.value = ''
    page.value = 1
    if (!changed) {
      void load()
      void loadOverview()
    }
  }
  function changePage(value: number) {
    if (value >= 1 && value <= pagination.value.last_page) page.value = value
  }
  void tenantApi.show(tenantId)
    .then(response => { tenant.value = response.data })
    .catch(e => { error.value = errorMessage(e) })
  function create() {
    selected.value = null
    dialogOpen.value = true
  }
  function edit(event: CalendarEvent) {
    if (scope.value !== 'mine') return
    selected.value = event
    dialogOpen.value = true
  }
  async function complete(event: CalendarEvent) {
    if (!canEdit.value || scope.value !== 'mine' || event.status !== 'pending' ||
      completingIds.value.includes(event.id)) return
    completingIds.value = [...completingIds.value, event.id]
    try {
      await calendarApi.update(tenantId, event.id, { status: 'completed' })
      // Invalidate requests started before the write, so stale results cannot undo it.
      ++version
      loading.value = false
      refreshing.value = false
      events.value = events.value.map(item =>
        item.id === event.id ? { ...item, status: 'completed' } : item
      )
      toast.success('Tarefa concluída.')
      scheduleRefresh()
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      completingIds.value = completingIds.value.filter(id => id !== event.id)
    }
  }
  function saved() {
    activityLink.close()
    toast.success('Atividade salva.')
    scheduleRefresh()
  }

  return {
    completingIds, refreshing, refreshError, tenantId, activityLinkLoading,
    activityLinkError, tenant, events, loading, error, scope, filter,
    consultantId, consultants, consultantsError, loadConsultants, search,
    appliedSearch, dialogOpen, selected, historyEvent, now, page, pagination,
    canCreate, canEdit, canDelete, canTeam, isOverdue, urgency,
    activityUrgencyLabels, visible, overview,
    overviewLoading, overviewRefreshing, overviewError, loadOverview, dateLabel,
    load, submitSearch, clearFilters, changePage, create, edit, complete, saved,
  }
}
