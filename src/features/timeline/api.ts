import { mutate, request } from '@/lib/http'

export type TimelineType = 'opportunity' | 'client' | 'commercial_order'

export type TimelineAttachment = {
    id: string
    original_name: string
    mime_type: string
    size_bytes: number
}

export type TimelineComment = {
    id: string
    tenant_user_id: string
    content: string
    can_edit: boolean
    created_at: string
    edited_at: string | null
    author?: { user?: { name: string } }
    attachments: TimelineAttachment[]
}

export type TimelinePage = {
    data: TimelineComment[]
    current_page: number
    last_page: number
}

const base = (tenantId: string) => '/api/v1/tenants/' + encodeURIComponent(tenantId) + '/timeline'

export const timelineApi = {
    list: (tenantId: string, type: TimelineType, id: string, page = 1) =>
        request<TimelinePage>(base(tenantId) + '/' + type + '/' + encodeURIComponent(id) + '?page=' + page),
    create: (tenantId: string, type: TimelineType, id: string, content: string) =>
        mutate<{ data: TimelineComment }>(base(tenantId) + '/' + type + '/' + encodeURIComponent(id), { content }),
    update: (tenantId: string, id: string, content: string) =>
        mutate<{ data: TimelineComment }>(base(tenantId) + '/comments/' + encodeURIComponent(id), { content }, 'PATCH'),
    remove: (tenantId: string, id: string) =>
        mutate<void>(base(tenantId) + '/comments/' + encodeURIComponent(id), {}, 'DELETE'),
    upload: async (tenantId: string, id: string, file: File) => {
        await request('/sanctum/csrf-cookie')
        const body = new FormData()
        body.append('file', file)
        return request<{ data: TimelineAttachment }>(base(tenantId) + '/comments/' + encodeURIComponent(id) + '/attachments', {
            method: 'POST',
            body,
        })
    },
    download: async (tenantId: string, attachment: TimelineAttachment) => {
        const url = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '') + base(tenantId) + '/attachments/' + encodeURIComponent(attachment.id) + '/download'
        const response = await fetch(url, { credentials: 'include' })
        if (!response.ok) throw new Error('Não foi possível baixar o arquivo.')
        const blob = await response.blob()
        const objectUrl = URL.createObjectURL(blob)
        const anchor = document.createElement('a')
        anchor.href = objectUrl
        anchor.download = attachment.original_name
        anchor.click()
        setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
    },
}
