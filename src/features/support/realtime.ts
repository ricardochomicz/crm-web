import Echo from 'laravel-echo'
import Pusher from 'pusher-js'
import type { ChannelAuthorizationCallback } from 'pusher-js'
import { request } from '@/lib/http'

type AuthData = NonNullable<Parameters<ChannelAuthorizationCallback>[1]>

export function subscribeSupportChanges(channelName: string, onChanged: (ticketId: string) => void): () => void {
  const key = import.meta.env.VITE_REVERB_APP_KEY
  if (!key) return () => {}
  let echo: Echo<'reverb'> | null = null
  try {
    ;(window as Window & { Pusher?: typeof Pusher }).Pusher = Pusher
    echo = new Echo({
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
    echo.private(channelName).listen('.support.ticket.changed', (event: { ticket_id: string }) => {
      onChanged(event.ticket_id)
    })
  } catch (error) {
    console.warn('Suporte em tempo real indisponível', error)
    try { echo?.disconnect() } catch { /* Ignorar falha ao desconectar */ }
    return () => {}
  }
  const connection = echo
  return () => { try { connection?.disconnect() } catch { /* Ignorar falha ao desconectar */ } }
}
