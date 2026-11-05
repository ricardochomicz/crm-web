<script setup lang="ts">
import { useRoute } from 'vue-router'
import AppIcon from '@/components/ui/AppIcon.vue'
import { can, canViewTeam, canViewTeams, type Tenant } from '@/features/tenants/types'
import { useAuthStore } from '@/features/auth/store'
defineProps<{ tenant?: Tenant }>()
const route = useRoute()
const auth = useAuthStore()
</script>
<template>
  <div class="space-y-7">
    <RouterLink
      to="/empresas"
      class="flex items-center justify-between gap-3 rounded-xl border border-stone-200 bg-stone-50 p-3 hover:border-orange-300"
      aria-label="Selecionar ou trocar empresa"
    >
      <span class="min-w-0"
        ><span class="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">{{
          tenant ? 'Empresa atual' : 'Espaços de trabalho'
        }}</span
        ><span class="mt-1 block truncate text-sm font-semibold text-slate-800">{{
          tenant?.name ?? 'Minhas empresas'
        }}</span
        ><span class="mt-1 block text-xs text-slate-500">{{
          tenant ? 'Trocar empresa' : 'Selecionar empresa'
        }}</span></span
      ><AppIcon name="arrow" class="size-4 shrink-0 text-slate-400" />
    </RouterLink>
    <nav aria-label="Menu principal" class="space-y-6">
      <template v-if="tenant">
        <RouterLink
          :to="`/empresas/${tenant.id}`"
          class="nav-item"
          :class="{ 'nav-active': route.path === `/empresas/${tenant.id}` }"
          :aria-current="route.path === `/empresas/${tenant.id}` ? 'page' : undefined"
          ><AppIcon name="grid" class="size-5" />Início</RouterLink
        >
        <div v-if="canViewTeam(tenant)" class="space-y-2">
          <p class="px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Equipe</p>
          <RouterLink
            :to="`/empresas/${tenant.id}/equipe`"
            class="nav-item"
            :class="{ 'nav-active': route.path.endsWith('/equipe') }"
            :aria-current="route.path.endsWith('/equipe') ? 'page' : undefined"
            ><AppIcon name="mail" class="size-5" />Membros e convites</RouterLink
          >
          <RouterLink
            v-if="canViewTeams(tenant)"
            :to="`/empresas/${tenant.id}/equipes`"
            class="nav-item"
            :class="{ 'nav-active': route.path.endsWith('/equipes') }"
            :aria-current="route.path.endsWith('/equipes') ? 'page' : undefined"
            ><AppIcon name="grid" class="size-5" />Equipes</RouterLink
          >
        </div>
        <div class="space-y-2">
          <p class="px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Configurações
          </p>
          <RouterLink
            :to="`/empresas/${tenant.id}/dados`"
            class="nav-item"
            :class="{ 'nav-active': route.path.endsWith('/dados') }"
            :aria-current="route.path.endsWith('/dados') ? 'page' : undefined"
            >Dados da empresa</RouterLink
          >
          <RouterLink
            :to="`/empresas/${tenant.id}/unidades`"
            class="nav-item"
            :class="{ 'nav-active': route.path.endsWith('/unidades') }"
            :aria-current="route.path.endsWith('/unidades') ? 'page' : undefined"
            >Matriz e filiais</RouterLink
          >
          <RouterLink
            v-if="tenant.access?.can_manage_permissions"
            :to="`/empresas/${tenant.id}/permissoes`"
            class="nav-item"
            :class="{ 'nav-active': route.path.endsWith('/permissoes') }"
            :aria-current="route.path.endsWith('/permissoes') ? 'page' : undefined"
            >Cargos e permissões</RouterLink
          >
          <RouterLink
            v-if="can(tenant, 'subscription.view')"
            :to="`/empresas/${tenant.id}/assinatura`"
            class="nav-item"
            :class="{ 'nav-active': route.path.endsWith('/assinatura') }"
            :aria-current="route.path.endsWith('/assinatura') ? 'page' : undefined"
            >Plano e assinatura</RouterLink
          >
        </div>
      </template>
      <RouterLink
        v-else
        to="/empresas"
        class="nav-item"
        :class="{ 'nav-active': route.path === '/empresas' || route.path === '/app' }"
        >Minhas empresas</RouterLink
      >
      <div v-if="auth.user?.is_platform_admin" class="space-y-2 border-t border-stone-100 pt-5">
        <p class="px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
          Plataforma
        </p>
        <RouterLink
          to="/admin"
          class="nav-item"
          :class="{ 'nav-active': route.path.startsWith('/admin') }"
          ><AppIcon name="lock" class="size-5" />Administração</RouterLink
        >
      </div>
    </nav>
  </div>
</template>
