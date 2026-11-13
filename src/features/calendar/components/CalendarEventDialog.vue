<script setup lang="ts">
import { computed, watch, toRef } from 'vue'
import AppDialog from '@/components/ui/AppDialog.vue'
import CalendarAssigneeField from './CalendarAssigneeField.vue'
import CalendarEventLinks from './CalendarEventLinks.vue'
import CalendarEventScheduleFields from './CalendarEventScheduleFields.vue'
import CalendarEventDetailsFields from './CalendarEventDetailsFields.vue'
import FormActions from '@/components/ui/FormActions.vue'
import { useCalendarEventMutation } from '../composables/useCalendarEventMutation'
import { useCalendarEventOptions } from '../composables/useCalendarEventOptions'
import { useCalendarEventForm } from '../composables/useCalendarEventForm'
import type { CalendarEvent, EventType } from '../types'

const props = defineProps<{ open: boolean; tenantId: string; event: CalendarEvent | null; date: string; canWrite: boolean; canDelete: boolean; opportunityId?: string; clientId?: string; opportunityTitle?: string; defaultType?: EventType; defaultAssigneeId?: string; initialTitle?: string; protocolId?: string }>()
const emit = defineEmits<{ close: []; saved: [] }>()
const { form, title, lockedLink, changeClient } = useCalendarEventForm({
  open: toRef(props, 'open'),
  tenantId: toRef(props, 'tenantId'),
  event: toRef(props, 'event'),
  date: toRef(props, 'date'),
  opportunityId: toRef(props, 'opportunityId'),
  clientId: toRef(props, 'clientId'),
  opportunityTitle: toRef(props, 'opportunityTitle'),
  defaultType: toRef(props, 'defaultType'),
  defaultAssigneeId: toRef(props, 'defaultAssigneeId'),
  initialTitle: toRef(props, 'initialTitle'),
  protocolId: toRef(props, 'protocolId'),
})
const { busy, error, save, remove } = useCalendarEventMutation({
  tenantId: toRef(props, 'tenantId'),
  event: toRef(props, 'event'),
  canWrite: toRef(props, 'canWrite'),
  canDelete: toRef(props, 'canDelete'),
  form,
  onSaved: () => emit('saved'),
})


const {
  assignees,
  clientsLoading,
  assigneesLoading,
  opportunitiesLoading,
  clientOptions,
  opportunityOptions,
  optionsError,
  clearOptionsError,
} = useCalendarEventOptions({
  open: toRef(props, 'open'),
  tenantId: toRef(props, 'tenantId'),
  clientId: computed(() => form.value.client_id),
})

watch(
  () => [props.open, props.tenantId, props.event, props.date] as const,
  () => {
    if (!props.open) return
    error.value = ''
    clearOptionsError()
  },
)
</script>
<template>
  <AppDialog :open="open" :title="title" description="Organize suas atividades e compromissos." :busy="busy" @close="emit('close')">
    <form class="space-y-4" @submit.prevent="save">
      <fieldset :disabled="busy || !canWrite" class="space-y-4">
        <CalendarEventLinks
          :client-id="form.client_id"
          :opportunity-id="form.opportunity_id"
          :clients="clientOptions"
          :opportunities="opportunityOptions"
          :clients-loading="clientsLoading"
          :opportunities-loading="opportunitiesLoading"
          :locked="lockedLink"
          :show-linked-notice="!!(opportunityId || event?.opportunity_id || clientId || event?.client_id)"
          :linked-client-name="event?.client_name"
          :linked-opportunity-title="opportunityTitle || event?.opportunity_title"
          @update:client-id="changeClient"
          @update:opportunity-id="value => form.opportunity_id = value"
        />
        <CalendarAssigneeField
          v-model="form.tenant_user_id"
          :assignees="assignees"
          :loading="assigneesLoading"
          :disabled="!!event && !assignees.some((member) => member.id === event?.tenant_user_id)"
        />
        <CalendarEventDetailsFields
          v-model:title="form.title"
          v-model:type="form.type"
          v-model:status="form.status"
          v-model:priority="form.priority"
          v-model:description="form.description"
        >
          <template #schedule>
            <CalendarEventScheduleFields
              v-model:starts-at="form.starts_at"
              v-model:ends-at="form.ends_at"
              v-model:all-day="form.all_day"
            />
          </template>
        </CalendarEventDetailsFields>
      </fieldset>
      <p v-if="error || optionsError" role="alert" class="rounded-xl bg-red-50 p-3 text-sm text-red-700">{{ error || optionsError }}</p>
      <div class="border-t border-stone-100 pt-4">
        <FormActions :busy="busy" :show-submit="canWrite" cancel-label="Fechar" @cancel="emit('close')">
          <template v-if="event && canDelete" #before>
            <button type="button" class="mr-auto text-sm font-semibold text-red-700" :disabled="busy" @click="remove">Excluir</button>
          </template>
        </FormActions>
      </div>
    </form>
  </AppDialog>
</template>
