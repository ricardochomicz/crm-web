<script setup lang="ts">
import ListTable from '@/components/ui/ListTable.vue'
import TableActionButton from '@/components/ui/TableActionButton.vue'
import type { Team } from '../types'

defineProps<{
  teams: Team[]
  canUpdate: boolean
  canUpdateSupervisor: boolean
  busy?: boolean
}>()

defineEmits<{
  edit: [team: Team]
  editSupervisor: [team: Team]
  viewMembers: [team: Team]
}>()
</script>

<template>
  <div class="overflow-x-auto rounded-2xl border border-stone-200 bg-white">
    <ListTable min-width="640px">
      <caption class="sr-only">
        Equipes da empresa
      </caption>
      <thead class="border-b border-stone-100 bg-stone-50 text-xs text-slate-500">
        <tr>
          <th scope="col" class="px-6 py-4 font-medium">Equipe</th>
          <th scope="col" class="px-5 py-4 font-medium">Supervisor</th>
          <th scope="col" class="px-5 py-4 font-medium">Membros</th>
          <th scope="col" class="px-6 py-4 text-right font-medium">Ações</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-stone-100">
        <tr v-if="teams.length === 0">
          <td colspan="4" class="px-6 py-10 text-center text-sm text-slate-400">
            Nenhuma equipe cadastrada ainda.
          </td>
        </tr>
        <tr v-for="team in teams" :key="team.id" class="hover:bg-stone-50/50">
          <th scope="row" class="px-6 py-5 font-semibold text-slate-800">
            {{ team.name }}
          </th>
          <td class="px-5 py-5 text-xs text-slate-600">
            <span v-if="team.supervisor">{{ team.supervisor.name ?? '—' }}</span>
            <span v-else class="text-slate-400">Sem supervisor</span>
          </td>
          <td class="px-5 py-5 text-xs text-slate-500">
            {{ team.members_count }}
          </td>
          <td class="px-6 py-5">
            <div class="flex items-center justify-end gap-2">
              <TableActionButton icon="users" :label="`Gerenciar membros de ${team.name}`" :disabled="busy" @click="$emit('viewMembers', team)" />
              <TableActionButton v-if="canUpdateSupervisor" icon="shield" :label="`Alterar supervisor de ${team.name}`" :disabled="busy" @click="$emit('editSupervisor', team)" />
              <TableActionButton v-if="canUpdate" icon="edit" :label="`Renomear ${team.name}`" :disabled="busy" @click="$emit('edit', team)" />
            </div>
          </td>
        </tr>
      </tbody>
    </ListTable>
  </div>
</template>

