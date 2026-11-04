<script setup lang="ts">
import { useRoute } from 'vue-router'
import type { Tenant } from '../types'
defineProps<{ tenant: Tenant }>()
const route = useRoute()
</script>
<template>
  <nav aria-label="Navegação da empresa" class="mb-7 flex gap-5 border-b border-stone-200 text-sm">
    <RouterLink
      :to="`/empresas/${tenant.id}`"
      class="border-b-2 px-1 pb-3 font-medium"
      :class="
        route.path === `/empresas/${tenant.id}`
          ? 'border-orange-600 text-orange-700'
          : 'border-transparent text-slate-500 hover:text-slate-800'
      "
      >Visão geral</RouterLink
    ><RouterLink
      v-if="tenant.role === 'OWNER'"
      :to="`/empresas/${tenant.id}/equipe`"
      class="border-b-2 px-1 pb-3 font-medium"
      :class="
        route.path.endsWith('/equipe')
          ? 'border-orange-600 text-orange-700'
          : 'border-transparent text-slate-500 hover:text-slate-800'
      "
      >Membros e convites</RouterLink
    >
  </nav>
</template>
