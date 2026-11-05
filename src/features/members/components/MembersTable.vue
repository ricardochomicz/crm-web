<script setup lang="ts">
import StatusBadge from '@/components/ui/StatusBadge.vue'
import { roleLabels } from '@/features/tenants/types'
import { dateLabel } from '@/lib/feedback'
import type { Member, TeamAction } from '../types'
defineProps<{
  members: Member[]
  canWrite: boolean
  canChangeRole: boolean
  canChangeStatus: boolean
  canRemove: boolean
  busy?: boolean
  userId?: number
}>()
defineEmits<{ action: [action: TeamAction] }>()
</script>
<template>
  <div class="overflow-x-auto rounded-2xl border border-stone-200 bg-white">
    <table class="w-full min-w-[740px] text-left text-sm">
      <caption class="sr-only">
        Membros da empresa
      </caption>
      <thead class="border-b border-stone-100 bg-stone-50 text-xs text-slate-500">
        <tr>
          <th scope="col" class="px-6 py-4 font-medium">Pessoa</th>
          <th scope="col" class="px-5 py-4 font-medium">Papel</th>
          <th scope="col" class="px-5 py-4 font-medium">Situação</th>
          <th scope="col" class="px-5 py-4 font-medium">Desde</th>
          <th scope="col" class="px-6 py-4 text-right font-medium">Ações</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-stone-100">
        <tr v-for="member in members" :key="member.id" class="hover:bg-stone-50/50">
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
          <td class="px-5 py-5 text-xs text-slate-600">{{ roleLabels[member.role] }}</td>
          <td class="px-5 py-5">
            <StatusBadge :tone="member.status === 'ACTIVE' ? 'success' : 'warning'">{{
              member.status === 'ACTIVE' ? 'Ativo' : 'Suspenso'
            }}</StatusBadge>
          </td>
          <td class="px-5 py-5 text-xs text-slate-500">{{ dateLabel(member.joined_at) }}</td>
          <td class="px-6 py-5">
            <div
              v-if="member.can_manage && (canChangeRole || canChangeStatus || canRemove)"
              class="flex justify-end gap-2"
            >
              <button
                class="secondary-button px-3 py-2"
                :disabled="!canWrite || busy"
                v-if="canChangeRole"
                :aria-label="`Alterar papel de ${member.name}`"
                @click="$emit('action', { kind: 'role', member })"
              >
                Alterar papel</button
              ><button
                class="secondary-button px-3 py-2"
                :disabled="!canWrite || busy"
                v-if="canChangeStatus"
                :aria-label="`${member.status === 'ACTIVE' ? 'Suspender' : 'Reativar'} ${member.name}`"
                @click="$emit('action', { kind: 'status', member })"
              >
                {{ member.status === 'ACTIVE' ? 'Suspender' : 'Reativar' }}
              </button>
              <button
                v-if="canRemove"
                class="secondary-button px-3 py-2 text-red-700 hover:text-red-800"
                :disabled="!canWrite || busy"
                :aria-label="`Desvincular ${member.name} da empresa`"
                @click="$emit('action', { kind: 'remove', member })"
              >Desvincular</button>
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
    </table>
  </div>
</template>
