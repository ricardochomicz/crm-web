import { afterEach, describe, expect, it } from 'vitest'
import { DOMWrapper, enableAutoUnmount, mount } from '@vue/test-utils'
import InviteMemberDialog from '../components/InviteMemberDialog.vue'
import TeamActionDialog from '../components/TeamActionDialog.vue'
import type { CompanyRole } from '../api'

enableAutoUnmount(afterEach)
const roles: CompanyRole[] = [
  {
    id: 'limited',
    code: 'LIMITED',
    name: 'Consulta',
    legacy_role: 'ASSISTANT',
    permissions: [],
    is_active: true,
    is_system: false,
    version: 1,
    can_assign: true,
  },
  {
    id: 'powerful',
    code: 'POWERFUL',
    name: 'Financeiro completo',
    legacy_role: 'ASSISTANT',
    permissions: ['commissions.manage'],
    is_active: true,
    is_system: false,
    version: 1,
    can_assign: false,
  },
]
const global = { stubs: { AppDialog: { template: '<div><slot /></div>' } } }

describe('role assignment', () => {
  it('only offers authorized roles when inviting someone', async () => {
    const wrapper = mount(InviteMemberDialog, {
      attachTo: document.body,
      global,
      props: {
        tenantId: 'company',
        open: true,
        blockedReason: '',
        allowedRoles: ['ASSISTANT'],
        companyRoles: roles,
      },
    })
    await wrapper.get('[role=combobox]').trigger('pointerdown')
    const options = new DOMWrapper(document.body)
      .findAll('[role=option]')
      .map((option) => option.text())
    expect(options).toEqual(['Consulta'])
  })

  it('only offers authorized roles when changing a member with the same legacy profile', async () => {
    const wrapper = mount(TeamActionDialog, {
      attachTo: document.body,
      global,
      props: {
        tenantId: 'company',
        allowedRoles: ['ASSISTANT'],
        companyRoles: roles,
        allowed: true,
        canWrite: true,
        resendBlocked: '',
        action: {
          kind: 'role',
          member: {
            id: 'member',
            user_id: 2,
            name: 'Pessoa',
            email: 'person@example.com',
            role: 'ASSISTANT',
            status: 'ACTIVE',
            can_manage: true,
            joined_at: null,
          },
        },
      },
    })
    await wrapper.get('[role=combobox]').trigger('pointerdown')
    expect(
      new DOMWrapper(document.body).findAll('[role=option]').map((option) => option.text()),
    ).toEqual(['Consulta'])
  })
})
