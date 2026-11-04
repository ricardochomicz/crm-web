<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import AppDialog from '@/components/ui/AppDialog.vue'
import FormField from '@/components/ui/FormField.vue'
import RoleSelect from './RoleSelect.vue'
import { ApiError } from '@/lib/http'
import { errorMessage } from '@/lib/feedback'
import { teamApi } from '../api'
import type { AssignableRole, TeamNotice } from '../types'
const props = defineProps<{ open: boolean; tenantId: string; blockedReason: string }>()
const emit = defineEmits<{ close: []; completed: [notice: TeamNotice] }>()
const email = ref('')
const role = ref<AssignableRole>('CONSULTANT')
const busy = ref(false)
const error = ref('')
const emailError = ref('')
const errorElement = ref<HTMLElement>()
watch(
  () => props.open,
  (open) => {
    if (open) {
      email.value = ''
      role.value = 'CONSULTANT'
      error.value = ''
      emailError.value = ''
    }
  },
)
async function submit() {
  if (busy.value) return
  error.value = ''
  emailError.value = ''
  if (props.blockedReason) {
    error.value = props.blockedReason
    return
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
    emailError.value = 'Informe um e-mail válido para enviar o convite.'
    await nextTick()
    document.getElementById('invite-email')?.focus()
    return
  }
  busy.value = true
  try {
    const result = await teamApi.invite(
      props.tenantId,
      email.value.trim().toLowerCase(),
      role.value,
    )
    emit(
      'completed',
      result.meta.notification_dispatched
        ? {
            tone: 'success',
            message:
              'Convite criado e encaminhado para envio. Uma vaga foi reservada até o vencimento.',
          }
        : {
            tone: 'warning',
            message:
              'O convite foi criado e a vaga foi reservada, mas o e-mail não pôde ser encaminhado. Use “Reenviar” para tentar novamente.',
          },
    )
  } catch (failure) {
    error.value = errorMessage(failure)
    if (failure instanceof ApiError) emailError.value = failure.errors.email?.[0] ?? ''
    await nextTick()
    errorElement.value?.focus()
  } finally {
    busy.value = false
  }
}
</script>
<template>
  <AppDialog
    :open="open"
    title="Uma nova pessoa na equipe."
    description="Envie um convite para que a pessoa entre com a própria conta. O acesso começa somente após o aceite."
    :busy="busy"
    @close="emit('close')"
    ><form novalidate :aria-busy="busy" @submit.prevent="submit">
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
        <FormField
          id="invite-email"
          v-model="email"
          label="E-mail da pessoa"
          type="email"
          inputmode="email"
          autocomplete="off"
          placeholder="pessoa@empresa.com.br"
          maxlength="254"
          data-initial-focus
          :error="emailError"
        /><RoleSelect id="invite-role" v-model="role" />
        <div class="rounded-xl bg-orange-50 p-4 text-xs leading-6 text-orange-900">
          O convite vale por 7 dias e reserva uma vaga do plano. A pessoa precisa aceitar com o
          mesmo e-mail informado.
        </div>
        <p v-if="blockedReason" role="status" class="text-xs text-amber-800">{{ blockedReason }}</p>
        <div class="flex justify-end gap-3 border-t border-stone-100 pt-5">
          <button type="button" class="secondary-button" @click="emit('close')">Cancelar</button
          ><button type="submit" class="primary-button w-auto" :disabled="busy || !!blockedReason">
            <span v-if="busy" class="spinner" />{{ busy ? 'Criando convite…' : 'Enviar convite' }}
          </button>
        </div>
      </fieldset>
    </form></AppDialog
  >
</template>
