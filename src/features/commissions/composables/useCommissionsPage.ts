import { computed, ref, watch, type Ref } from 'vue'
import { useListPagination } from '@/composables/useListPagination'
import { useListFilters } from '@/composables/useListFilters'
import { tenantApi } from '@/features/tenants/api'
import type { Tenant } from '@/features/tenants/types'
import { operatorsApi, type TenantOperator } from '@/features/operators/api'
import { errorMessage } from '@/lib/feedback'
import { toast } from '@/services/toast'
import { commissionsApi, type Commission, type OrderTypeOption } from '../api'
import type { CommissionFormValue } from '../components/CommissionForm.vue'

const blank = (): CommissionFormValue => ({
  order_type: '',
  operator_id: 0,
  percentage: '400',
  deduction_percentage: '',
  is_active: true,
})

export function useCommissionsPage(tenantId: Ref<string>) {
  const tenant = ref<Tenant>()
  const rows = ref<Commission[]>([])
  const operators = ref<TenantOperator[]>([])
  const orderTypes = ref<OrderTypeOption[]>([])
  const loading = ref(true)
  const busy = ref(false)
  const settingsBusy = ref(false)
  const error = ref('')
  const canManage = ref(false)
  const defaultDeduction = ref('0')
  const filterOperator = ref('')
  const filterOrderType = ref('')
  const { applied, apply: applyFilters, clear: clearFilters } =
    useListFilters({ filterOperator, filterOrderType })
  const filteredRows = computed(() => rows.value.filter(row =>
    (!applied.value.filterOperator || String(row.operator_id) === applied.value.filterOperator) &&
    (!applied.value.filterOrderType || row.order_type === applied.value.filterOrderType),
  ))
  const { page, total, lastPage, pageRows, changePage } = useListPagination(filteredRows)
  const writable = computed(() =>
    canManage.value && !!tenant.value?.access?.allows_operational_writes,
  )
  const editingId = ref('')
  const modalOpen = ref(false)
  const form = ref<CommissionFormValue>(blank())
  const format = (value: unknown) =>
    `${Number(value).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`
  const orderTypeLabel = (value: string | null) =>
    orderTypes.value.find(type => type.value === value)?.label ??
    (value || 'Não classificado')

  function edit(row?: Commission) {
    editingId.value = row?.id ?? ''
    form.value = row
      ? {
          order_type: row.order_type ?? '',
          operator_id: row.operator_id,
          percentage: String(row.percentage),
          deduction_percentage: row.deduction_percentage ?? '',
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
      const [company, list, operatorList, types, settings] = await Promise.all([
        tenantApi.show(id),
        commissionsApi.list(id),
        operatorsApi.tenantList(id),
        commissionsApi.orderTypes(id),
        commissionsApi.settings(id),
      ])
      if (id !== tenantId.value) return
      tenant.value = company.data
      rows.value = list.data
      canManage.value = list.meta.can_manage
      operators.value = operatorList.data.filter(operator => operator.selected && operator.is_active)
      orderTypes.value = types.data
      defaultDeduction.value = settings.data.default_deduction_percentage
    } catch (failure) {
      if (id === tenantId.value) error.value = errorMessage(failure)
    } finally {
      if (id === tenantId.value) loading.value = false
    }
  }

  async function saveSettings() {
    if (!writable.value || settingsBusy.value) return
    settingsBusy.value = true
    try {
      await commissionsApi.saveSettings(
        tenantId.value,
        Number(defaultDeduction.value.replace(',', '.')),
      )
      toast.success('Desconto padrão salvo.')
    } catch (failure) {
      toast.error(errorMessage(failure))
    } finally {
      settingsBusy.value = false
    }
  }

  async function save() {
    if (!writable.value || busy.value) return
    busy.value = true
    try {
      await commissionsApi.save(tenantId.value, form.value, editingId.value || undefined)
      toast.success('Tabela de comissão salva.')
      modalOpen.value = false
      await load()
    } catch (failure) {
      toast.error(errorMessage(failure))
    } finally {
      busy.value = false
    }
  }

  watch(tenantId, () => {
    modalOpen.value = false
    void load()
  }, { immediate: true })

  return {
    tenant, operators, orderTypes, loading, busy, settingsBusy, error, writable,
    defaultDeduction, filterOperator, filterOrderType, filteredRows,
    applyFilters, clearFilters, page, total, lastPage, pageRows, changePage,
    editingId, modalOpen, form, format, orderTypeLabel, edit, load, saveSettings, save,
  }
}
