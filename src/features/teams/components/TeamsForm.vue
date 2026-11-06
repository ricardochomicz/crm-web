<script setup lang="ts">
import { computed } from 'vue'
import FormField from '@/components/ui/FormField.vue'

export type SupervisorOption = { id: string; name: string | null; email: string | null; status: string }
export type TeamFormMode = 'create' | 'name' | 'supervisor'

const props = defineProps<{
  mode: TeamFormMode
  name: string
  supervisorMembershipId: string
  members: SupervisorOption[]
  membersLoading: boolean
  busy: boolean
  nameError?: string
  supervisorError?: string
}>()
const emit = defineEmits<{
  'update:name': [value: string]
  'update:supervisorMembershipId': [value: string]
}>()
const activeMembers = computed(() => props.members.filter(member => member.status === 'ACTIVE'))
const showName = computed(() => props.mode !== 'supervisor')
const showSupervisor = computed(() => props.mode !== 'name')
</script>

<template>
  <FormField
    v-if="showName"
    id="team-name"
    :model-value="name"
    label="Nome da equipe"
    :error="nameError"
    data-initial-focus
    @update:model-value="emit('update:name', $event)"
  />
  <div v-if="showSupervisor" class="space-y-2">
    <label for="team-supervisor" class="text-sm font-semibold text-slate-700">Supervisor</label>
    <select
      id="team-supervisor"
      :value="supervisorMembershipId"
      class="field"
      :class="{ 'field-error': supervisorError }"
      :disabled="busy || membersLoading"
      :data-initial-focus="mode === 'supervisor' ? '' : undefined"
      @change="emit('update:supervisorMembershipId', ($event.target as HTMLSelectElement).value)"
    >
      <option value="">{{ membersLoading ? 'Carregando membros…' : 'Selecione um membro ativo' }}</option>
      <option v-for="member in activeMembers" :key="member.id" :value="member.id">
        {{ member.name ?? member.email ?? member.id }}
      </option>
    </select>
    <p v-if="supervisorError" class="text-xs text-red-600">{{ supervisorError }}</p>
  </div>
</template>
