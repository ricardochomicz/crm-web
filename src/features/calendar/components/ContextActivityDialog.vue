<script setup lang="ts">
import CalendarEventDialog from './CalendarEventDialog.vue'
import type { EventType } from '../types'

defineProps<{
  open: boolean
  tenantId: string
  canWrite: boolean
  clientId: string
  initialTitle: string
  defaultAssigneeId?: string | null
  defaultType?: EventType
}>()
const emit = defineEmits<{ close: []; saved: [] }>()
</script>

<template>
  <CalendarEventDialog
    :open="open"
    :tenant-id="tenantId"
    :event="null"
    date=""
    :can-write="canWrite"
    :can-delete="false"
    :client-id="clientId"
    :initial-title="initialTitle"
    :default-assignee-id="defaultAssigneeId ?? undefined"
    :default-type="defaultType ?? 'task'"
    @close="emit('close')"
    @saved="emit('saved')"
  />
</template>
