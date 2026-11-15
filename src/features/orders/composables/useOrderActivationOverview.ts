import { computed, ref, watch, type Ref } from 'vue'
import { ordersApi, type OrderActivationOverview } from '../api'
import { errorMessage } from '@/lib/feedback'

export function useOrderActivationOverview(tenantId: Ref<string>) {
const now = new Date()
const month = ref(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)
const expanded = ref(false)
const orderTypeIds = ref<string[]>([])
const loading = ref(false)
const error = ref('')
const overview = ref<OrderActivationOverview | null>(null)
const availableTypes = ref<{ value: string; label: string }[]>([])
const typesError = ref('')
let typesVersion = 0
let version = 0
const money = (amount: string) => Number(amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const monthLabel = computed(() => {
  const [year, number] = month.value.split('-').map(Number)
  return year && number >= 1 && number <= 12
    ? new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(year, number - 1, 1)))
    : 'Selecione o mês'
})
const breakdown = computed(() => {
  if (!overview.value) return []
  const current = overview.value.by_type
  const previous = overview.value.previous_by_type ?? []
  const ids = new Set([...current, ...previous].map(item => item.order_type_id))
  return [...ids].map(id => {
    const currentRow = current.find(item => item.order_type_id === id)
    const previousRow = previous.find(item => item.order_type_id === id)
    return {
      id: id ?? 'unclassified',
      name: currentRow?.name ?? previousRow?.name ?? 'Sem tipo definido',
      lines: currentRow?.lines ?? 0,
      monthly: Number(currentRow?.monthly ?? 0),
      previousLines: previousRow?.lines ?? 0,
      previousMonthly: Number(previousRow?.monthly ?? 0),
    }
  }).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
})
const trend = (current: number, previous: number) => {
  if (previous === 0) return current === 0 ? { label: 'Sem movimentação nos dois períodos', tone: 'text-slate-500' } : { label: 'Sem base de comparação no mês anterior', tone: 'text-slate-500' }
  const variation = (current - previous) / previous * 100
  if (variation === 0) return { label: 'Estável em relação ao mês anterior', tone: 'text-slate-600' }
  const amount = Math.abs(variation).toLocaleString('pt-BR', { maximumFractionDigits: 1 })
  return { label: `${amount}% de ${variation > 0 ? 'alta' : 'queda'} em relação ao mês anterior`, tone: variation > 0 ? 'text-emerald-700' : 'text-rose-700' }
}
const percentage = (value: number, max: number) => `${Math.max(0, Math.min(100, max > 0 ? value / max * 100 : 0))}%`
async function refresh() {
  const [year, number] = month.value.split('-').map(Number)
  if (!year || !number || number < 1 || number > 12) {
    error.value = 'Selecione um mês válido.'
    return
  }
  const current = ++version
  loading.value = true
  error.value = ''
  try {
    const from = `${month.value}-01`
    const endDay = month.value === `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}` ? new Date().getDate() : new Date(year, number, 0).getDate()
    const to = `${month.value}-${String(endDay).padStart(2, '0')}`
    const response = await ordersApi.activationOverview(tenantId.value, from, to, orderTypeIds.value)
    if (current === version) {
      overview.value = response.data
    }
  } catch (exception) {
    if (current === version) { error.value = errorMessage(exception); overview.value = null }
  } finally {
    if (current === version) loading.value = false
  }
}
async function loadTypes() {
  const current = ++typesVersion
  typesError.value = ''
  try {
    const response = await ordersApi.orderTypes()
    if (current === typesVersion) {
      availableTypes.value = response.data.map(type => ({ value: type.id, label: type.name }))
    }
  } catch (exception) {
    if (current === typesVersion) {
      availableTypes.value = []
      typesError.value = errorMessage(exception)
    }
  }
}
watch(tenantId, () => {
  version++
  overview.value = null
  orderTypeIds.value = []
  availableTypes.value = []
  if (expanded.value) { void loadTypes(); void refresh() }
})
watch(expanded, (open) => { if (open) { void loadTypes(); if (!overview.value) void refresh() } })

return { month, expanded, orderTypeIds, loading, error, overview, availableTypes, typesError, monthLabel, breakdown, refresh, money, trend, percentage }
}
