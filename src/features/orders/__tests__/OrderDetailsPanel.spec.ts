import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import OrderDetailsPanel from '../components/OrderDetailsPanel.vue'
import { ordersApi, type CommercialOrder } from '../api'
import { orderStatusesApi } from '@/features/order-statuses/api'

vi.mock('../api', () => ({
  ordersApi: { show: vi.fn(), updateWorkflow: vi.fn(), activateItems: vi.fn(), complete: vi.fn() },
}))
vi.mock('@/features/order-statuses/api', () => ({ orderStatusesApi: { list: vi.fn() } }))
vi.mock('@/services/toast', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

let order: CommercialOrder
beforeEach(() => {
  vi.resetAllMocks()
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 10, 7, 12))
  order = {
    id: 'order-1',
    code: 'PED-1',
    customer_name: 'Empresa',
    monthly_amount: '199.60',
    line_quantity: 4,
    sold_on: '2026-10-20',
    status: 'DRAFT',
    order_status_id: 'initial',
    order_status: 'TRIAGEM',
    expected_activation_at: '2026-10-30',
    administratively_completed_at: null,
    items: [1, 2, 3, 4].map((number) => ({
      id: String(number),
      line_number: '4299999000' + number,
      description: 'Plano',
      quantity: 1,
      monthly_unit_amount: '49.90',
      one_time_unit_amount: '0.00',
      status: 'PENDING',
      activated_at: null,
    })),
  }
  vi.mocked(ordersApi.show).mockImplementation(async () => ({ data: structuredClone(order) }))
  vi.mocked(orderStatusesApi.list).mockResolvedValue({
    data: [
      { id: 'initial', name: 'TRIAGEM', is_initial: true },
      { id: 'credit', name: 'ANÁLISE DE CRÉDITO', is_initial: false },
      { id: 'return', name: 'DEVOLUÇÃO', is_initial: false },
      { id: 'partial', name: 'PARCIALMENTE ATIVADO', is_initial: false },
      { id: 'active', name: 'ATIVO', is_initial: false },
      { id: 'complete', name: 'CONCLUIDO', is_initial: false },
    ],
    meta: { can_manage: true },
  })
})
afterEach(() => vi.useRealTimers())

async function render() {
  const wrapper = mount(OrderDetailsPanel, {
    props: { tenantId: 'tenant-1', orderId: 'order-1' },
    global: {
      stubs: {
        TimelinePanel: true,
        AppDialog: { props: ['open'], template: '<div v-if="open" role="dialog"><slot /></div>' },
        SearchSelect: {
          name: 'SearchSelect',
          props: ['modelValue', 'options'],
          emits: ['update:modelValue'],
          template: `<select :value="modelValue" @change="$emit('update:modelValue', $event.target.value)"><option v-for="option in options" :key="option.value" :value="option.value">{{ option.label }}</option></select>`,
        },
      },
    },
  })
  await flushPromises()
  return wrapper
}

