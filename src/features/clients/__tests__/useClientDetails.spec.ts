import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { clientsApi, type Client } from '../api'
import { useClientDetails } from '../composables/useClientDetails'

vi.mock('../api', () => ({ clientsApi: { show: vi.fn() } }))
vi.mock('@/services/toast', () => ({ toast: { error: vi.fn() } }))

const client = (id: string) => ({ id, company_name: id }) as Client

describe('client details concurrency', () => {
  it('keeps the latest selected client when responses arrive out of order', async () => {
    const pending: Array<(value: { data: Client }) => void> = []
    vi.mocked(clientsApi.show).mockReset().mockImplementation(
      () => new Promise((resolve) => { pending.push(resolve) }),
    )
    const details = useClientDetails(ref('tenant'))
    const first = details.details('first')
    const second = details.details('second')
    pending[1]!({ data: client('second') })
    expect(await second).toBe(true)
    pending[0]!({ data: client('first') })
    expect(await first).toBe(false)
    expect(details.selected.value?.id).toBe('second')
  })

  it('discards responses after switching tenants', async () => {
    const tenant = ref('tenant-a')
    let resolve!: (value: { data: Client }) => void
    vi.mocked(clientsApi.show).mockReset().mockImplementation(
      () => new Promise((done) => { resolve = done }),
    )
    const details = useClientDetails(tenant)
    const request = details.details('client-a')
    tenant.value = 'tenant-b'
    details.resetDetails()
    resolve({ data: client('client-a') })
    expect(await request).toBe(false)
    expect(details.selected.value).toBeNull()
  })

  it('opens history only for a successful current request', async () => {
    vi.mocked(clientsApi.show).mockReset().mockResolvedValue({ data: client('client-a') } as never)
    const details = useClientDetails(ref('tenant'))
    await details.openHistory('client-a')
    expect(details.selected.value?.id).toBe('client-a')
    expect(details.detailsInitialTab.value).toBe('history')
  })
})
