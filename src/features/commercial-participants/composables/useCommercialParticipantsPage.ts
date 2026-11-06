import { computed, ref, watch, type Ref } from 'vue'
import { participantsApi, type Participant, type ParticipantInput, type Override, type OverrideInput } from '../api'
import { useParticipantsList } from './useParticipantsList'
import { tenantApi } from '@/features/tenants/api'
import type { Tenant } from '@/features/tenants/types'
import { operatorsApi, type TenantOperator } from '@/features/operators/api'
import { teamCommissionsApi, type CommissionOption, type TeamCommissionRule } from '@/features/team-commissions/api'
import { toast } from '@/services/toast'
import { errorMessage } from '@/lib/feedback'

export function useCommercialParticipantsPage(tenantId: Ref<string>) {
const tenant = ref<Tenant>()
const {
  rows,
  currentPage,
  lastPage,
  total,
  filtersBusy,
  canManage,
  search,
  filterRole,
  appliedSearch,
  appliedRole,
  loadRows,
  applyFilters,
  clearFilters,
} = useParticipantsList(tenantId)
const operators = ref<TenantOperator[]>([])
const orderTypes = ref<CommissionOption[]>([])
const loading = ref(true)
const busy = ref(false)
const error = ref('')
const writable = computed(
  () => canManage.value && !!tenant.value?.access?.allows_operational_writes,
)

const blank = (): ParticipantInput => ({
  role: 'PARTNER',
  person_type: 'PJ',
  name: '',
  document: null,
  email: null,
  phone: null,
  notes: null,
  is_active: true,
})
const form = ref<ParticipantInput>(blank())
const editingId = ref('')
const modalOpen = ref(false)
const selected = ref<Participant | null>(null)
const defaults = ref<TeamCommissionRule[]>([])
const overrides = ref<Override[]>([])
const commissionLoading = ref(false)
const overrideEditingId = ref('')
const overrideBlank = (): OverrideInput => ({
  operator_id: 0,
  order_type: '',
  percentage: '',
  starts_on: new Date().toISOString().slice(0, 10),
  ends_on: null,
  is_active: true,
})
const overrideForm = ref<OverrideInput>(overrideBlank())
const overrideOpen = ref(false)
const typeLabel = (value: string) => orderTypes.value.find((o) => o.value === value)?.label ?? value
const percent = (value: string) => Number(value).toLocaleString('pt-BR') + '%'
function edit(row?: Participant) {
  editingId.value = row?.id ?? ''
  form.value = row
    ? {
        role: row.role,
        person_type: row.person_type,
        name: row.name,
        document: row.document,
        email: row.email,
        phone: row.phone,
        notes: row.notes,
        is_active: row.is_active,
      }
    : blank()
  modalOpen.value = true
}
async function load() {
  const id = tenantId.value
  loading.value = true
  error.value = ''
  try {
    const [company, list, available, options] = await Promise.all([
      tenantApi.show(id),
      participantsApi.list(id, currentPage.value, appliedSearch.value, appliedRole.value),
      operatorsApi.tenantList(id),
      teamCommissionsApi.options(id),
    ])
    if (id !== tenantId.value) return
    tenant.value = company.data
    rows.value = list.data
    canManage.value = list.meta.can_manage
    currentPage.value = list.meta.current_page
    lastPage.value = list.meta.last_page
    total.value = list.meta.total
    operators.value = available.data.filter((o) => o.selected && o.is_active)
    orderTypes.value = options.data.order_types
  } catch (e) {
    if (id === tenantId.value) error.value = errorMessage(e)
  } finally {
    if (id === tenantId.value) loading.value = false
  }
}
async function save() {
  if (!writable.value || busy.value) return
  busy.value = true
  try {
    const result = await participantsApi.save(
      tenantId.value,
      form.value,
      editingId.value || undefined,
    )
    modalOpen.value = false
    toast.success('Participante salvo.')
    await load()
    if (selected.value?.id === result.data.id) await openCommissions(result.data)
  } catch (e) {
    toast.error(errorMessage(e))
  } finally {
    busy.value = false
  }
}
async function openCommissions(row: Participant) {
  selected.value = row
  commissionLoading.value = true
  try {
    const result = await participantsApi.commissions(tenantId.value, row.id)
    if (selected.value?.id !== row.id) return
    defaults.value = result.data.defaults
    overrides.value = result.data.overrides
  } catch (e) {
    toast.error(errorMessage(e))
  } finally {
    if (selected.value?.id === row.id) commissionLoading.value = false
  }
}
function editOverride(row?: Override) {
  overrideEditingId.value = row?.id ?? ''
  overrideForm.value = row
    ? {
        operator_id: row.operator_id,
        order_type: row.order_type,
        percentage: String(row.percentage),
        starts_on: row.starts_on,
        ends_on: row.ends_on,
        is_active: row.is_active,
      }
    : overrideBlank()
  overrideOpen.value = true
}
async function saveOverride() {
  if (!selected.value || !writable.value || busy.value) return
  busy.value = true
  try {
    await participantsApi.saveOverride(
      tenantId.value,
      selected.value.id,
      overrideForm.value,
      overrideEditingId.value || undefined,
    )
    overrideOpen.value = false
    toast.success('Exceção salva.')
    await openCommissions(selected.value)
  } catch (e) {
    toast.error(errorMessage(e))
  } finally {
    busy.value = false
  }
}
async function removeOverride(row: Override) {
  if (
    !selected.value ||
    !writable.value ||
    !window.confirm('Excluir esta exceção? O participante voltará a utilizar a tabela padrão.')
  )
    return
  busy.value = true
  try {
    await participantsApi.deleteOverride(tenantId.value, selected.value.id, row.id)
    toast.success('Exceção excluída.')
    await openCommissions(selected.value)
  } catch (e) {
    toast.error(errorMessage(e))
  } finally {
    busy.value = false
  }
}
watch(tenantId, () => {
  selected.value = null
  modalOpen.value = false
  overrideOpen.value = false
  void load()
}, { immediate: true })
return {
 tenant, rows, currentPage, lastPage, total, filtersBusy, search, filterRole,
 loadRows, applyFilters, clearFilters, operators, orderTypes, loading, busy,
 error, writable, form, editingId, modalOpen, selected, defaults, overrides,
 commissionLoading, overrideEditingId, overrideForm, overrideOpen, typeLabel,
 percent, edit, load, save, openCommissions, editOverride, saveOverride, removeOverride,
}
}
