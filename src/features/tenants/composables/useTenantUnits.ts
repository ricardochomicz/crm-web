import { computed, reactive, ref, watch, type Ref } from 'vue'
import { tenantApi } from '../api'
import type { Tenant } from '../types'
import { unitsApi, type TenantUnit, type UnitList } from '../units'
import { errorMessage } from '@/lib/feedback'
import { toast } from '@/services/toast'
import { ApiError } from '@/lib/http'

export function useTenantUnits(tenantId: Ref<string>) {
let loadRequest = 0
let countsRequest = 0
const tenant = ref<Tenant>()
const result = ref<UnitList>()
const loading = ref(true)
const loadError = ref('')
const busy = ref(false)
const editing = ref<string | null>(null)
const assigning = ref<TenantUnit>()
const errors = ref<Record<string, string>>({})
const form = reactive({ name: '', email: '', phone: '', address: '', city: '', state: '' })
const searchFilter = ref('')
const typeFilter = ref('')
const appliedFilters = ref({ search: '', type: '' })

const filteredUnits = computed(() => {
  return (result.value?.data ?? []).filter((u) => {
    if (appliedFilters.value.search) {
      const q = appliedFilters.value.search.toLowerCase()
      const match =
        u.name.toLowerCase().includes(q) ||
        (u.city && u.city.toLowerCase().includes(q)) ||
        (u.state && u.state.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q))
      if (!match) return false
    }
    if (appliedFilters.value.type === 'hq' && !u.is_headquarters) return false
    if (appliedFilters.value.type === 'branch' && u.is_headquarters) return false
    return true
  })
})

function applyFilters() {
  appliedFilters.value = {
    search: searchFilter.value.trim(),
    type: typeFilter.value,
  }
}

function clearFilters() {
  searchFilter.value = ''
  typeFilter.value = ''
  applyFilters()
}
const writable = computed(
  () => result.value?.meta.can_manage && tenant.value?.access?.allows_operational_writes,
)
async function load() {
  const id = tenantId.value
  const request = ++loadRequest
  loading.value = true
  loadError.value = ''
  editing.value = null
  assigning.value = undefined
  try {
    const [company, units] = await Promise.all([tenantApi.show(id), unitsApi.list(id)])
    if (id !== tenantId.value || request !== loadRequest) return
    tenant.value = company.data
    result.value = units
  } catch (failure) {
    if (id === tenantId.value && request === loadRequest) loadError.value = errorMessage(failure)
  } finally {
    if (id === tenantId.value && request === loadRequest) loading.value = false
  }
}
function edit(unit?: TenantUnit) {
  editing.value = unit?.id ?? ''
  assigning.value = undefined
  Object.assign(form, {
    name: unit?.name ?? '',
    email: unit?.email ?? '',
    phone: unit?.phone ?? '',
    address: unit?.address ?? '',
    city: unit?.city ?? '',
    state: unit?.state ?? '',
  })
  errors.value = {}
}
function assign(unit: TenantUnit) {
  assigning.value = unit
  editing.value = null
  errors.value = {}
}
async function save() {
  if (busy.value || !writable.value) return
  const id = tenantId.value
  busy.value = true
  errors.value = {}
  try {
    const data = {
      name: form.name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      address: form.address.trim() || null,
      city: form.city.trim() || null,
      state: form.state || null,
    }
    if (editing.value) await unitsApi.update(id, editing.value, data)
    else await unitsApi.create(id, data)
    if (id !== tenantId.value) return
    await load()
    toast.success('Unidade salva com sucesso.')
  } catch (failure) {
    if (id !== tenantId.value) return
    toast.error(errorMessage(failure))
    if (failure instanceof ApiError)
      errors.value = Object.fromEntries(
        Object.entries(failure.errors).map(([key, values]) => [
          key,
          values[0] ?? 'Confira este campo.',
        ]),
      )
  } finally {
    busy.value = false
  }
}
async function refreshCounts() {
  const id = tenantId.value
  const request = ++countsRequest
  try {
    const updated = await unitsApi.list(id)
    if (id === tenantId.value && request === countsRequest && !loading.value) result.value = updated
  } catch (failure) {
    if (id === tenantId.value && request === countsRequest) toast.error(errorMessage(failure))
  }
}
watch(
  tenantId,
  () => {
    ++countsRequest
    result.value = undefined
    tenant.value = undefined
    void load()
  },
  { immediate: true },
)
return {
  tenant, result, loading, loadError, busy, editing, assigning, errors, form,
  searchFilter, typeFilter, filteredUnits, writable, applyFilters, clearFilters,
  load, edit, assign, save, refreshCounts,
}
}
