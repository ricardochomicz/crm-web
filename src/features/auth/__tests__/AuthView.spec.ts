import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import AuthView from '../views/AuthView.vue'
import { authApi } from '../api'
vi.mock('../api', () => ({
  authApi: {
    login: vi.fn(),
    register: vi.fn(),
    me: vi.fn(),
    forgotPassword: vi.fn(),
    resetPassword: vi.fn(),
  },
}))
beforeEach(() => vi.resetAllMocks())
afterEach(() => {
  document.body.innerHTML = ''
})
async function render(mode = 'login') {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/form', component: AuthView, meta: { authMode: mode } },
      { path: '/:pathMatch(.*)*', component: { template: '<div>Destino</div>' } },
    ],
  })
  await router.push('/form')
  await router.isReady()
  const wrapper = mount(AuthView, {
    attachTo: document.body,
    global: { plugins: [createPinia(), router] },
  })
  return { wrapper, router }
}
describe('Authentication interactions', () => {
  it('focuses the first invalid field without contacting the API', async () => {
    const { wrapper } = await render()
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(wrapper.text()).toContain('Informe um e-mail válido.')
    expect(document.activeElement?.id).toBe('email')
    expect(authApi.login).not.toHaveBeenCalled()
    wrapper.unmount()
  })
  it('logs in and loads the authenticated account', async () => {
    vi.mocked(authApi.me).mockResolvedValue({
      data: { id: 1, name: 'Ana', email: 'ana@example.test' },
    })
    const { wrapper, router } = await render()
    await wrapper.get('#email').setValue('ana@example.test')
    await wrapper.get('#password').setValue('senha-segura')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(authApi.login).toHaveBeenCalledWith({
      email: 'ana@example.test',
      password: 'senha-segura',
    })
    expect(router.currentRoute.value.path).toBe('/app')
    wrapper.unmount()
  })
  it('rejects mismatching registration passwords', async () => {
    const { wrapper } = await render('register')
    await wrapper.get('#name').setValue('Ana')
    await wrapper.get('#email').setValue('ana@example.test')
    await wrapper.get('#password').setValue('senha-segura')
    await wrapper.get('#password_confirmation').setValue('outra-senha')
    await wrapper.find('form').trigger('submit')
    expect(wrapper.text()).toContain('As senhas precisam ser iguais.')
    expect(authApi.register).not.toHaveBeenCalled()
    wrapper.unmount()
  })
  it('allows toggling password visibility', async () => {
    const { wrapper } = await render()
    await wrapper.get('[aria-label="Mostrar senha"]').trigger('click')
    expect(wrapper.get('#password').attributes('type')).toBe('text')
    await wrapper.get('[aria-label="Ocultar senha"]').trigger('click')
    expect(wrapper.get('#password').attributes('type')).toBe('password')
    wrapper.unmount()
  })
  it('shows non-enumerating recovery confirmation', async () => {
    const { wrapper } = await render('forgot')
    await wrapper.get('#email').setValue('ana@example.test')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(wrapper.text()).toContain('Se houver uma conta com esse e-mail')
    expect(authApi.forgotPassword).toHaveBeenCalledWith('ana@example.test')
    wrapper.unmount()
  })
})
