<script setup lang="ts">
import type { Client } from '../api'

defineProps<{ client: Client }>()

const address = (client: Client) =>
  [client.address, client.address_number, client.neighborhood, client.city, client.state]
    .filter(Boolean)
    .join(', ') || '—'
</script>

<template>
  <section class="space-y-2 text-sm">
    <p><strong>Operadora atual:</strong> {{ client.operator?.name ?? '—' }}</p>
    <p><strong>Contato:</strong> {{ client.phone ?? '—' }} · {{ client.email ?? '—' }}</p>
    <p><strong>Endereço:</strong> {{ address(client) }}</p>
    <p>
      <strong>Contrato:</strong> {{ client.contract_started_on ?? '—' }}
      até {{ client.contract_ends_on ?? '—' }}
    </p>
  </section>
</template>
