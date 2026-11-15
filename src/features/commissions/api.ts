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

export type CommissionReport = {
  pending_issues: Array<{ code: string; lines: number }>
  pending_orders: Array<{ order_id: string; sold_on: string; activated_on: string | null; revision: number; issues: string[] }>
  period: { from: string; to: string }
  summary: Array<{
    status: 'ESTIMATED' | 'ELIGIBLE' | 'PENDING_RULES'
    items: number
    lines: number
    gross: string
    deduction: string
    net: string
    participants: string
    company_balance: string
  }>
  participants: Array<{
    role: string
    tenant_user_id: string | null
    commercial_participant_id: string | null
    name: string
    estimated: string
    eligible: string
  }>
  note: string
}

export type CommissionRevisionPreview = {
  orders: Array<{ order_id: string; sold_on: string; pending_items: number; pending_lines: number }>
  truncated: boolean
  requires_manual_review: boolean
  message: string
}

export const commissionsApi = {
  bulkRevise: (tenantId: string, payload: { order_ids: string[]; operator_id: number; order_type: string; reason: string }) =>
    mutate(base(tenantId) + '/bulk-revisions', payload, 'POST') as Promise<{ data: { revised: number; skipped: number; failed: number; results: Array<{ order_id: string; status: string; reason?: string; revision?: number }> } }>,
  revisionPreview: (tenantId: string, filters: { operator_id: number; order_type: string; from?: string; to?: string }) => {
    const params = new URLSearchParams({
      operator_id: String(filters.operator_id),
      order_type: filters.order_type,
    })
    if (filters.from) params.set('from', filters.from)
    if (filters.to) params.set('to', filters.to)
    return request<{ data: CommissionRevisionPreview }>(base(tenantId) + '/revision-preview?' + params.toString())
  },
  report: (tenantId: string, filters: { from: string; to: string; status?: string }) => {
    const query = new URLSearchParams({ from: filters.from, to: filters.to })
    if (filters.status) query.set('status', filters.status)
    return request<{ data: CommissionReport }>(base(tenantId) + '/report?' + query.toString())
  },
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
