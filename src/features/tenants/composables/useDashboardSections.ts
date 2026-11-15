import { ref, watch, type Ref } from 'vue'

export type DashboardSection = 'vendas' | 'ativacoes' | 'produtividade' | 'alertas'
type State = Record<DashboardSection, boolean>
const defaults = (): State => ({ vendas: true, ativacoes: true, produtividade: true, alertas: true })

/** Preferences are scoped to each tenant and browser; malformed storage never breaks the dashboard. */
export function useDashboardSections(tenantId: Readonly<Ref<string>>) {
  const expanded = ref<State>(defaults())
  const storageKey = () => `crm:dashboard:sections:${tenantId.value}`

  function restore() {
    expanded.value = defaults()
    if (!tenantId.value || typeof window === 'undefined') return
    try {
      const raw = window.localStorage.getItem(storageKey())
      if (!raw) return
      const parsed: unknown = JSON.parse(raw)
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return
      for (const section of Object.keys(expanded.value) as DashboardSection[]) {
        const value = (parsed as Record<string, unknown>)[section]
        if (typeof value === 'boolean') expanded.value[section] = value
      }
    } catch {
      // Storage may be unavailable in private browsing or blocked by policy.
    }
  }

  function toggle(section: DashboardSection) {
    expanded.value = { ...expanded.value, [section]: !expanded.value[section] }
    if (typeof window === 'undefined') return
    try { window.localStorage.setItem(storageKey(), JSON.stringify(expanded.value)) } catch { /* optional preference */ }
  }

  function expand(section: DashboardSection) {
    if (!expanded.value[section]) toggle(section)
  }

  watch(tenantId, restore, { immediate: true })
  return { expanded, toggle, expand }
}
