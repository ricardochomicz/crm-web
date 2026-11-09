<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AppDialog from '@/components/ui/AppDialog.vue'
import FormField from '@/components/ui/FormField.vue'
import { calendarApi } from '../api'
import { errorMessage } from '@/lib/feedback'
import type { CalendarEvent, CalendarEventInput, EventType } from '../types'

const props = defineProps<{ open: boolean; tenantId: string; event: CalendarEvent | null; date: string; canWrite: boolean; canDelete: boolean; opportunityId?: string; clientId?: string; opportunityTitle?: string }>()
const emit = defineEmits<{ close: []; saved: [] }>()
const busy = ref(false)
const error = ref('')
const form = ref<CalendarEventInput>(emptyForm(''))
const types: { value: EventType; label: string }[] = [
  { value: 'meeting', label: 'Reunião' }, { value: 'call', label: 'Ligação' },
  { value: 'visit', label: 'Visita' }, { value: 'task', label: 'Tarefa' },
  { value: 'reminder', label: 'Lembrete' },
]
function nextAvailable(date: string): string {
  const now = new Date()
  const start = new Date(now.getTime() + 60000)
  start.setSeconds(0, 0)
  const proposed = new Date(`${date}T09:00`)
  return localInput(proposed > start ? proposed.toISOString() : start.toISOString())
}
function emptyForm(date: string): CalendarEventInput {
  const start = nextAvailable(date)
  const end = localInput(new Date(new Date(start).getTime() + 3600000).toISOString())
  return { title: '', description: null, type: 'meeting', status: 'pending', priority: 'normal', all_day: false,
    starts_at: start, ends_at: end }
}
function localInput(value: string): string {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value.slice(0, 16)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
watch(() => [props.open, props.event, props.date] as const, () => {
  if (!props.open) return
  error.value = ''
  form.value = props.event
    ? { title: props.event.title, description: props.event.description, type: props.event.type,
        status: props.event.status, priority: props.event.priority, all_day: props.event.all_day,
        starts_at: localInput(props.event.starts_at), ends_at: localInput(props.event.ends_at),
        opportunity_id: props.event.opportunity_id, client_id: props.event.client_id }
    : { ...emptyForm(props.date), opportunity_id: props.opportunityId ?? null,
        client_id: props.clientId ?? null,
        title: props.opportunityTitle ? `Contato: ${props.opportunityTitle}` : '' }
}, { immediate: true })
const title = computed(() => props.event ? 'Editar compromisso' : 'Novo compromisso')
async function save() {
  if (busy.value || !props.canWrite) return
  const start = new Date(form.value.starts_at)
  const end = new Date(form.value.ends_at)
  if (Number.isNaN(start.getTime()) || (!props.event && start <= new Date())) {
    error.value = 'Escolha uma data e horário de início futuros.'
    return
  }
  if (Number.isNaN(end.getTime()) || end <= start) {
    error.value = 'O término deve ser posterior ao início.'
    return
  }
  busy.value = true
  error.value = ''
  try {
    if (props.event) {
      const changes: Partial<CalendarEventInput> = {
        title: form.value.title, description: form.value.description, type: form.value.type,
        status: form.value.status, priority: form.value.priority, all_day: form.value.all_day,
      }
      if (form.value.starts_at !== localInput(props.event.starts_at)) changes.starts_at = form.value.starts_at
      if (form.value.ends_at !== localInput(props.event.ends_at)) changes.ends_at = form.value.ends_at
      await calendarApi.update(props.tenantId, props.event.id, changes)
    } else await calendarApi.create(props.tenantId, form.value)
    emit('saved')
  } catch (e) { error.value = errorMessage(e) }
  finally { busy.value = false }
}
async function remove() {
  if (!props.event || !props.canDelete || busy.value || !window.confirm('Excluir este compromisso?')) return
  busy.value = true
  error.value = ''
  try { await calendarApi.remove(props.tenantId, props.event.id); emit('saved') }
  catch (e) { error.value = errorMessage(e) }
  finally { busy.value = false }
}
</script>
<template>
  <AppDialog :open="open" :title="title" description="Organize suas atividades e compromissos." :busy="busy" @close="emit('close')">
    <form class="space-y-4" @submit.prevent="save">
      <fieldset :disabled="busy || !canWrite" class="space-y-4">
        <div v-if="opportunityId || event?.opportunity_id || clientId || event?.client_id" class="space-y-1 rounded-lg bg-orange-50 p-3 text-sm text-orange-900">
          <p class="font-semibold">Compromisso vinculado</p>
          <p v-if="event?.client_name"><span class="font-medium">Cliente:</span> {{ event.client_name }}</p>
          <p v-if="opportunityTitle || event?.opportunity_title"><span class="font-medium">Oportunidade:</span> {{ opportunityTitle || event?.opportunity_title }}</p>
          <p v-if="!event?.client_name && !opportunityTitle && !event?.opportunity_title" class="text-orange-700">Vinculado ao cadastro do cliente ou à oportunidade.</p>
        </div>
        <FormField id="calendar-title" v-model="form.title" label="Título" maxlength="200" required placeholder="Ex.: Reunião com cliente" />
        <label class="block space-y-2 text-sm font-semibold text-slate-700">Tipo
          <select v-model="form.type" class="field"><option v-for="type in types" :key="type.value" :value="type.value">{{ type.label }}</option></select>
        </label>
        <div class="grid gap-4 sm:grid-cols-2">
          <FormField id="calendar-start" v-model="form.starts_at" label="Início" type="datetime-local" required />
          <FormField id="calendar-end" v-model="form.ends_at" label="Término" type="datetime-local" required />
        </div>
        <label class="flex items-center gap-2 text-sm text-slate-700"><input v-model="form.all_day" type="checkbox" /> Dia inteiro</label>
        <div class="grid gap-4 sm:grid-cols-2">
          <label class="block space-y-2 text-sm font-semibold text-slate-700">Situação
            <select v-model="form.status" class="field"><option value="pending">Pendente</option><option value="completed">Concluído</option><option value="cancelled">Cancelado</option></select>
          </label>
          <label class="block space-y-2 text-sm font-semibold text-slate-700">Prioridade
            <select v-model="form.priority" class="field"><option value="low">Baixa</option><option value="normal">Normal</option><option value="high">Alta</option></select>
          </label>
        </div>
        <label class="block space-y-2 text-sm font-semibold text-slate-700">Descrição
          <textarea v-model="form.description" rows="3" maxlength="10000" class="field" placeholder="Informações adicionais" />
        </label>
      </fieldset>
      <p v-if="error" role="alert" class="rounded-xl bg-red-50 p-3 text-sm text-red-700">{{ error }}</p>
      <div class="flex items-center justify-between gap-2 border-t border-stone-100 pt-4">
        <button v-if="event && canDelete" type="button" class="text-sm font-semibold text-red-700" :disabled="busy" @click="remove">Excluir</button>
        <span v-else />
        <div class="flex gap-2">
          <button type="button" class="secondary-button" :disabled="busy" @click="emit('close')">Fechar</button>
          <button v-if="canWrite" type="submit" class="primary-button w-auto" :disabled="busy">{{ busy ? 'Salvando…' : 'Salvar' }}</button>
        </div>
      </div>
    </form>
  </AppDialog>
</template>