describe('Order activation flow', () => {
  it('allows operational status changes after partial activation without sending activation dates', async () => {
    order.items![0]!.status = 'ACTIVE'
    order.items![0]!.activated_at = '2026-10-31'
    order.order_status_id = 'partial'
    const wrapper = await render()
    await wrapper.get('select').setValue('return')
    await flushPromises()
    expect(ordersApi.updateWorkflow).toHaveBeenCalledWith('tenant-1', 'order-1', {
      order_status_id: 'return',
      expected_activation_at: '2026-10-30',
    })
    expect(ordersApi.activateItems).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('31/10/2026')
    wrapper.unmount()
  })

  it('registers separate batches without changing workflow or resubmitting active lines', async () => {
    vi.mocked(ordersApi.activateItems).mockImplementation(async (_tenant, _id, data) => {
      for (const item of order.items ?? []) {
        if (data.item_ids.includes(item.id)) {
          item.status = 'ACTIVE'
          item.activated_at = data.activated_at
        }
      }
      order.order_status_id = 'partial'
      order.order_status = 'PARCIALMENTE ATIVADO'
      return { data: structuredClone(order) }
    })
    const wrapper = await render()
    const open = async () => {
      await wrapper
        .findAll('button')
        .find((button) => button.text() === 'Registrar ativação')!
        .trigger('click')
      await flushPromises()
    }
    expect(wrapper.findAll('button').some((button) => button.text() === 'Registrar ativação')).toBe(
      false,
    )
    await wrapper.get('select').setValue('active')
    await flushPromises()
    expect(
      wrapper
        .findAll('input[type="checkbox"]')
        .every((input) => !(input.element as HTMLInputElement).checked),
    ).toBe(true)
    expect(
      wrapper.get('[role="dialog"] button[type="submit"]').attributes('disabled'),
    ).toBeDefined()
    await wrapper.get('[role="dialog"] input[type="date"]').setValue('2026-10-31')
    await wrapper.get('[aria-label="42999990001"]').setValue(true)
    await wrapper.get('[aria-label="42999990002"]').setValue(true)
    await wrapper.get('[role="dialog"] form').trigger('submit')
    await flushPromises()
    expect(ordersApi.activateItems).toHaveBeenLastCalledWith('tenant-1', 'order-1', {
      item_ids: ['1', '2'],
      activated_at: '2026-10-31',
    })
    expect(wrapper.find('select').exists()).toBe(true)
    expect(wrapper.text()).toContain('31/10/2026')

    await open()
    expect(wrapper.get<HTMLInputElement>('[role="dialog"] input[type="date"]').element.value).toBe(
      '',
    )
    expect(wrapper.find('[aria-label="42999990001"]').exists()).toBe(false)
    await wrapper.get('[role="dialog"] input[type="date"]').setValue('2026-11-06')
    await wrapper.get('[aria-label="42999990003"]').setValue(true)
    await wrapper.get('[aria-label="42999990004"]').setValue(true)
    await wrapper.get('[role="dialog"] form').trigger('submit')
    await flushPromises()
    expect(ordersApi.activateItems).toHaveBeenLastCalledWith('tenant-1', 'order-1', {
      item_ids: ['3', '4'],
      activated_at: '2026-11-06',
    })
    expect(ordersApi.updateWorkflow).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('31/10/2026')
    expect(wrapper.text()).toContain('06/11/2026')
    wrapper.unmount()
  })

  it('opens activation from either activation status and cancelling leaves the saved status intact', async () => {
    const wrapper = await render()
    expect(wrapper.text()).not.toContain('Previsão de ativação')
    expect(wrapper.find('input[type="date"]').exists()).toBe(false)
    expect(
      wrapper
        .findAll('h3')
        .map((heading) => heading.text())
        .slice(1, 3),
    ).toEqual(['Acompanhamento do pedido', 'Ativação das linhas'])
    for (const status of ['active', 'partial']) {
      await wrapper.getComponent({ name: 'SearchSelect' }).vm.$emit('update:modelValue', status)
      await flushPromises()
      expect(wrapper.find('[role="dialog"]').exists()).toBe(true)
      await wrapper
        .findAll('[role="dialog"] button')
        .find((button) => button.text() === 'Cancelar')!
        .trigger('click')
      expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
      expect(wrapper.getComponent({ name: 'SearchSelect' }).props('modelValue')).toBe('initial')
    }
    expect(ordersApi.updateWorkflow).not.toHaveBeenCalled()
    expect(ordersApi.activateItems).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('restores the saved status if an operational change fails', async () => {
    vi.mocked(ordersApi.updateWorkflow).mockRejectedValue(new Error('Falha ao salvar'))
    const wrapper = await render()
    await wrapper.get('select').setValue('credit')
    await flushPromises()
    expect(wrapper.getComponent({ name: 'SearchSelect' }).props('modelValue')).toBe('initial')
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('rejects a future activation even when lines are selected', async () => {
    const wrapper = await render()
    await wrapper.get('select').setValue('active')
    await flushPromises()
    await wrapper.get('[aria-label="42999990001"]').setValue(true)
    await wrapper.get('[role="dialog"] input[type="date"]').setValue('2026-11-08')
    await wrapper.get('[role="dialog"] form').trigger('submit')
    expect(ordersApi.activateItems).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('shows line dates but no activation or workflow controls on completed orders', async () => {
    order.administratively_completed_at = '2026-11-07T12:00:00'
    order.order_status = 'CONCLUIDO'
    for (const item of order.items ?? []) {
      item.status = 'ACTIVE'
      item.activated_at = '2026-11-06'
    }
    const wrapper = await render()
    expect(wrapper.text()).toContain('06/11/2026')
    expect(wrapper.find('form').exists()).toBe(false)
    expect(wrapper.findAll('button').some((button) => button.text() === 'Registrar ativação')).toBe(
      false,
    )
    wrapper.unmount()
  })
})
