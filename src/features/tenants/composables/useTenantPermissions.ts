import { computed, onMounted, onBeforeUnmount, ref, watch, type Ref } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { tenantApi } from '../api'
import { roleLabels, type Tenant, type TenantRole, type Page } from '../types'
import { permissionsApi, type PermissionSettings, type PermissionChange } from '../permissions'
import { errorMessage } from '@/lib/feedback'
import { toast } from '@/services/toast'
import { ApiError } from '@/lib/http'

export function useTenantPermissions(tenantId: Ref<string>) {
const tenant = ref<Tenant>()
const settings = ref<PermissionSettings>()
const loading = ref(true)
const error = ref('')
const selectedRole = ref<TenantRole>('MANAGER')
const draft = ref<string[]>([])
const busy = ref(false)
const reviewing = ref(false)
const conflicted = ref(false)
const history = ref<Page<PermissionChange>>()
const historyLoading = ref(false)
const historyError = ref('')
let historyRequest = 0
const current = computed(() =>
  settings.value?.roles.find((role) => role.role === selectedRole.value),
)
const search = ref('')
const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
const filteredCatalog = computed(() =>
  (settings.value?.catalog ?? []).filter((item) =>
    normalize(`${item.group} ${item.label}`).includes(normalize(search.value.trim())),
  ),
)
const groups = computed(() => [...new Set(filteredCatalog.value.map((item) => item.group))])
const added = computed(() => draft.value.filter((key) => !current.value?.permissions.includes(key)))
const removed = computed(
  () => current.value?.permissions.filter((key) => !draft.value.includes(key)) ?? [],
)
const dirty = computed(() => added.value.length + removed.value.length > 0)
const locked = computed(
  () => !settings.value?.can_edit || current.value?.protected || busy.value || conflicted.value,
)
const label = (key: string) =>
  settings.value?.catalog.find((item) => item.key === key)?.label ?? key
function resetDraft() {
  draft.value = [...(current.value?.permissions ?? [])]
}
function selectRole(role: TenantRole) {
  if (role === selectedRole.value) return
  if (dirty.value && !window.confirm('Descartar as alterações não salvas deste cargo?')) return
  selectedRole.value = role
  resetDraft()
  void loadHistory(1)
}
function toggle(key: string, checked: boolean) {
  if (locked.value) return
  const selected = new Set(draft.value)
  if (checked) {
    selected.add(key)
    settings.value?.catalog
      .find((item) => item.key === key)
      ?.requires.forEach((required) => selected.add(required))
  } else {
    selected.delete(key)
    settings.value?.catalog
      .filter((item) => item.requires.includes(key))
      .forEach((item) => selected.delete(item.key))
  }
  draft.value = [...selected]
}
async function loadHistory(page = 1) {
  const request = ++historyRequest
  const role = selectedRole.value
  historyLoading.value = true
  history.value = undefined
  historyError.value = ''
  try {
    const response = await permissionsApi.history(tenantId.value, page, role)
    if (request === historyRequest) history.value = response
  } catch (failure) {
    if (request === historyRequest) historyError.value = errorMessage(failure)
  } finally {
    if (request === historyRequest) historyLoading.value = false
  }
}
async function load() {
  if (dirty.value && !window.confirm('Recarregar e descartar as alterações não salvas?')) return
  loading.value = true
  error.value = ''
  settings.value = undefined
  try {
    tenant.value = (await tenantApi.show(tenantId.value)).data
    if (tenant.value.access?.can_manage_permissions) {
      settings.value = (await permissionsApi.show(tenantId.value)).data
      conflicted.value = false
      resetDraft()
      await loadHistory()
    }
  } catch (failure) {
    error.value = errorMessage(failure)
  } finally {
    loading.value = false
  }
}
async function save() {
  if (!current.value || locked.value || !dirty.value) return
  busy.value = true
  const role = current.value
  const saved = [...draft.value]
  try {
    await permissionsApi.update(tenantId.value, role.role, saved, role.version)
    role.permissions = saved
    role.version += 1
    reviewing.value = false
    toast.success(`Permissões de ${roleLabels[role.role]} atualizadas nesta empresa.`)
    await loadHistory()
  } catch (failure) {
    toast.error(errorMessage(failure))
    if (failure instanceof ApiError && failure.status === 409) conflicted.value = true
  } finally {
    busy.value = false
  }
}
function beforeUnload(event: BeforeUnloadEvent) {
  if (dirty.value || busy.value) {
    event.preventDefault()
    event.returnValue = ''
  }
}
onBeforeRouteLeave(
  () =>
    !busy.value && (!dirty.value || window.confirm('Sair e descartar as alterações não salvas?')),
)
onMounted(() => {
  window.addEventListener('beforeunload', beforeUnload)
})
watch(tenantId, () => {
  ++historyRequest
  tenant.value = undefined
  settings.value = undefined
  history.value = undefined
  draft.value = []
  conflicted.value = false
  void load()
}, { immediate: true })
onBeforeUnmount(() => window.removeEventListener('beforeunload', beforeUnload))
function dateTime(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(
    new Date(value),
  )
}
const showLegacyPermissions = ref(false)
return {
  tenant, settings, loading, error, selectedRole, draft, busy, reviewing, conflicted,
  history, historyLoading, historyError, current, search, filteredCatalog, groups,
  added, removed, dirty, locked, label, resetDraft, selectRole, toggle,
  loadHistory, load, save, dateTime, showLegacyPermissions,
}
}
