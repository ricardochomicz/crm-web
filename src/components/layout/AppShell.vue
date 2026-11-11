<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppNavigation from './AppNavigation.vue'
import NotificationBell from '@/features/calendar/components/NotificationBell.vue'
import { can } from '@/features/tenants/types'
import type { Tenant } from '@/features/tenants/types'
import BrandLogo from '@/components/ui/BrandLogo.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import { useAuthStore } from '@/features/auth/store'
import { errorMessage } from '@/lib/feedback'
withDefaults(defineProps<{ title?: string; subtitle?: string; tenant?: Tenant }>(), {
  title: 'Seu espaço de trabalho',
  subtitle: 'TelecomHub',
})
const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const menuOpen = ref(false)
const wideLayout = ref(true)
const layoutPreferenceKey = 'crm:layout-width'
onMounted(() => {
  try {
    wideLayout.value = window.localStorage.getItem(layoutPreferenceKey) !== 'normal'
  } catch {
    wideLayout.value = true
  }
})
function toggleLayoutWidth() {
  wideLayout.value = !wideLayout.value
  try {
    window.localStorage.setItem(layoutPreferenceKey, wideLayout.value ? 'wide' : 'normal')
  } catch {
    // A preferência permanece ativa nesta sessão se o armazenamento estiver indisponível.
  }
}
watch(
  () => route.fullPath,
  () => {
    menuOpen.value = false
  },
)
const busy = ref(false)
const error = ref('')
async function logout() {
  if (busy.value) return
  busy.value = true
  error.value = ''
  try {
    await auth.logout()
    await router.replace('/login')
  } catch (failure) {
    error.value = errorMessage(failure)
  } finally {
    busy.value = false
  }
}
</script>
<template>
  <div class="min-h-dvh bg-[#f7f8fa] lg:pl-64">
    <aside
      class="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col overflow-y-auto border-r border-stone-200 bg-white px-5 py-7 lg:flex"
    >
      <RouterLink to="/app" aria-label="TelecomHub, início" class="px-2"><BrandLogo /></RouterLink>
      <AppNavigation :tenant="tenant" class="mb-8 mt-9" />
      <div class="mt-auto mb-4">
    <button
      type="button"
      class="flex w-full items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
      :aria-label="wideLayout ? 'Usar largura normal' : 'Usar largura ampla'"
      :aria-pressed="wideLayout"
      :title="wideLayout ? 'Voltar à largura normal' : 'Expandir área de trabalho'"
      @click="toggleLayoutWidth"
    >
      <svg v-if="wideLayout" xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 3v5H3M16 3v5h5M8 21v-5H3M16 21v-5h5"/><path d="m3 3 5 5m13-5-5 5M3 21l5-5m13 5-5-5"/></svg>
      <svg v-else xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5"/><path d="m3 8 5-5m8 0 5 5M3 16l5 5m8 0 5-5"/></svg>
      {{ wideLayout ? 'Normal' : 'Wide' }}
    </button>
      </div>
    </aside>
    <header class="border-b border-stone-200 bg-white px-5 py-4 sm:px-9">
      <div class="flex items-center justify-between gap-4">
        <div>
          <p class="text-[10px] font-semibold uppercase tracking-[.15em] text-slate-400">
            {{ subtitle }}
          </p>
          <p class="mt-1 text-sm font-semibold text-slate-700">{{ title }}</p>
        </div>
        <div class="flex items-center gap-3">
          <NotificationBell v-if="tenant && can(tenant, 'calendar.view')" :tenant-id="tenant.id" />
          <RouterLink v-if="tenant?.role !== 'CONSULTANT'" to="/empresas" class="hidden min-w-0 items-center gap-3 rounded-xl border border-stone-200 px-3 py-2 text-left transition hover:border-orange-300 hover:bg-orange-50 sm:flex" aria-label="Selecionar ou trocar empresa">
            <span class="min-w-0"><span class="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">Empresa atual</span><span class="block max-w-48 truncate text-xs font-semibold text-slate-800">{{ tenant?.name ?? 'Minhas empresas' }}</span></span>
            <AppIcon name="arrow" class="size-4 shrink-0 text-slate-400" />
          </RouterLink>
          <span class="hidden text-right text-xs sm:block"
            ><span class="block font-semibold text-slate-700">{{ auth.user?.name }}</span
            ><span class="mt-1 block text-slate-400">{{ auth.user?.email }}</span></span
          ><span
            class="flex size-10 shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-800"
            aria-hidden="true"
            >{{ auth.user?.name.slice(0, 1).toUpperCase() }}</span
          ><button
            class="secondary-button lg:hidden"
            :aria-expanded="menuOpen"
            aria-controls="mobile-menu"
            @click="menuOpen = !menuOpen"
          >
            Menu</button
          ><button
            class="hidden rounded-lg p-2.5 text-slate-500 hover:bg-stone-100 lg:block"
            :disabled="busy"
            aria-label="Sair da conta"
            @click="logout"
          >
            <AppIcon name="logout" class="size-5" />
          </button>
        </div>
      </div>
      <nav
        v-if="menuOpen"
        id="mobile-menu"
        aria-label="Menu principal móvel"
        class="mt-5 space-y-2 border-t border-stone-100 pt-4 lg:hidden"
      >
        <AppNavigation :tenant="tenant" /><button
          class="nav-item mt-5 w-full"
          :disabled="busy"
          @click="logout"
        >
          {{ busy ? 'Saindo…' : 'Sair da conta' }}
        </button>
      </nav>
    </header>
    <main id="main-content" class="mx-auto w-full px-5 py-8 transition-[max-width] duration-200 sm:px-9 sm:py-11" :class="wideLayout ? 'max-w-[1920px]' : 'max-w-7xl'">
      <p v-if="error" role="alert" class="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-800">
        {{ error }} <button class="underline" @click="logout">Tentar novamente</button>
      </p>
      <slot />
    </main>

  </div>
</template>

