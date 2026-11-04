<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppNavigation from './AppNavigation.vue'
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
      <div class="mt-auto rounded-2xl bg-[#f8f6f2] p-4">
        <span class="text-xs font-semibold text-slate-700">Cada conexão importa.</span>
        <p class="mt-2 text-xs leading-6 text-slate-500">
          Um lugar para sua equipe trabalhar mais próxima.
        </p>
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
    <main id="main-content" class="mx-auto max-w-7xl px-5 py-8 sm:px-9 sm:py-11">
      <p v-if="error" role="alert" class="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-800">
        {{ error }} <button class="underline" @click="logout">Tentar novamente</button>
      </p>
      <slot />
    </main>
  </div>
</template>
