import { request, mutate } from '@/lib/http'
import type { CommissionFormValue } from './components/CommissionForm.vue'

export type Commission = {
  id: string
  name: string
  order_type: string | null
  operator_id: number
  operator?: { name: string }
  percentage: string
  deduction_percentage: string | null
  is_active: boolean
}

export type OrderTypeOption = { value: string; label: string }

const base = (tenantId: string) =>
  `/api/v1/tenants/${encodeURIComponent(tenantId)}/commissions`

export const commissionsApi = {
  list: (tenantId: string) =>
    request<{ data: Commission[]; meta: { can_manage: boolean } }>(base(tenantId)),
  orderTypes: (tenantId: string) =>
    request<{ data: OrderTypeOption[] }>(base(tenantId) + '/order-types'),
  settings: (tenantId: string) =>
    request<{ data: { default_deduction_percentage: string } }>(base(tenantId) + '/settings'),
  saveSettings: (tenantId: string, percentage: number) =>
    mutate(base(tenantId) + '/settings', { default_deduction_percentage: percentage }, 'PUT'),
  save: (tenantId: string, form: CommissionFormValue, id?: string) => {
    const payload = {
      ...form,
      percentage: Number(form.percentage.replace(',', '.')),
      deduction_percentage: form.deduction_percentage === ''
        ? null
        : Number(form.deduction_percentage.replace(',', '.')),
    }
    return mutate(base(tenantId) + (id ? '/' + encodeURIComponent(id) : ''), payload, id ? 'PATCH' : 'POST')
  },
}
