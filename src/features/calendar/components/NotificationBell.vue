<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import Echo from 'laravel-echo'
import Pusher from 'pusher-js'
import type { ChannelAuthorizationCallback } from 'pusher-js'
import { useRouter } from 'vue-router'
import { activityNotificationsApi, type ActivityNotification } from '../notificationsApi'
import { request } from '@/lib/http'
import { subscribeActivityChanged } from '../activityEvents'

type ChannelAuthorizationData = NonNullable<Parameters<ChannelAuthorizationCallback>[1]>

const router = useRouter()
const props = defineProps<{ tenantId: string }>()
const notifications = ref<ActivityNotification[]>([])
const unread = ref(0)
const membershipId = ref('')
const open = ref(false)
const loading = ref(false)
const error = ref('')
let version = 0
let echo: Echo<'reverb'> | null = null
let fallback: ReturnType<typeof setInterval> | undefined
let unsubscribeActivityChanged: (() => void) | undefined

async function refresh() {
  const current = ++version
  loading.value = true
  try {
    const response = await activityNotificationsApi.list(props.tenantId)
    if (current !== version) return
    notifications.value = response.data
    unread.value = response.unread
    window.dispatchEvent(new CustomEvent('activity-notifications:changed', { detail: { tenantId: props.tenantId } }))
    if (membershipId.value !== response.membership_id) {
      membershipId.value = response.membership_id
      subscribe()
    }
    error.value = ''
  } catch {
    if (current === version) error.value = 'Não foi possível carregar as notificações.'
  } finally {
    if (current === version) loading.value = false
  }
}

async function markRead(item: ActivityNotification) {
  if (item.read_at) return
  try {
    await activityNotificationsApi.markRead(props.tenantId, item.id)
    await refresh()
  } catch {
    error.value = 'Não foi possível marcar a notificação como lida.'
  }
}

async function markAllRead() {
  if (!unread.value) return
  try {
    await activityNotificationsApi.markAllRead(props.tenantId)
    await refresh()
  } catch {
    error.value = 'Não foi possível marcar todas como lidas.'
  }
}

async function openActivity(item: ActivityNotification) {
  if (!item.read_at) await markRead(item)
  open.value = false
  await router.push({ path: `/empresas/${props.tenantId}/atividades`, query: { atividade: item.calendar_event_id } })
}

function disconnect() {
  version++
  if (fallback) clearInterval(fallback)
  fallback = undefined
  if (echo) {
    try { echo.disconnect() } catch (cause) { console.warn('Falha ao encerrar conexão de notificações', cause) }
    echo = null
  }
}
function connect() {
  disconnect()
  notifications.value = []
  unread.value = 0
  open.value = false
  membershipId.value = ''
  if (!props.tenantId) return
  void refresh()
  fallback = setInterval(() => { void refresh() }, 60000)
}
function subscribe() {
  const key = import.meta.env.VITE_REVERB_APP_KEY
  if (!key || !membershipId.value || echo) return
  try {
    // Echo expects a Pusher instance in `client`, not the Pusher constructor.
    // Let Echo construct the client using the registered Pusher implementation.
    (window as Window & { Pusher?: typeof Pusher }).Pusher = Pusher
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
          void (async () => {
          try {
            const result = await request<ChannelAuthorizationData>('/broadcasting/auth', {
              method: 'POST',
              body: JSON.stringify({ socket_id: socketId, channel_name: channel.name }),
            })
            callback(null, result)
          } catch (cause) {
            callback(cause instanceof Error ? cause : new Error('Autorização indisponível'), null)
          }
          })()
        },
      }),
    })
    echo.private(`tenant.${props.tenantId}.member.${membershipId.value}.notifications`)
      .listen('.activity.notification.changed', () => { void refresh() })
  } catch (cause) {
    console.warn('Não foi possível iniciar as notificações em tempo real', cause)
    if (echo) {
      try { echo.disconnect() } catch { /* Polling remains available. */ }
      echo = null
    }
  }
}
watch(() => props.tenantId, connect)
onMounted(() => {
  connect()
  unsubscribeActivityChanged = subscribeActivityChanged(tenantId => {
    if (tenantId === props.tenantId) void refresh()
  })
})
onUnmounted(() => {
  unsubscribeActivityChanged?.()
  disconnect()
})
</script>

<template>
  <div class="relative">
    <button type="button" class="relative rounded-lg p-2 text-slate-600 hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-orange-600" aria-label="Notificações" :aria-expanded="open" @click="open = !open; if (open) refresh()">
      <svg xmlns="http://www.w3.org/2000/svg" class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg>
      <span v-if="unread" class="absolute -right-1 -top-1 rounded-full bg-rose-600 px-1.5 py-0.5 text-[10px] font-bold text-white">{{ unread > 99 ? '99+' : unread }}</span>
    </button>
    <section v-if="open" class="absolute right-0 z-50 mt-2 w-[min(22rem,90vw)] overflow-hidden rounded-xl border border-stone-200 bg-white shadow-xl" aria-label="Central de notificações">
      <div class="flex items-center justify-between border-b px-4 py-3"><h2 class="font-semibold">Notificações</h2><div class="flex gap-3"><button v-if="unread" type="button" class="text-xs text-orange-700 underline" @click="markAllRead">Marcar todas como lidas</button><button type="button" class="text-xs text-slate-500 underline" @click="refresh">Atualizar</button></div></div>
      <p v-if="error" role="alert" class="px-4 py-3 text-sm text-red-700">{{ error }}</p>
      <p v-if="loading && !notifications.length" class="p-4 text-sm text-slate-500">Carregando…</p>
      <p v-else-if="!notifications.length" class="p-4 text-sm text-slate-500">Nenhuma notificação.</p>
      <ul v-else class="max-h-80 divide-y overflow-y-auto">
        <li v-for="item in notifications" :key="item.id" class="p-3" :class="!item.read_at ? 'bg-orange-50/50' : ''">
          <div class="flex items-start justify-between gap-3">
            <div><button type="button" class="text-left hover:underline focus-visible:outline-2 focus-visible:outline-orange-600" @click="openActivity(item)"><span class="text-sm font-semibold">{{ item.title }}</span><span class="mt-1 block text-xs text-slate-600">{{ item.message }}</span></button><p class="mt-1 text-[11px] text-slate-400">{{ new Date(item.created_at).toLocaleString('pt-BR') }}</p></div>
            <button v-if="!item.read_at" type="button" class="shrink-0 text-xs font-semibold text-orange-700 underline" @click="markRead(item)">Marcar lida</button>
          </div>
        </li>
      </ul>
    </section>
  </div>
</template>
