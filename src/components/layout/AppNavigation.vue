<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppIcon from '@/components/ui/AppIcon.vue'
import { can, canViewTeam, canViewTeams, type Tenant } from '@/features/tenants/types'
import { useAuthStore } from '@/features/auth/store'
const props = defineProps<{ tenant?: Tenant }>()
const route = useRoute()
const auth = useAuthStore()
const teamOpen = ref(false)
const commercialOpen = ref(false)
const managementOpen = ref(false)
const settingsOpen = ref(false)
const hasPermission = (permission: string) => can(props.tenant, permission)
const canViewManagement = () => ['commissions.view', 'commercial-goals.view', 'team-commissions.view', 'operator-classifications.view', 'clients.view'].some(hasPermission)
const canViewClassifications = () => ['operator-classifications.view', 'commissions.view', 'clients.view'].some(hasPermission)
const canViewGoals = () => hasPermission('commercial-goals.view') || hasPermission('commissions.view')
const canViewTeamCommissions = () => hasPermission('team-commissions.view') || hasPermission('commissions.view')
watch(() => route.path, (path) => {
  if (/\/(equipe|equipes|participantes-comerciais)$/.test(path)) teamOpen.value = true
  if (/\/(produtos|clientes|oportunidades|pedidos)$/.test(path)) commercialOpen.value = true
  if (/\/(comissoes|comissoes-equipe|metas-comerciais|classificacoes)$/.test(path)) managementOpen.value = true
  if (/\/(dados|unidades|permissoes|assinatura|operadoras|status-pedidos)$/.test(path)) settingsOpen.value = true
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
        <RouterLink v-if="can(tenant, 'calendar.view')" :to="`/empresas/${tenant.id}/agenda`" class="nav-item" :class="{ 'nav-active': route.path.endsWith('/agenda') }" :aria-current="route.path.endsWith('/agenda') ? 'page' : undefined"><AppIcon name="calendar" class="size-5" />Agenda</RouterLink>
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
        <div v-if="can(tenant, 'products.view') || can(tenant, 'clients.view') || can(tenant, 'opportunities.view') || can(tenant, 'commissions.view')" class="space-y-2">
          <button type="button" class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-widest text-slate-500 hover:bg-stone-100" :aria-expanded="commercialOpen" @click="commercialOpen = !commercialOpen">Comercial <span aria-hidden="true">{{ commercialOpen ? '⌄' : '›' }}</span></button>
          <div v-show="commercialOpen" class="space-y-1 border-l border-stone-200 pl-2">
            <RouterLink v-if="can(tenant, 'opportunities.view')" :to="`/empresas/${tenant.id}/oportunidades`" class="nav-item" :class="{ 'nav-active': route.path.endsWith('/oportunidades') }">Oportunidades</RouterLink>
            <RouterLink v-if="can(tenant, 'commissions.view')" :to="`/empresas/${tenant.id}/pedidos`" class="nav-item" :class="{ 'nav-active': route.path.endsWith('/pedidos') }">Pedidos comerciais</RouterLink>
            <RouterLink v-if="can(tenant, 'clients.view')" :to="`/empresas/${tenant.id}/clientes`" class="nav-item" :class="{ 'nav-active': route.path.endsWith('/clientes') }">Clientes</RouterLink>
            <RouterLink v-if="can(tenant, 'products.view')" :to="`/empresas/${tenant.id}/produtos`" class="nav-item" :class="{ 'nav-active': route.path.endsWith('/produtos') }" :aria-current="route.path.endsWith('/produtos') ? 'page' : undefined">Produtos e planos</RouterLink>
          </div>
        </div>
        <div v-if="canViewManagement()" class="space-y-2">
          <button type="button" class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-widest text-slate-500 hover:bg-stone-100" :aria-expanded="managementOpen" @click="managementOpen = !managementOpen">Gerencial <span aria-hidden="true">{{ managementOpen ? '⌄' : '›' }}</span></button>
          <div v-show="managementOpen" class="space-y-1 border-l border-stone-200 pl-2">
            <RouterLink v-if="can(tenant, 'commissions.view')" :to="`/empresas/${tenant.id}/comissoes`" class="nav-item" :class="{ 'nav-active': route.path.endsWith('/comissoes') }" :aria-current="route.path.endsWith('/comissoes') ? 'page' : undefined">Tabelas de comissões</RouterLink>
            <RouterLink v-if="canViewClassifications()" :to="`/empresas/${tenant.id}/classificacoes`" class="nav-item" :class="{ 'nav-active': route.path.endsWith('/classificacoes') }">Classificações das operadoras</RouterLink>
            <RouterLink v-if="canViewGoals()" :to="`/empresas/${tenant.id}/metas-comerciais`" class="nav-item" :class="{ 'nav-active': route.path.endsWith('/metas-comerciais') }">Metas comerciais</RouterLink>
            <RouterLink v-if="canViewTeamCommissions()" :to="`/empresas/${tenant.id}/comissoes-equipe`" class="nav-item" :class="{ 'nav-active': route.path.endsWith('/comissoes-equipe') }" :aria-current="route.path.endsWith('/comissoes-equipe') ? 'page' : undefined">Comissões da equipe</RouterLink>
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
        <RouterLink to="/admin/status-pedidos" class="nav-item" :class="{ 'nav-active': route.path === '/admin/status-pedidos' }">Status dos pedidos</RouterLink>
        <RouterLink to="/admin/classificacoes" class="nav-item" :class="{ 'nav-active': route.path === '/admin/classificacoes' }">Classificações globais</RouterLink>
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
