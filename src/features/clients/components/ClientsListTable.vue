<script setup lang="ts">
import ListTable from '@/components/ui/ListTable.vue'
import TableActionButton from '@/components/ui/TableActionButton.vue'
import type { Client } from '../api'

defineProps<{
  rows: Client[]
  canCreateActivity: boolean
  writable: boolean
  sellerName: (client: Client) => string
}>()

const emit = defineEmits<{
  details: [clientId: string]
  history: [clientId: string]
  activity: [client: Client]
  edit: [client: Client]
}>()
</script>

<template>
  <section class="overflow-hidden rounded-2xl border border-stone-200 bg-white">
    <ListTable min-width="700px">
      <thead class="bg-stone-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
        <tr>
          <th scope="col" class="p-4">Cliente</th>
          <th scope="col" class="p-4">Documento</th>
          <th scope="col" class="p-4">Operadora</th>
          <th scope="col" class="p-4">Classificação</th>
          <th scope="col" class="p-4">Vendedor</th>
          <th scope="col" class="p-4">Ações</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-stone-100">
        <tr v-for="client in rows" :key="client.id" class="hover:bg-stone-50/70">
          <td class="p-4 font-semibold">{{ client.company_name }}</td>
          <td class="p-4">{{ client.document }}</td>
          <td class="p-4">{{ client.operator?.name ?? '—' }}</td>
          <td class="p-4">{{ client.classification?.code ?? '—' }}</td>
          <td class="p-4">{{ sellerName(client) }}</td>
          <td class="p-4">
            <div class="flex gap-2">
              <TableActionButton
                icon="eye"
                :label="`Ver detalhes de ${client.company_name}`"
                @click="emit('details', client.id)"
              />
              <TableActionButton
                icon="message-square"
                :label="`Histórico de ${client.company_name}`"
                @click="emit('history', client.id)"
              />
              <TableActionButton
                v-if="canCreateActivity"
                icon="calendar"
                :label="`Criar atividade para ${client.company_name}`"
                @click="emit('activity', client)"
              />
              <TableActionButton
                v-if="writable"
                icon="edit"
                :label="`Editar ${client.company_name}`"
                @click="emit('edit', client)"
              />
            </div>
          </td>
        </tr>
      </tbody>
    </ListTable>
    <p v-if="!rows.length" class="p-5 text-center text-sm text-slate-500">
      Nenhum cliente encontrado.
    </p>
  </section>
</template>
