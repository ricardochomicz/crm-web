import { afterEach, describe, expect, it } from 'vitest'
import { DOMWrapper, enableAutoUnmount, mount } from '@vue/test-utils'
import CommissionForm, { type CommissionFormValue } from '../components/CommissionForm.vue'

enableAutoUnmount(afterEach)

function mountForm(editing = false) {
  return mount(CommissionForm, {
    attachTo: document.body,
    props: {
      modelValue: {
        order_type: editing ? 'portability' : '',
        operator_id: editing ? 7 : 0,
        percentage: '400',
        deduction_percentage: '',
        is_active: true,
      },
      operators: [{ id: 7, name: 'Claro', slug: 'claro', selected: true, is_active: true }],
      orderTypes: [{ value: 'portability', label: 'Portabilidade' }],
      busy: false,
      editing,
    },
  })
}

describe('commission form', () => {
  it.each(['click', 'keyboard'])('selects both fields via %s and preserves their values when submitting', async (interaction) => {
    const wrapper = mountForm()
    const [orderType, operator] = wrapper.findAll<HTMLInputElement>('[role=combobox]')
    expect(wrapper.get('form').element.checkValidity()).toBe(false)

    await orderType!.trigger('pointerdown')
    await orderType!.setValue('Porta')
    if (interaction === 'click') {
      await new DOMWrapper(document.body).get('[role=option]').trigger('click')
    } else {
      await orderType!.trigger('keydown', { key: 'Enter' })
    }
    const orderUpdate = wrapper.emitted('update:modelValue')![0]![0] as CommissionFormValue
    expect(orderUpdate.order_type).toBe('portability')
    await wrapper.setProps({ modelValue: orderUpdate })
    expect(wrapper.get('form').element.checkValidity()).toBe(false)

    await operator!.trigger('pointerdown')
    if (interaction === 'click') {
      await new DOMWrapper(document.body).get('[role=option]').trigger('click')
    } else {
      await operator!.trigger('keydown', { key: 'Enter' })
    }
    const operatorUpdate = wrapper.emitted('update:modelValue')![1]![0] as CommissionFormValue
    expect(operatorUpdate).toEqual({ ...orderUpdate, operator_id: 7 })
    await wrapper.setProps({ modelValue: operatorUpdate })
    expect(wrapper.get('form').element.checkValidity()).toBe(true)
    await wrapper.get('form').trigger('submit')
    expect(wrapper.emitted('submit')).toHaveLength(1)
    wrapper.unmount()
  })

  it('displays the existing selections when editing', () => {
    const wrapper = mountForm(true)
    const [orderType, operator] = wrapper.findAll<HTMLInputElement>('[role=combobox]')
    expect(orderType!.element.value).toBe('Portabilidade')
    expect(operator!.element.value).toBe('Claro')
    expect(wrapper.get('form').element.checkValidity()).toBe(true)
    wrapper.unmount()
  })
})
