<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import AppDialog from '@/components/ui/AppDialog.vue'
import SearchSelect from '@/components/ui/SearchSelect.vue'
import type { CompanyRole } from '../api'
import { teamApi } from '../api'
import { errorMessage } from '@/lib/feedback'
import type { AssignableRole, TeamAction, TeamNotice } from '../types'
const props = defineProps<{
  tenantId: string
  action: TeamAction | null
  allowedRoles: AssignableRole[]
  companyRoles: CompanyRole[]
  allowed: boolean
  canWrite: boolean
  resendBlocked: string
}>()
const emit = defineEmits<{ close: []; completed: [notice: TeamNotice] }>()
const busy = ref(false)
const error = ref('')
const role = ref<AssignableRole>('CONSULTANT')
const selectedRoleId = ref('')
const selectableRoles = computed(() =>
  props.companyRoles.filter((item) => item.is_active && item.can_assign),
)
watch(selectedRoleId, (id) => {
  const found = selectableRoles.value.find((item) => item.id === id)
  if (found) role.value = found.legacy_role as AssignableRole
})
const errorElement = ref<HTMLElement>()
watch(
  () => props.action,
  (action) => {
    error.value = ''
    if (action?.kind === 'role' && action.member.role !== 'OWNER') {
      role.value = action.member.role
      selectedRoleId.value =
        action.member.tenant_role_id ??
        selectableRoles.value.find((item) => item.legacy_role === action.member.role)?.id ??
        ''
    }
  },
)
const title = computed(() => {
  switch (props.action?.kind) {
    case 'role':
      return 'Alterar cargo do usuário'
    case 'status':
      return props.action.member.status === 'ACTIVE' ? 'Suspender acesso?' : 'Reativar acesso?'
    case 'remove':
      return 'Desvincular da empresa?'
    case 'resend':
      return 'Reenviar convite?'
    case 'revoke':
      return 'Revogar convite?'
    default:
      return ''
  }
})
const subject = computed(
  () =>
    props.action &&
    ('member' in props.action ? props.action.member.email : props.action.invitation.email),
)
const description = computed(() => {
  switch (props.action?.kind) {
    case 'role':
      return 'Escolha o cargo que definirá as permissões desta pessoa na empresa.'
    case 'status':
      return props.action.member.status === 'ACTIVE'
        ? 'A pessoa perderá o acesso a esta empresa. O vínculo será preservado e continuará ocupando uma vaga. Você poderá reativá-lo depois.'
        : 'A pessoa voltará a acessar esta empresa com o papel atual.'
    case 'remove':
      return 'A pessoa perderá o acesso a esta empresa e a vaga será liberada para outro convite. Esta ação não pode ser desfeita; para retornar, a pessoa precisará de um novo convite. Antes, remova-a das equipes e substitua eventuais supervisões.'
    case 'resend':
      return 'Um novo link será enviado, válido por 7 dias. O link anterior deixará de funcionar. Se o convite expirou, será necessário reservar uma vaga novamente.'
    case 'revoke':
      return 'O link deixará de funcionar e a vaga reservada, se houver, será liberada. Este convite não poderá ser reenviado; será necessário criar outro.'
    default:
      return ''
  }
})
const blocked = computed(() => {
  if (!props.allowed) return 'Seu cargo não permite esta ação.'
  if (!props.action || props.action.kind === 'revoke') return ''
  if (!props.canWrite) return 'A assinatura não permite esta alteração no momento.'
  if (props.action.kind === 'resend') return props.resendBlocked
  if (!props.action.member.can_manage) return 'Você não pode alterar o acesso deste membro.'
  if (
    props.action.kind === 'role' &&
    (!selectedRoleId.value ||
      !selectableRoles.value.some((item) => item.id === selectedRoleId.value))
  )
    return 'Selecione um cargo disponível.'
  if (
    props.action.kind === 'role' &&
    props.action.member.role === role.value &&
    props.action.member.tenant_role_id === selectedRoleId.value
  )
    return 'Este já é o cargo atual do usuário.'
  return ''
})
const destructive = computed(
  () =>
    props.action?.kind === 'revoke' ||
    props.action?.kind === 'remove' ||
    (props.action?.kind === 'status' && props.action.member.status === 'ACTIVE'),
)
async function submit() {
  if (!props.action || busy.value || blocked.value) return
  const action = props.action
  busy.value = true
  error.value = ''
  try {
    let notice: TeamNotice = { tone: 'success', message: '' }
    if (action.kind === 'role') {
      await teamApi.role(
        props.tenantId,
        action.member.id,
        role.value,
        selectedRoleId.value || undefined,
      )
      notice.message = 'Cargo atualizado nesta empresa.'
    } else if (action.kind === 'status') {
      const status = action.member.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'
      await teamApi.status(props.tenantId, action.member.id, status)
      notice.message =
        status === 'SUSPENDED'
          ? 'Acesso suspenso. O vínculo continua ocupando uma vaga.'
          : 'Acesso reativado.'
    } else if (action.kind === 'remove') {
      await teamApi.remove(props.tenantId, action.member.id)
      notice.message = 'Membro desvinculado. A vaga está disponível para outro convite.'
    } else if (action.kind === 'revoke') {
      await teamApi.revoke(props.tenantId, action.invitation.id)
      notice.message = 'Convite revogado. O link não pode mais ser utilizado.'
    } else {
      const result = await teamApi.resend(props.tenantId, action.invitation.id)
      notice = result.meta.notification_dispatched
        ? {
            tone: 'success',
            message: 'Convite renovado e encaminhado para envio. O link anterior foi invalidado.',
          }
        : {
            tone: 'warning',
            message:
              'O convite foi renovado e o link anterior foi invalidado, mas o e-mail não pôde ser encaminhado. Tente reenviar novamente.',
          }
    }
    emit('completed', notice)
  } catch (failure) {
    error.value = errorMessage(failure)
    await nextTick()
    errorElement.value?.focus()
  } finally {
    busy.value = false
  }
}
</script>
<template>
  <AppDialog
    :open="!!action"
    :title="title"
    :description="description"
    :busy="busy"
    @close="emit('close')"
    ><form :aria-busy="busy" @submit.prevent="submit">
      <div
        class="mb-5 break-all rounded-xl border border-stone-200 bg-stone-50 p-4 text-sm font-medium"
      >
        {{ subject }}
      </div>
      <p
        v-if="error"
        ref="errorElement"
        tabindex="-1"
        role="alert"
        class="mb-5 rounded-xl bg-red-50 p-4 text-sm text-red-800"
      >
        {{ error }}
      </p>
      <fieldset :disabled="busy" class="space-y-5">
        <div v-if="action?.kind === 'role'">
          <label class="mb-2 block text-sm font-semibold text-slate-700">Cargo na empresa</label
          ><SearchSelect
            :model-value="selectedRoleId"
            @update:model-value="selectedRoleId = String($event)"
            :options="selectableRoles.map((item) => ({ value: item.id, label: item.name }))"
            placeholder="Selecione o cargo"
          />
        </div>
        <p v-if="blocked" role="status" class="text-xs leading-6 text-amber-800">{{ blocked }}</p>
        <div class="flex justify-end gap-3 border-t border-stone-100 pt-5">
          <button type="button" class="secondary-button" data-initial-focus @click="emit('close')">
            Cancelar</button
          ><button
            type="submit"
            class="primary-button w-auto"
            :class="destructive ? 'bg-red-600 hover:bg-red-700' : ''"
            :disabled="busy || !!blocked"
          >
            <span v-if="busy" class="spinner" />{{
              busy
                ? 'Salvando…'
                : action?.kind === 'role'
                  ? 'Salvar cargo'
                  : action?.kind === 'status'
                    ? action.member.status === 'ACTIVE'
                      ? 'Suspender acesso'
                      : 'Reativar acesso'
                    : action?.kind === 'resend'
                      ? 'Reenviar convite'
                      : action?.kind === 'remove'
                        ? 'Desvincular e liberar vaga'
                        : 'Revogar convite'
            }}
          </button>
        </div>
      </fieldset>
    </form></AppDialog
  >
</template>
