<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import AppDialog from '@/components/ui/AppDialog.vue'
import FormField from '@/components/ui/FormField.vue'
import { ApiError } from '@/lib/http'
import { errorMessage } from '@/lib/feedback'
import { teamsApi } from '../api'
import type { Team } from '../types'

type SupervisorOption = { id: string; name: string | null; email: string | null; status: string }

const props = defineProps<{
  team: Team | null
  tenantId: string
  canWrite: boolean
  /**
   * Se `true`, exibe o campo de supervisor em vez do nome.
   * Reusa o mesmo dialog para dois fluxos distintos.
   */
  supervisorMode?: boolean
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
  () => props.team,
  (team) => {
    if (team) {
      name.value = team.name
      supervisorMembershipId.value = team.supervisor?.membership_id ?? ''
      error.value = ''
      nameError.value = ''
      supervisorError.value = ''
    }
  },
)

const activeMembers = () => props.members.filter((m) => m.status === 'ACTIVE')

async function submit() {
  if (busy.value || !props.team) return
  error.value = ''
  nameError.value = ''
  supervisorError.value = ''

  busy.value = true
  try {
    if (props.supervisorMode) {
      if (!supervisorMembershipId.value) {
        supervisorError.value = 'Selecione um supervisor.'
        busy.value = false
        return
      }
      await teamsApi.updateSupervisor(props.tenantId, props.team.id, supervisorMembershipId.value)
      emit('completed', { tone: 'success', message: 'Supervisor atualizado com sucesso.' })
    } else {
      const trimmedName = name.value.trim()
      if (!trimmedName) {
        nameError.value = 'Informe um nome para a equipe.'
        busy.value = false
        await nextTick()
        document.getElementById('edit-team-name')?.focus()
        return
      }
      await teamsApi.update(props.tenantId, props.team.id, trimmedName)
      emit('completed', { tone: 'success', message: 'Equipe renomeada com sucesso.' })
    }
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
    :open="!!team"
    :title="supervisorMode ? 'Alterar supervisor' : 'Renomear equipe'"
    :description="
      supervisorMode
        ? 'Selecione o novo responsável por esta equipe.'
        : 'Escolha um nome claro e representativo para a equipe.'
    "
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

      <FormField
        v-if="!supervisorMode"
        id="edit-team-name"
        v-model="name"
        label="Nome da equipe"
        :error="nameError"
        data-initial-focus
      />

      <div v-if="supervisorMode" class="space-y-2">
        <label for="edit-supervisor" class="text-sm font-semibold text-slate-700">Supervisor</label>
        <select
          id="edit-supervisor"
          v-model="supervisorMembershipId"
          class="field"
          :class="{ 'field-error': supervisorError }"
          :disabled="busy || membersLoading"
          data-initial-focus
        >
          <option value="">
            {{ membersLoading ? 'Carregando membros…' : 'Selecione um membro ativo' }}
          </option>
          <option v-for="member in activeMembers()" :key="member.id" :value="member.id">
            {{ member.name ?? member.email ?? member.id }}
          </option>
        </select>
        <p v-if="supervisorError" class="text-xs text-red-600">{{ supervisorError }}</p>
      </div>

      <div class="flex justify-end gap-3 pt-2">
        <button type="button" class="secondary-button" :disabled="busy" @click="$emit('close')">
          Cancelar
        </button>
        <button
          type="submit"
          class="primary-button"
          :disabled="busy || !canWrite"
          :title="!canWrite ? 'A assinatura não permite esta alteração no momento.' : undefined"
        >
          {{ busy ? 'Salvando…' : 'Salvar' }}
        </button>
      </div>
    </form>
  </AppDialog>
</template>
