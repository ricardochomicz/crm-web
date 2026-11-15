import { computed, ref, watch, type Ref } from 'vue'
import { useTenantDashboard } from './useTenantDashboard'
import { opportunitiesApi, type CommercialOverview, type FunnelOverview } from '@/features/opportunities/api'
import { errorMessage } from '@/lib/feedback'
import { can } from '../types'

/** Dashboard state, permissions and API coordination. The view only renders sections. */
export function useCommercialDashboard(tenantId: Readonly<Ref<string>>) {
const { tenant, loading, error, load } = useTenantDashboard(tenantId)
const period = ref<'month' | 'quarter'>('month')
const overview = ref<CommercialOverview | null>(null)
const funnel = ref<FunnelOverview | null>(null)
const overviewError = ref('')
const funnelError = ref('')
const overviewLoading = ref(false)
const funnelLoading = ref(false)
let overviewVersion = 0
let funnelVersion = 0
const money = (amount: number | string) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(Number(amount))
const base = computed(() => '/empresas/' + tenantId.value)
const canSee = computed(() => can(tenant.value, 'opportunities.view'))
const isOwner = computed(() => tenant.value?.role === 'OWNER')
const profile = computed(() => tenant.value?.role === 'CONSULTANT' ? 'Consultor' : tenant.value?.role === 'MANAGER' ? 'Gerencial' : 'Gerencial')
const intro = computed(() => tenant.value?.role === 'CONSULTANT' ? 'Acompanhe suas negociações e prioridades comerciais.' : 'Uma visão estratégica da operação comercial.')
const range = computed(() => {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const first = period.value === 'quarter' ? Math.floor(month / 3) * 3 : month
  const last = period.value === 'quarter' ? first + 3 : month + 1
  const iso = (d: Date) => [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-')
  return { from: iso(new Date(year, first, 1)), to: iso(new Date(year, last, 0)) }
})
async function refreshOverview() {
  const version = ++overviewVersion
  overview.value = null
  overviewError.value = ''
  if (!tenant.value || !canSee.value) return
  overviewLoading.value = true
  try {
    const response = await opportunitiesApi.overview(tenantId.value, range.value.from, range.value.to)
    if (version === overviewVersion) overview.value = response.data
  } catch (e) {
    if (version === overviewVersion) overviewError.value = errorMessage(e)
  } finally {
    if (version === overviewVersion) overviewLoading.value = false
  }
}
async function refreshFunnel() {
  const version = ++funnelVersion
  funnel.value = null
  funnelError.value = ''
  if (!tenant.value || !canSee.value) return
  funnelLoading.value = true
  try {
    const response = await opportunitiesApi.funnelOverview(tenantId.value)
    if (version === funnelVersion) funnel.value = response.data
  } catch (e) {
    if (version === funnelVersion) funnelError.value = errorMessage(e)
  } finally {
    if (version === funnelVersion) funnelLoading.value = false
  }
}
function refresh() { void refreshOverview(); void refreshFunnel() }
watch([tenantId, tenant, period], () => { void refreshOverview() }, { immediate: true })
watch([tenantId, tenant], () => { void refreshFunnel() }, { immediate: true })
const metrics = computed(() => [
  { label: 'Negociações ganhas', value: overview.value ? String(overview.value.won.count) : '—', detail: 'Fechadas no período', accent: 'violet' },
  { label: 'Valor mensal ganho', value: overview.value ? money(overview.value.won.monthly) : '—', detail: 'Estimado, não faturamento', accent: 'emerald' },
  { label: 'Em negociação', value: overview.value ? money(overview.value.open_period.monthly) : '—', detail: 'Potencial mensal do período', accent: 'sky' },
  { label: 'Conversão comercial', value: overview.value?.conversion_rate != null ? overview.value.conversion_rate.toLocaleString('pt-BR') + '%' : '—', detail: 'Ganhas / decisões concluídas', accent: 'fuchsia' },
] as const)
const funnelTotal = computed(() => (funnel.value?.stages.reduce((total, stage) => total + stage.count, 0) ?? 0) + (funnel.value?.unassigned.count ?? 0))
const funnelMax = computed(() => Math.max(1, ...(funnel.value?.stages.map(stage => stage.count) ?? [])))
const shortcuts = computed(() => [
  { label: 'Clientes', path: 'clientes', permission: 'clients.view', symbol: '◉' },
  { label: 'Oportunidades', path: 'oportunidades', permission: 'opportunities.view', symbol: '◎' },
  { label: 'Pedidos', path: 'pedidos', permission: 'opportunities.view', symbol: '▣' },
  { label: 'Metas', path: 'metas-comerciais', permission: 'commercial-goals.view', symbol: '◈' },
  { label: 'Equipes', path: 'equipes', permission: 'teams.view', symbol: '♧' },
  { label: 'Agenda', path: 'agenda', permission: 'calendar.view', symbol: '▦' },
].filter(link => can(tenant.value, link.permission)))
const attention = computed(() => overview.value ? [
  { label: 'Oportunidades atrasadas', count: overview.value.overdue.count, detail: money(overview.value.overdue.monthly) + '/mês em risco', tone: 'text-rose-700' },
  { label: 'Negociações perdidas', count: overview.value.lost.count, detail: 'Encerradas no período', tone: 'text-amber-700' },
  { label: 'Sem previsão de fechamento', count: overview.value.unscheduled.count, detail: 'Precisam de planejamento', tone: 'text-sky-700' },
] : [])

return { tenant, loading, error, load, period, overview, funnel, overviewError, funnelError, overviewLoading, funnelLoading, money, base, canSee, isOwner, profile, intro, refreshOverview, refreshFunnel, refresh, metrics, funnelTotal, funnelMax, shortcuts, attention }
}
