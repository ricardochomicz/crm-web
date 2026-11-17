import Echo from 'laravel-echo'
import Pusher from 'pusher-js'
import type { ChannelAuthorizationCallback } from 'pusher-js'
import { request } from '@/lib/http'

type AuthData = NonNullable<Parameters<ChannelAuthorizationCallback>[1]>
type Listener = (ticketId: string) => void
type Subscription = { listeners: Set<Listener> }

let echo: Echo<'reverb'> | null = null
const subscriptions = new Map<string, Subscription>()

function connect(): Echo<'reverb'> | null {
  if (echo) return echo
  const key = import.meta.env.VITE_REVERB_APP_KEY
  if (!key) return null
  try {
    ;(window as Window & { Pusher?: typeof Pusher }).Pusher = Pusher
    const connection = new Echo({
      broadcaster: 'reverb',
      key,
      wsHost: import.meta.env.VITE_REVERB_HOST || window.location.hostname,
      wsPort: Number(import.meta.env.VITE_REVERB_PORT || 80),
      wssPort: Number(import.meta.env.VITE_REVERB_PORT || 443),
      forceTLS: import.meta.env.VITE_REVERB_SCHEME === 'https',
      enabledTransports: ['ws', 'wss'],
      authorizer: (channel: { name: string }) => ({
        authorize: (socketId: string, callback: ChannelAuthorizationCallback) => {
          void request<AuthData>('/broadcasting/auth', {
            method: 'POST',
            body: JSON.stringify({ socket_id: socketId, channel_name: channel.name }),
          }).then(data => callback(null, data))
            .catch(error => callback(error instanceof Error ? error : new Error('Autorização indisponível'), null))
        },
      }),
    })
    connection.connector.pusher.connection.bind('error', (error: unknown) => {
      console.warn('Reverb: falha na conexão do suporte', error)
    })
    echo = connection
    return echo
  } catch (error) {
    console.warn('Não foi possível conectar o suporte ao Reverb', error)
    return null
  }
}

export function subscribeSupportChanges(channelName: string, onChanged: Listener): () => void {
  const connection = connect()
  if (!connection) return () => {}
  let subscription = subscriptions.get(channelName)
  if (!subscription) {
    subscription = { listeners: new Set() }
    subscriptions.set(channelName, subscription)
    connection.private(channelName).listen('.support.ticket.changed', (event: { ticket_id: string }) => {
      for (const listener of subscriptions.get(channelName)?.listeners ?? []) listener(event.ticket_id)
    })
  }
  subscription.listeners.add(onChanged)
  return () => {
    const active = subscriptions.get(channelName)
    if (!active) return
    active.listeners.delete(onChanged)
    if (active.listeners.size) return
    subscriptions.delete(channelName)
    connection.leave(channelName)
    if (!subscriptions.size) {
      try { connection.disconnect() } catch { /* Conexão já encerrada */ }
      if (echo === connection) echo = null
    }
  }
}
