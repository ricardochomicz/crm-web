import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { tenantApi } from '@/features/tenants/api'
import { operatorsApi } from '@/features/operators/api'
import { clientsApi, type Client } from '../api'
import { useClientsData } from '../composables/useClientsData'

vi.mock('@/features/tenants/api', () => ({ tenantApi: { show: vi.fn() } }))
vi.mock('@/features/operators/api', () => ({ operatorsApi: { available: vi.fn() } }))
vi.mock('../api', () => ({
  clientsApi: { list: vi.fn(), classifications: vi.fn(), options: vi.fn() },
}))

function stubStaticResponses() {
  vi.mocked(tenantApi.show).mockResolvedValue({ data: { id: 'tenant' } } as never)
  vi.mocked(operatorsApi.available).mockResolvedValue({ data: [] } as never)
  vi.mocked(clientsApi.classifications).mockResolvedValue({ data: [] } as never)
  vi.mocked(clientsApi.options).mockResolvedValue({
    data: { sellers: [], can_assign_seller: false, current_seller_id: null },
  } as never)
}

const response = (id: string) => ({
  data: [{ id, company_name: id } as Client],
  meta: { can_manage: true, can_create: true, can_delete: false },
})

describe('clients data request lifecycle', () => {
  it('does not replace the latest list with an older response', async () => {
    stubStaticResponses()
    const pending: Array<(value: ReturnType<typeof response>) => void> = []
    vi.mocked(clientsApi.list).mockReset().mockImplementation(
      () => new Promise((resolve) => { pending.push(resolve) }),
    )
    const data = useClientsData({
      tenantId: ref('tenant'),
      hasPendingContact: () => false,
      onPendingContact: vi.fn(async () => {}),
    })

    const first = data.load()
    const second = data.load()
    pending[1]!(response('new'))
    await second
    pending[0]!(response('old'))
    await first

    expect(data.rows.value.map((client) => client.id)).toEqual(['new'])
    expect(data.loading.value).toBe(false)
  })

  it('ignores a response from a previous tenant', async () => {
    stubStaticResponses()
    const tenantId = ref('tenant-a')
    let resolve!: (value: ReturnType<typeof response>) => void
    vi.mocked(clientsApi.list).mockReset().mockImplementation(
      () => new Promise((done) => { resolve = done }),
    )
    const data = useClientsData({
      tenantId,
      hasPendingContact: () => false,
      onPendingContact: vi.fn(async () => {}),
    })

    const loading = data.load()
    tenantId.value = 'tenant-b'
    data.invalidate()
    resolve(response('old-tenant'))
    await loading

    expect(data.rows.value).toEqual([])
    expect(data.loading.value).toBe(false)
  })

  it('checks request validity before opening a pending contact', async () => {
    stubStaticResponses()
    vi.mocked(clientsApi.list).mockReset().mockResolvedValue({
      ...response('pending'),
      data: [{ id: 'pending', contact_pending: true } as Client],
    } as never)
    const onPendingContact = vi.fn(async (_client: Client, isCurrent: () => boolean) => {
      expect(isCurrent()).toBe(true)
    })
    const data = useClientsData({
      tenantId: ref('tenant'),
      hasPendingContact: () => false,
      onPendingContact,
    })

    await data.load()
    expect(onPendingContact).toHaveBeenCalledOnce()
  })
})
