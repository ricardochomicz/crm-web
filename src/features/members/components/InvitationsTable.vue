<script setup lang="ts">
import ListTable from '@/components/ui/ListTable.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import { roleLabels } from '@/features/tenants/types'
import type { Invitation, TeamAction } from '../types'
defineProps<{
  invitations: Invitation[]
  canResend: boolean
  canRevoke: boolean
  busy?: boolean
  resendBlockedReason: (invitation: Invitation) => string
}>()
defineEmits<{ action: [action: TeamAction] }>()
function status(invitation: Invitation): {
  label: string
  tone: 'success' | 'warning' | 'neutral'
} {
  if (invitation.status === 'ACCEPTED') return { label: 'Aceito', tone: 'success' }
  if (invitation.status === 'REVOKED') return { label: 'Revogado', tone: 'neutral' }
  return invitation.is_expired
    ? { label: 'Expirado', tone: 'neutral' }
    : { label: 'Pendente', tone: 'warning' }
}
function expiration(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(
    new Date(value),
  )
}
</script>
<template>
  <div class="overflow-hidden rounded-2xl border border-stone-200 bg-white">
    <ListTable min-width="780px">
      <caption class="sr-only">
        Convites da empresa. As datas usam o horário local do seu navegador.
      </caption>
      <thead class="bg-stone-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
        <tr>
          <th scope="col" class="px-6 py-4 font-semibold">Destinatário</th>
          <th scope="col" class="px-5 py-4 font-semibold">Papel</th>
          <th scope="col" class="px-5 py-4 font-semibold">Situação</th>
          <th scope="col" class="px-5 py-4 font-semibold">Validade</th>
          <th scope="col" class="px-6 py-4 text-right font-medium">Ações</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-stone-100">
        <tr v-for="invitation in invitations" :key="invitation.id" class="hover:bg-stone-50/70">
          <th scope="row" class="px-6 py-5 font-medium">
            <p>{{ invitation.email }}</p>
            <p class="mt-1 text-[11px] font-normal text-slate-400">
              {{ invitation.reserves_seat ? 'Uma vaga reservada' : 'Não reserva vaga' }}
            </p>
          </th>
          <td class="px-5 py-5 text-xs text-slate-600">{{ (invitation.role_name || roleLabels[invitation.role]) }}</td>
          <td class="px-5 py-5">
            <StatusBadge :tone="status(invitation).tone">{{
              status(invitation).label
            }}</StatusBadge>
          </td>
          <td class="px-5 py-5 text-xs text-slate-500">{{ expiration(invitation.expires_at) }}</td>
          <td class="px-6 py-5">
            <div v-if="invitation.status === 'PENDING'" class="flex justify-end gap-2">
              <button
                class="secondary-button px-3 py-2"
                :disabled="busy || !!resendBlockedReason(invitation)"
                :title="resendBlockedReason(invitation)"
                v-if="canResend"
                :aria-label="`Reenviar convite para ${invitation.email}`"
                @click="$emit('action', { kind: 'resend', invitation })"
              >
                Reenviar</button
              ><button
                class="secondary-button px-3 py-2"
                :disabled="busy"
                v-if="canRevoke"
                :aria-label="`Revogar convite de ${invitation.email}`"
                @click="$emit('action', { kind: 'revoke', invitation })"
              >
                Revogar
              </button>
            </div>
            <span v-else class="block text-right text-xs text-slate-400">{{
              invitation.status === 'ACCEPTED' ? 'Acesso criado' : 'Convite encerrado'
            }}</span>
          </td>
        </tr>
        <tr v-if="!invitations.length">
          <td colspan="5" class="px-6 py-12 text-center">
            <p class="font-medium text-slate-700">Nenhum convite por aqui.</p>
            <p class="mt-2 text-xs text-slate-500">
              Envie um convite ou escolha outra situação no filtro.
            </p>
          </td>
        </tr>
      </tbody>
    </ListTable>
  </div>
</template>
