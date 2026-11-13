<script setup lang="ts">
import type { Client, Seller } from '../api'

defineProps<{
  client: Client
  sellers: Seller[]
}>()
</script>

<template>
  <section class="space-y-2">
    <p v-for="assignment in client.sellers ?? []" :key="assignment.id" class="border-b py-2 text-sm">
      {{
        sellers.find((seller) => seller.id === assignment.tenant_user_id)?.name ??
        assignment.membership?.user?.name ??
        assignment.tenant_user_id
      }}
      · {{ new Date(assignment.started_at).toLocaleDateString('pt-BR') }} até
      {{ assignment.ended_at ? new Date(assignment.ended_at).toLocaleDateString('pt-BR') : 'Atual' }}
      {{ assignment.reason ? '· ' + assignment.reason : '' }}
    </p>
    <p v-if="!client.sellers?.length" class="text-sm text-slate-500">
      Nenhuma atribuição registrada.
    </p>
  </section>
</template>
