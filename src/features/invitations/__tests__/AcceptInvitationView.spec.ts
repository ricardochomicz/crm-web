import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createPinia } from 'pinia'
import AcceptInvitationView from '../views/AcceptInvitationView.vue'
import { useAuthStore } from '@/features/auth/store'
import { invitationApi } from '../api'
import { tenantApi } from '@/features/tenants/api'
import { ApiError } from '@/lib/http'
vi.mock('../api', () => ({ invitationApi: { show: vi.fn(), accept: vi.fn() } }))
vi.mock('@/features/tenants/api', () => ({ tenantApi: { select: vi.fn() } }))
beforeEach(() => vi.resetAllMocks())
async function render(hash: string, authenticated = false) {
  const pinia = createPinia()
  if (authenticated) useAuthStore(pinia).user = { id: 1, name: 'Ana', email: 'ana@example.test' }
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/convites', component: AcceptInvitationView },
      { path: '/:pathMatch(.*)*', component: { template: '<div />' } },
    ],
  })
  await router.push(`/convites${hash}`)
  await router.isReady()
  const wrapper = mount(AcceptInvitationView, {
    global: {
      plugins: [pinia, router],
      stubs: { AuthLayout: { template: '<main><slot /></main>' } },
    },
  })
  await flushPromises()
  return { wrapper, router }
}
describe('Accept invitation', () => {
  it('rejects malformed links without calling the API', async () => {
    const { wrapper } = await render('#token=invalid')
    expect(invitationApi.show).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('Este convite não está disponível')
    wrapper.unmount()
  })
  it('explains expired invitations', async () => {
    vi.mocked(invitationApi.show).mockRejectedValue(new ApiError(410, 'Gone'))
    const { wrapper } = await render(`#token=${'a'.repeat(64)}`)
    expect(wrapper.text()).toContain('Peça um novo convite')
    wrapper.unmount()
  })
  it('preserves the secret in login and registration link fragments', async () => {
    vi.mocked(invitationApi.show).mockResolvedValue({ data: { is_available: true, email: 'ana@example.test' } })
    const token = 'a'.repeat(64)
    const { wrapper } = await render(`#token=${token}`)
    expect(wrapper.get('a[href^="/login"]').attributes('href')).toBe(
      `/login?continue=invitation#token=${token}`,
    )
    expect(wrapper.get('a[href^="/register"]').attributes('href')).toBe(
      `/register?continue=invitation#token=${token}`,
    )
    wrapper.unmount()
  })
  it('retries selecting the company without consuming the invitation twice', async () => {
    vi.mocked(invitationApi.show).mockResolvedValue({ data: { is_available: true, email: 'ana@example.test' } })
    vi.mocked(invitationApi.accept).mockResolvedValue({ data: { tenant_id: 'company-a' } })
    vi.mocked(tenantApi.select)
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(undefined)
    const { wrapper, router } = await render(`#token=${'a'.repeat(64)}`, true)
    await wrapper.get('.primary-button').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('Abrir minha empresa')
    await wrapper.get('.primary-button').trigger('click')
    await flushPromises()
    expect(invitationApi.accept).toHaveBeenCalledOnce()
    expect(router.currentRoute.value.path).toBe('/empresas/company-a')
    wrapper.unmount()
  })
})
