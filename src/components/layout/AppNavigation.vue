<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppIcon from '@/components/ui/AppIcon.vue'
import { can, canViewTeam, canViewTeams, type Tenant } from '@/features/tenants/types'
import { useAuthStore } from '@/features/auth/store'
defineProps<{ tenant?: Tenant }>()
const route = useRoute()
const auth = useAuthStore()
const teamOpen = ref(false)
const commercialOpen = ref(false)
const managementOpen = ref(false)
const settingsOpen = ref(false)
watch(() => route.path, (path) => {
  if (/\/(equipe|equipes|participantes-comerciais)$/.test(path)) teamOpen.value = true
  if (/\/(produtos|clientes)$/.test(path)) commercialOpen.value = true
  if (/\/(comissoes|comissoes-equipe|metas-comerciais|classificacoes)$/.test(path)) managementOpen.value = true
  if (/\/(dados|unidades|permissoes|assinatura|operadoras)$/.test(path)) settingsOpen.value = true
}, { immediate: true })
</script>
<template>
  <div class="space-y-7">
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
          <button type="button" class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-widest text-slate-500 hover:bg-stone-100" :aria-expanded="teamOpen" @click="teamOpen = !teamOpen">Equipe <span aria-hidden="true">{{ teamOpen ? '⌄' : '›' }}</span></button>
          <div v-show="teamOpen" class="space-y-1 border-l border-stone-200 pl-2">
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
            <RouterLink v-if="can(tenant, 'commissions.view')" :to="`/empresas/${tenant.id}/participantes-comerciais`" class="nav-item" :class="{ 'nav-active': route.path.endsWith('/participantes-comerciais') }">Parceiros e indicadores</RouterLink>
          </div>
        </div>
        <div v-if="can(tenant, 'products.view')" class="space-y-2">
          <button type="button" class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-widest text-slate-500 hover:bg-stone-100" :aria-expanded="commercialOpen" @click="commercialOpen = !commercialOpen">Comercial <span aria-hidden="true">{{ commercialOpen ? '⌄' : '›' }}</span></button>
          <div v-show="commercialOpen" class="space-y-1 border-l border-stone-200 pl-2">
            <RouterLink :to="`/empresas/${tenant.id}/clientes`" class="nav-item" :class="{ 'nav-active': route.path.endsWith('/clientes') }">Clientes</RouterLink>
            <RouterLink :to="`/empresas/${tenant.id}/produtos`" class="nav-item" :class="{ 'nav-active': route.path.endsWith('/produtos') }" :aria-current="route.path.endsWith('/produtos') ? 'page' : undefined">Produtos e planos</RouterLink>
          </div>
        </div>
        <div v-if="can(tenant, 'commissions.view')" class="space-y-2">
          <button type="button" class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-widest text-slate-500 hover:bg-stone-100" :aria-expanded="managementOpen" @click="managementOpen = !managementOpen">Gerencial <span aria-hidden="true">{{ managementOpen ? '⌄' : '›' }}</span></button>
          <div v-show="managementOpen" class="space-y-1 border-l border-stone-200 pl-2">
            <RouterLink :to="`/empresas/${tenant.id}/comissoes`" class="nav-item" :class="{ 'nav-active': route.path.endsWith('/comissoes') }" :aria-current="route.path.endsWith('/comissoes') ? 'page' : undefined">Tabelas de comissões</RouterLink>
            <RouterLink :to="`/empresas/${tenant.id}/classificacoes`" class="nav-item" :class="{ 'nav-active': route.path.endsWith('/classificacoes') }">Classificações das operadoras</RouterLink>
            <RouterLink :to="`/empresas/${tenant.id}/metas-comerciais`" class="nav-item" :class="{ 'nav-active': route.path.endsWith('/metas-comerciais') }">Metas comerciais</RouterLink>
            <RouterLink :to="`/empresas/${tenant.id}/comissoes-equipe`" class="nav-item" :class="{ 'nav-active': route.path.endsWith('/comissoes-equipe') }" :aria-current="route.path.endsWith('/comissoes-equipe') ? 'page' : undefined">Comissões da equipe</RouterLink>
          </div>
        </div>
        <div class="space-y-2">
          <button type="button" class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-widest text-slate-500 hover:bg-stone-100" :aria-expanded="settingsOpen" @click="settingsOpen = !settingsOpen">Configurações <span aria-hidden="true">{{ settingsOpen ? '⌄' : '›' }}</span></button>
          <div v-show="settingsOpen" class="space-y-1 border-l border-stone-200 pl-2">
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
            v-if="tenant.role === 'OWNER'"
            :to="`/empresas/${tenant.id}/operadoras`"
            class="nav-item"
            :class="{ 'nav-active': route.path.endsWith('/operadoras') }"
            >Minhas operadoras</RouterLink
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
          to="/admin/operadoras"
          class="nav-item"
          :class="{ 'nav-active': route.path === '/admin/operadoras' }"
          >Catálogo de operadoras</RouterLink
        >
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
