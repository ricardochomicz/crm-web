import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { effectScope, nextTick, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { useDashboardSections } from '../composables/useDashboardSections'
import DashboardSectionHeading from '../components/DashboardSectionHeading.vue'

beforeEach(() => window.localStorage.clear())
afterEach(() => window.localStorage.clear())

describe('dashboard section preferences', () => {
  it('keeps collapse state isolated per tenant and restores it on return', async () => {
    const tenantId = ref('company-a')
    const scope = effectScope()
    const state = scope.run(() => useDashboardSections(tenantId))!
    expect(state.expanded.value.vendas).toBe(true)
    state.toggle('vendas')
    expect(state.expanded.value.vendas).toBe(false)
    expect(state.expanded.value.alertas).toBe(true)
    expect(JSON.parse(window.localStorage.getItem('crm:dashboard:sections:company-a')!).vendas).toBe(false)

    tenantId.value = 'company-b'
    await nextTick()
    expect(state.expanded.value.vendas).toBe(true)
    state.toggle('alertas')
    tenantId.value = 'company-a'
    await nextTick()
    expect(state.expanded.value.vendas).toBe(false)
    expect(state.expanded.value.alertas).toBe(true)
    scope.stop()
  })

  it('ignores malformed and unexpected stored values', () => {
    window.localStorage.setItem('crm:dashboard:sections:company-a', '{bad json')
    const scope = effectScope()
    const state = scope.run(() => useDashboardSections(ref('company-a')))!
    expect(state.expanded.value.vendas).toBe(true)
    scope.stop()

    window.localStorage.setItem('crm:dashboard:sections:company-a', JSON.stringify({
      vendas: 'false', ativacoes: false, produtividade: null, alertas: true,
    }))
    const second = effectScope()
    const restored = second.run(() => useDashboardSections(ref('company-a')))!
    expect(restored.expanded.value.vendas).toBe(true)
    expect(restored.expanded.value.ativacoes).toBe(false)
    expect(restored.expanded.value.produtividade).toBe(true)
    second.stop()
  })

  it('expands a collapsed section for navigation without changing other sections', () => {
    const scope = effectScope()
    const state = scope.run(() => useDashboardSections(ref('company-a')))!
    state.toggle('produtividade')
    state.toggle('vendas')
    state.expand('produtividade')
    expect(state.expanded.value.produtividade).toBe(true)
    expect(state.expanded.value.vendas).toBe(false)
    scope.stop()
  })
})

describe('dashboard section heading', () => {
  it('exposes accessible collapse state and emits the toggle event', async () => {
    const wrapper = mount(DashboardSectionHeading, {
      props: { title: 'Vendas', description: 'Indicadores', anchor: 'dashboard-vendas', collapsible: true, expanded: false },
    })
    const button = wrapper.get('button')
    expect(button.attributes('aria-expanded')).toBe('false')
    expect(button.attributes('aria-controls')).toBe('dashboard-vendas-content')
    expect(button.text()).toContain('Expandir')
    await button.trigger('click')
    expect(wrapper.emitted('toggle')).toHaveLength(1)
    await wrapper.setProps({ expanded: true })
    expect(button.attributes('aria-expanded')).toBe('true')
    expect(button.text()).toContain('Recolher')
  })
})
