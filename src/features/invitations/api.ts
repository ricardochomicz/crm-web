import { mutate, request } from '@/lib/http'
export const invitationApi = {
  show: (token: string) =>
    request<{ data: { is_available: boolean; email: string | null } }>(
      `/api/v1/invitations/${encodeURIComponent(token)}`,
    ),
  accept: (token: string) =>
    mutate<{ data: { tenant_id: string } }>('/api/v1/invitations/accept', { token }),
}
