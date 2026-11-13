<script setup lang="ts">
import FormField from '@/components/ui/FormField.vue'
import SearchSelect from '@/components/ui/SearchSelect.vue'
import type { EventType, EventStatus, EventPriority } from '../types'

defineProps<{
  title: string
  type: EventType
  status: EventStatus
  priority: EventPriority
  description: string | null
}>()

const emit = defineEmits<{
  'update:title': [value: string]
  'update:type': [value: EventType]
  'update:status': [value: EventStatus]
  'update:priority': [value: EventPriority]
  'update:description': [value: string]
}>()

const types: { value: EventType; label: string }[] = [
  { value: 'meeting', label: 'Reunião' },
  { value: 'call', label: 'Ligação' },
  { value: 'visit', label: 'Visita' },
  { value: 'task', label: 'Tarefa' },
  { value: 'reminder', label: 'Lembrete' },
]
const statuses: { value: EventStatus; label: string }[] = [
  { value: 'pending', label: 'Pendente' },
  { value: 'completed', label: 'Concluído' },
  { value: 'cancelled', label: 'Cancelado' },
]
const priorities: { value: EventPriority; label: string }[] = [
  { value: 'low', label: 'Baixa' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'Alta' },
]
</script>

<template>
  <section class="space-y-4" aria-label="Detalhes do compromisso">
    <FormField
      id="calendar-title"
      :model-value="title"
      label="Título"
      maxlength="200"
      required
      placeholder="Ex.: Reunião com cliente"
      @update:model-value="emit('update:title', String($event))"
    />
    <label class="block space-y-2 text-sm font-semibold text-slate-700">
      Tipo
      <SearchSelect
        :model-value="type"
        :options="types"
        placeholder="Selecione o tipo"
        required
        @update:model-value="emit('update:type', String($event) as EventType)"
      />
    </label>
    <div class="grid gap-4 sm:grid-cols-2">
      <label class="block space-y-2 text-sm font-semibold text-slate-700">
        Situação
        <SearchSelect
          :model-value="status"
          :options="statuses"
          placeholder="Selecione a situação"
          required
          @update:model-value="emit('update:status', String($event) as EventStatus)"
        />
      </label>
      <label class="block space-y-2 text-sm font-semibold text-slate-700">
        Prioridade
        <SearchSelect
          :model-value="priority"
          :options="priorities"
          placeholder="Selecione a prioridade"
          required
          @update:model-value="emit('update:priority', String($event) as EventPriority)"
        />
      </label>
    </div>
    <label class="block space-y-2 text-sm font-semibold text-slate-700">
      Descrição
      <textarea
        :value="description ?? ''"
        rows="3"
        maxlength="10000"
        class="field"
        placeholder="Informações adicionais"
        @input="emit('update:description', ($event.target as HTMLTextAreaElement).value)"
      />
    </label>
  </section>
</template>
