import { mutate, request } from '@/lib/http'
import type { Credentials, Registration, User } from './types'
export const authApi = {
  me: () => request<{ data: User }>('/api/v1/me'),
  login: (data: Credentials) => mutate('/api/v1/auth/login', data),
  register: (data: Registration) => mutate('/api/v1/auth/register', data),
  logout: () => mutate('/api/v1/auth/logout'),
  forgotPassword: (email: string) => mutate('/api/v1/auth/password/email', { email }),
  resetPassword: (data: Credentials & { token: string; password_confirmation: string }) =>
    mutate('/api/v1/auth/password/reset', data),
}
