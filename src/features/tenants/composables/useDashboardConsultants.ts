import { computed, ref, watch, type Ref } from 'vue'
import { productivityApi, type ProductivityResponse } from '@/features/productivity/api'
import { errorMessage } from '@/lib/feedback'

function dateLocal(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** Reuses the productivity API and its server-side membership visibility rules. */
export function useDashboardConsultants(tenantId: Readonly<Ref<string>>, enabled: Readonly<Ref<boolean>>) {
  const data = ref<ProductivityResponse | null>(null)
  const loading = ref(false)
  const error = ref('')
  const selectedConsultant = ref('')
  const period = ref<'month' | 'quarter'>('month')
  let version = 0

  const rows = computed(() => data.value?.data ?? [])
  const consultants = computed(() => rows.value.map(row => ({ value: row.id, label: row.name })))
  const selected = computed(() => selectedConsultant.value
    ? rows.value.filter(row => row.id === selectedConsultant.value)
    : rows.value)
  const totals = computed(() => selected.value.reduce((result, row) => ({
    orders: result.orders + row.orders,
    monthly: result.monthly + row.monthly_amount,
    opportunities: result.opportunities + row.opportunities,
  }), { orders: 0, monthly: 0, opportunities: 0 }))
  const leaders = computed(() => [...selected.value].sort((a, b) => b.orders - a.orders || b.monthly_amount - a.monthly_amount).slice(0, 5))

  async function refresh() {
    const current = ++version
    data.value = null
    error.value = ''
    if (!enabled.value || !tenantId.value) {
      loading.value = false
      return
    }
    loading.value = true
    const today = new Date()
    const firstMonth = period.value === 'quarter'
      ? Math.floor(today.getMonth() / 3) * 3
      : today.getMonth()
    try {
      const response = await productivityApi.overview(tenantId.value, {
        from: dateLocal(new Date(today.getFullYear(), firstMonth, 1)),
        to: dateLocal(today),
      })
      if (current === version) {
        data.value = response
        if (!response.data.some(row => row.id === selectedConsultant.value)) selectedConsultant.value = ''
      }
    } catch (failure) {
      if (current === version) error.value = errorMessage(failure)
    } finally {
      if (current === version) loading.value = false
    }
  }

  watch([tenantId, enabled, period], () => { void refresh() }, { immediate: true })
  return { data, loading, error, period, selectedConsultant, consultants, totals, leaders, refresh }
}
