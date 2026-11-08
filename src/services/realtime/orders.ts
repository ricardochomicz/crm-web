import Echo from 'laravel-echo'
import Pusher from 'pusher-js'
import { request } from '@/lib/http'

type Listener = () => void
let echo: Echo<'reverb'> | null = null
let activeTenant = ''
let activeChannel: ReturnType<Echo<'reverb'>['private']> | null = null
const listeners = new Set<Listener>()

function connection(): Echo<'reverb'> | null {
  if (echo) return echo
  const key = import.meta.env.VITE_REVERB_APP_KEY
  if (!key) return null
  const host = import.meta.env.VITE_REVERB_HOST || window.location.hostname
  echo = new Echo<'reverb'>({
    broadcaster: 'reverb',
    key,
    wsHost: host,
    wsPort: Number(import.meta.env.VITE_REVERB_PORT || 8080),
    wssPort: Number(import.meta.env.VITE_REVERB_PORT || 443),
    forceTLS: import.meta.env.VITE_REVERB_SCHEME === 'https',
    enabledTransports: ['ws', 'wss'],
    client: new Pusher(key, {
      cluster: 'mt1',
      wsHost: host,
      wsPort: Number(import.meta.env.VITE_REVERB_PORT || 8080),
      wssPort: Number(import.meta.env.VITE_REVERB_PORT || 443),
      forceTLS: import.meta.env.VITE_REVERB_SCHEME === 'https',
      enabledTransports: ['ws', 'wss'],
      channelAuthorization: {
        transport: 'ajax',
        endpoint: '/broadcasting/auth',
        customHandler: async (params, callback) => {
          try {
            const result = await request<{ auth: string; channel_data?: string }>('/broadcasting/auth', {
              method: 'POST',
              body: JSON.stringify(params),
            })
            callback(null, result)
          } catch (error) {
            callback(error as Error, null)
          }
        },
      },
    }),
  })
  return echo
}

export function subscribeOrders(tenantId: string, callback: Listener): () => void {
  const client = connection()
  if (!client) return () => {}
  if (activeTenant !== tenantId) {
    if (activeChannel) client.leave('tenant.' + activeTenant + '.orders')
    activeTenant = tenantId
    listeners.clear()
    activeChannel = client.private('tenant.' + tenantId + '.orders')
    activeChannel.listen('.orders.changed', () => listeners.forEach(fn => fn()))
  }
  listeners.add(callback)
  return () => {
    listeners.delete(callback)
    if (!listeners.size && activeChannel) {
      client.leave('tenant.' + activeTenant + '.orders')
      activeChannel = null
      activeTenant = ''
    }
  }
}
