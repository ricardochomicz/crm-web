import { computed, onScopeDispose, ref, watch, type Ref } from 'vue'
import { tenantApi } from '@/features/tenants/api'
import type { Tenant } from '@/features/tenants/types'
import { errorMessage } from '@/lib/feedback'
import { commissionsApi, type CommissionReport } from '../api'

const month = () => new Date().toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit' })
const bounds = (value: string) => {
  const [year, number] = value.split('-').map(Number)
  if (!year || !number || number < 1 || number > 12) return null
  return {
    from: `${value}-01`,
    to: `${year}-${String(number).padStart(2, '0')}-${String(new Date(year, number, 0).getDate()).padStart(2, '0')}`,
  }
}
export const money = (value: string | number | null | undefined) =>
  Number(value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export function useCommissionReport(tenantId: Ref<string>) {
  const tenant = ref<Tenant>()
  const period = ref(month())
  const status = ref('')
  const report = ref<CommissionReport>()
  const loading = ref(false)
  const error = ref('')
  let requestId = 0

  const totals = computed(() => {
    const result = { lines: 0, gross: 0, deduction: 0, net: 0, participants: 0, company_balance: 0 }
    for (const item of report.value?.summary ?? []) {
      result.lines += Number(item.lines)
      result.gross += Number(item.gross)
      result.deduction += Number(item.deduction)
      result.net += Number(item.net)
      result.participants += Number(item.participants)
      result.company_balance += Number(item.company_balance)
    }
    return result
  })

  async function load() {
    const id = tenantId.value
    const sequence = ++requestId
    const dates = bounds(period.value)
    if (!dates) {
      error.value = 'Informe um mês válido.'
      report.value = undefined
      return
    }
    loading.value = true
    error.value = ''
    try {
      const [company, response] = await Promise.all([
        tenantApi.show(id),
        commissionsApi.report(id, { ...dates, status: status.value }),
      ])
      if (sequence !== requestId || id !== tenantId.value) return
      tenant.value = company.data
      report.value = response.data
    } catch (failure) {
      if (sequence !== requestId || id !== tenantId.value) return
      report.value = undefined
      error.value = errorMessage(failure)
    } finally {
      if (sequence === requestId) loading.value = false
    }
  }

  function clear() {
    period.value = month()
    status.value = ''
    void load()
  }

  watch(tenantId, () => {
    tenant.value = undefined
    report.value = undefined
    void load()
  }, { immediate: true })
  onScopeDispose(() => { requestId++ })

  return { tenant, period, status, report, loading, error, totals, load, clear }
}
