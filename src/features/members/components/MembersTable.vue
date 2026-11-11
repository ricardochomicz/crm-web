<script setup lang="ts">
import { computed } from 'vue'
import ListTable from '@/components/ui/ListTable.vue'
import TableActionButton from '@/components/ui/TableActionButton.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import { roleLabels } from '@/features/tenants/types'
import { dateLabel } from '@/lib/feedback'
import type { Member, TeamAction } from '../types'
const props = defineProps<{
  members: Member[]
  canWrite: boolean
  canViewProfiles: boolean
  canEditProfiles: boolean
  canChangeRole: boolean
  canChangeStatus: boolean
  canRemove: boolean
  busy?: boolean
  userId?: number
}>()
defineEmits<{ action: [action: TeamAction]; profile: [member: Member] }>()
const isManager = computed(() => props.members.some(member => member.user_id === props.userId && ['OWNER', 'MANAGER'].includes(member.role)))
const canOpenProfile = (member: Member) => props.canViewProfiles && (member.user_id === props.userId || (isManager.value && member.can_manage))
</script>
<template>
  <div class="overflow-hidden rounded-2xl border border-stone-200 bg-white">
    <ListTable min-width="740px">
      <caption class="sr-only">
        Membros da empresa
      </caption>
      <thead class="bg-stone-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
        <tr>
          <th scope="col" class="px-6 py-4 font-semibold">Pessoa</th>
          <th scope="col" class="px-5 py-4 font-semibold">Papel</th>
          <th scope="col" class="px-5 py-4 font-semibold">Situação</th>
          <th scope="col" class="px-5 py-4 font-semibold">Desde</th>
          <th scope="col" class="px-6 py-4 text-right font-medium">Ações</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-stone-100">
        <tr v-for="member in members" :key="member.id" class="hover:bg-stone-50/70">
          <th scope="row" class="px-6 py-5 font-normal">
            <div class="flex items-center gap-3">
              <span
                class="flex size-10 shrink-0 items-center justify-center rounded-full bg-orange-50 font-semibold text-orange-700"
                aria-hidden="true"
                >{{ member.name.slice(0, 1).toUpperCase() }}</span
              >
              <div>
                <p class="font-semibold text-slate-800">
                  {{ member.name
                  }}<span
                    v-if="member.user_id === userId"
                    class="ml-2 text-[10px] font-normal text-slate-400"
                    >você</span
                  >
                </p>
                <p class="mt-1 text-xs text-slate-500">{{ member.email }}</p>
              </div>
            </div>
          </th>
          <td class="px-5 py-5 text-xs text-slate-600">{{ (member.role_name || roleLabels[member.role]) }}</td>
          <td class="px-5 py-5">
            <StatusBadge :tone="member.status === 'ACTIVE' ? 'success' : 'warning'">{{
              member.status === 'ACTIVE' ? 'Ativo' : 'Suspenso'
            }}</StatusBadge>
          </td>
          <td class="px-5 py-5 text-xs text-slate-500">{{ dateLabel(member.joined_at) }}</td>
          <td class="px-6 py-5">
            <div
              v-if="canOpenProfile(member) || (member.can_manage && (canChangeRole || canChangeStatus || canRemove))"
              class="flex justify-end gap-2"
            >
              <TableActionButton v-if="canOpenProfile(member)" icon="edit" :label="`${canEditProfiles ? 'Editar' : 'Visualizar'} cadastro de ${member.name}`" :disabled="busy" @click="$emit('profile', member)" />
              <TableActionButton v-if="member.can_manage && canChangeRole" icon="shield" :label="`Alterar cargo de ${member.name}`" :disabled="!canWrite || busy" @click="$emit('action', { kind: 'role', member })" />
              <TableActionButton v-if="member.can_manage && canChangeStatus" :icon="member.status === 'ACTIVE' ? 'pause' : 'play'" :label="`${member.status === 'ACTIVE' ? 'Suspender' : 'Reativar'} ${member.name}`" :disabled="!canWrite || busy" @click="$emit('action', { kind: 'status', member })" />
              <TableActionButton v-if="member.can_manage && canRemove" icon="user-x" tone="danger" :label="`Desvincular ${member.name} da empresa`" :disabled="!canWrite || busy" @click="$emit('action', { kind: 'remove', member })" />
            </div>
            <p v-else class="text-right text-xs text-slate-400">
              {{ member.role === 'OWNER' ? 'Acesso protegido' : 'Sem ações disponíveis' }}
            </p>
          </td>
        </tr>
        <tr v-if="!members.length">
          <td colspan="5" class="px-6 py-12 text-center text-sm text-slate-500">
            Nenhum membro encontrado nesta página.
          </td>
        </tr>
      </tbody>
    </ListTable>
  </div>
</template>
