import { mutate, request } from '@/lib/http'

export type OnboardingStep = 'company' | 'plan' | 'operators' | 'commissions' | 'classifications'
export interface OnboardingProgress {
  completed: boolean
  completed_at: string | null
  steps: {
    company: { complete: boolean }
    plan: { complete: boolean }
    operators: { complete: boolean; operator_ids: number[] }
    commissions: { complete: boolean; missing_operator_ids: number[] }
    classifications: { complete: boolean; missing_operator_ids: number[] }
  }
}

const path = (tenantId: string) => `/api/v1/tenants/${encodeURIComponent(tenantId)}/onboarding`
export const onboardingApi = {
  progress: (tenantId: string) => request<{ data: OnboardingProgress }>(path(tenantId)),
  complete: (tenantId: string) => mutate<{ data: OnboardingProgress }>(`${path(tenantId)}/complete`, {}),
}
