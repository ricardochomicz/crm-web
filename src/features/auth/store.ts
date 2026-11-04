import { defineStore } from 'pinia'
import { ref } from 'vue'
import { ApiError } from '@/lib/http'
import { authApi } from './api'
import type { Credentials, Registration, User } from './types'
export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const initialized = ref(false)
  let pending: Promise<void> | null = null
  async function refresh() {
    user.value = (await authApi.me()).data
    initialized.value = true
  }
  async function initialize() {
    if (initialized.value) return
    if (pending) return pending
    pending = (async () => {
      try {
        await refresh()
      } catch (error) {
        if (!(error instanceof ApiError) || error.status !== 401) throw error
        user.value = null
        initialized.value = true
      } finally {
        pending = null
      }
    })()
    return pending
  }
  async function login(data: Credentials) {
    await authApi.login(data)
    await refresh()
  }
  async function register(data: Registration) {
    await authApi.register(data)
    await refresh()
  }
  function clear() {
    user.value = null
    initialized.value = true
  }
  async function logout() {
    try {
      await authApi.logout()
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 401) throw error
    }
    clear()
  }
  return { user, initialized, initialize, refresh, login, register, logout, clear }
})
