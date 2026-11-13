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

const commercialSubscriptions = new Map<string, { listeners: Set<Listener>; channel: ReturnType<Echo<'reverb'>['private']> }>()

/** Shared Echo connection, independent tenant channels and reference-counted listeners. */
export function subscribeCommercialRealtime(tenantId: string, callback: Listener): () => void {
  const client = connection()
  if (!client || !tenantId) return () => {}

  let subscription = commercialSubscriptions.get(tenantId)
  if (!subscription) {
    const channel = client.private('tenant.' + tenantId + '.commercial')
    subscription = { channel, listeners: new Set<Listener>() }
    const current = subscription
    channel.listen('.commercial.changed', () => current.listeners.forEach(fn => fn()))
    commercialSubscriptions.set(tenantId, subscription)
  }
  subscription.listeners.add(callback)

  return () => {
    const current = commercialSubscriptions.get(tenantId)
    if (!current) return
    current.listeners.delete(callback)
    if (current.listeners.size === 0) {
      client.leave('tenant.' + tenantId + '.commercial')
      commercialSubscriptions.delete(tenantId)
    }
  }
}
