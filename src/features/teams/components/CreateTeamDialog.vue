<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import AppDialog from '@/components/ui/AppDialog.vue'
import TeamsForm from './TeamsForm.vue'
import { ApiError } from '@/lib/http'
import { errorMessage } from '@/lib/feedback'
import { teamsApi } from '../api'

type SupervisorOption = { id: string; name: string | null; email: string | null; status: string; role_name?: string | null }

const props = defineProps<{
  open: boolean
  tenantId: string
  canWrite: boolean
  supervisorAssignments?: Record<string, string>
  members: SupervisorOption[]
  membersLoading: boolean
}>()

const emit = defineEmits<{
  close: []
  completed: [notice: { message: string; tone: 'success' | 'warning' }]
}>()

const name = ref('')
const supervisorMembershipId = ref('')
const busy = ref(false)
const error = ref('')
const nameError = ref('')
const supervisorError = ref('')
const errorElement = ref<HTMLElement>()

watch(
  () => props.open,
  (open) => {
    if (open) {
      name.value = ''
      supervisorMembershipId.value = ''
      error.value = ''
      nameError.value = ''
      supervisorError.value = ''
    }
  },
)

async function submit() {
  if (busy.value) return
  error.value = ''
  nameError.value = ''
  supervisorError.value = ''

  const trimmedName = name.value.trim()
  if (!trimmedName) {
    nameError.value = 'Informe um nome para a equipe.'
    await nextTick()
    document.getElementById('team-name')?.focus()
    return
  }
  busy.value = true
  try {
    await teamsApi.create(props.tenantId, trimmedName, supervisorMembershipId.value)
    emit('completed', { tone: 'success', message: 'Equipe criada com sucesso.' })
  } catch (failure) {
    error.value = errorMessage(failure)
    if (failure instanceof ApiError) {
      nameError.value = failure.errors.name?.[0] ?? ''
      supervisorError.value = failure.errors.supervisor_membership_id?.[0] ?? ''
    }
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
    title="Nova equipe"
    description="Crie uma equipe e defina o responsável."
    :busy="busy"
    @close="$emit('close')"
  >
    <form class="space-y-5" @submit.prevent="submit">
      <div
        v-if="error"
        ref="errorElement"
        role="alert"
        tabindex="-1"
        class="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
      >
        {{ error }}
      </div>

      <TeamsForm
        v-model:name="name"
        v-model:supervisor-membership-id="supervisorMembershipId"
        mode="create"
        :members="members"
        :supervisor-assignments="supervisorAssignments"
        :members-loading="membersLoading"
        :busy="busy"
        :name-error="nameError"
        :supervisor-error="supervisorError"
      />

      <div class="flex justify-end gap-3 pt-2">
        <button
          type="button"
          class="secondary-button"
          :disabled="busy"
          @click="$emit('close')"
        >
          Cancelar
        </button>
        <button
          type="submit"
          class="primary-button"
          :disabled="busy || !canWrite"
          :title="!canWrite ? 'A assinatura não permite criar equipes no momento.' : undefined"
        >
          {{ busy ? 'Criando…' : 'Criar equipe' }}
        </button>
      </div>
    </form>
  </AppDialog>
</template>
