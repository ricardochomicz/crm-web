import { computed, ref, watch, type Ref } from 'vue'
import { tenantApi } from '@/features/tenants/api'
import type { Tenant } from '@/features/tenants/types'
import { errorMessage } from '@/lib/feedback'
import { toast } from '@/services/toast'
import { operatorsApi, type TenantOperator } from '../api'

/** Estado e operações de seleção das operadoras vinculadas à empresa. */
export function useTenantOperatorsPage(tenantId: Ref<string>) {
  const tenant = ref<Tenant>()
  const operators = ref<TenantOperator[]>([])
  const selected = ref<number[]>([])
  const loading = ref(true)
  const error = ref('')
  const busy = ref(false)
  const writable = computed(() => !!tenant.value?.access?.allows_operational_writes)
  const dirty = computed(() => {
    const initial = operators.value.filter(item => item.selected).map(item => item.id)
    return initial.length !== selected.value.length ||
      initial.some(id => !selected.value.includes(id))
  })
  let loadSequence = 0

  async function load() {
    const id = tenantId.value
    const sequence = ++loadSequence
    loading.value = true
    error.value = ''
    try {
      const [company, list] = await Promise.all([
        tenantApi.show(id),
        operatorsApi.tenantList(id),
      ])
      if (tenantId.value !== id || sequence !== loadSequence) return
      tenant.value = company.data
      operators.value = list.data
      selected.value = list.data.filter(item => item.selected).map(item => item.id)
    } catch (failure) {
      if (tenantId.value === id && sequence === loadSequence) error.value = errorMessage(failure)
    } finally {
      if (tenantId.value === id && sequence === loadSequence) loading.value = false
    }
  }

  function toggle(id: number, checked: boolean) {
    if (!writable.value || busy.value) return
    const operator = operators.value.find(item => item.id === id)
    if (!operator || (!operator.is_active && !operator.selected)) return
    selected.value = checked
      ? [...new Set([...selected.value, id])]
      : selected.value.filter(value => value !== id)
  }

  async function save() {
    if (!writable.value || busy.value || loading.value || !dirty.value) return
    const id = tenantId.value
    busy.value = true
    try {
      await operatorsApi.tenantSave(id, selected.value)
      if (tenantId.value !== id) return
      toast.success('Operadoras da empresa atualizadas.')
      await load()
    } catch (failure) {
      if (tenantId.value === id) toast.error(errorMessage(failure))
    } finally {
      busy.value = false
    }
  }

  watch(tenantId, () => {
    ++loadSequence
    tenant.value = undefined
    operators.value = []
    selected.value = []
    void load()
  }, { immediate: true })

  return { tenant, operators, selected, loading, error, busy, writable, dirty, load, toggle, save }
}
