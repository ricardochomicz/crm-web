<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AppDialog from '@/components/ui/AppDialog.vue'
import SearchSelect from '@/components/ui/SearchSelect.vue'
import CalendarAssigneeField from './CalendarAssigneeField.vue'
import CalendarEventLinks from './CalendarEventLinks.vue'
import FormField from '@/components/ui/FormField.vue'
import FormActions from '@/components/ui/FormActions.vue'
import { calendarApi } from '../api'
import { clientsApi, type Client } from '@/features/clients/api'
import { opportunitiesApi, type Opportunity } from '@/features/opportunities/api'
import { errorMessage } from '@/lib/feedback'
import type { CalendarEvent, CalendarEventInput, EventType, EventStatus, EventPriority } from '../types'

const props = defineProps<{ open: boolean; tenantId: string; event: CalendarEvent | null; date: string; canWrite: boolean; canDelete: boolean; opportunityId?: string; clientId?: string; opportunityTitle?: string; defaultType?: EventType; defaultAssigneeId?: string; initialTitle?: string; protocolId?: string }>()
const emit = defineEmits<{ close: []; saved: [] }>()
const busy = ref(false)
const error = ref('')
const clients = ref<Client[]>([])
const clientsLoading = ref(false)
const assignees = ref<{ id: string; name: string }[]>([])
const assigneesLoading = ref(false)
const opportunities = ref<Opportunity[]>([])
const opportunitiesLoading = ref(false)
const opportunityOptions = computed(() => opportunities.value.map(item => ({ value: item.id, label: item.code + ' · ' + item.title })))
const clientOptions = computed(() => clients.value.map(client => ({ value: client.id, label: client.company_name })))
const lockedLink = computed(() => !!props.opportunityId || !!props.clientId)
watch(() => [props.open, props.tenantId] as const, async ([open, tenantId]) => {
  if (!open || !tenantId) return
  assigneesLoading.value = true
  try {
    assignees.value = (await calendarApi.assignees(tenantId)).data
  } catch (e) {
    error.value = 'Não foi possível carregar os responsáveis: ' + errorMessage(e)
  } finally { assigneesLoading.value = false }
}, { immediate: true })
watch(() => [props.open, props.tenantId] as const, async ([open, tenantId]) => {
  if (!open || !tenantId) return
  clientsLoading.value = true
  try { clients.value = (await clientsApi.list(tenantId)).data }
  catch (e) { error.value = 'Não foi possível carregar os clientes: ' + errorMessage(e) }
  finally { clientsLoading.value = false }
}, { immediate: true })
const form = ref<CalendarEventInput>(emptyForm(''))

let opportunitiesRequest = 0
watch(() => [props.open, props.tenantId, form.value.client_id] as const, async ([open, tenantId, clientId]) => {
  const version = ++opportunitiesRequest
  opportunities.value = []
  if (!open || !tenantId || !clientId) return
  opportunitiesLoading.value = true
  try {
    const results: Opportunity[] = []
    let page = 1
    let lastPage = 1
    do {
      const response = await opportunitiesApi.list(tenantId, { client_id: clientId, page })
      if (version !== opportunitiesRequest) return
      results.push(...response.data)
      lastPage = response.last_page
      page++
    } while (page <= lastPage && page <= 50)
    if (version === opportunitiesRequest) opportunities.value = results
    if (page <= lastPage && version === opportunitiesRequest) error.value = 'Limite de oportunidades exibidas. Utilize o cadastro da oportunidade para vincular diretamente.'
  } catch (e) { if (version === opportunitiesRequest) error.value = 'Não foi possível carregar as oportunidades: ' + errorMessage(e) }
  finally { if (version === opportunitiesRequest) opportunitiesLoading.value = false }
}, { immediate: true })
function changeClient(value: string | number) {
  form.value.client_id = String(value || '') || null
  form.value.opportunity_id = null
  if (!props.protocolId) form.value.protocol_id = null
}

const types: { value: EventType; label: string }[] = [
  { value: 'meeting', label: 'Reunião' }, { value: 'call', label: 'Ligação' },
  { value: 'visit', label: 'Visita' }, { value: 'task', label: 'Tarefa' },
  { value: 'reminder', label: 'Lembrete' },
]
const statuses = [{ value: 'pending', label: 'Pendente' }, { value: 'completed', label: 'Concluído' }, { value: 'cancelled', label: 'Cancelado' }]
const priorities = [{ value: 'low', label: 'Baixa' }, { value: 'normal', label: 'Normal' }, { value: 'high', label: 'Alta' }]
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
  return { title: '', description: null, type: '' as EventType, status: 'pending', priority: 'normal', all_day: false,
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
        opportunity_id: props.event.opportunity_id, client_id: props.event.client_id, protocol_id: props.event.protocol_id ?? null, tenant_user_id: props.event.tenant_user_id }
    : { ...emptyForm(props.date), type: props.defaultType ?? ('' as EventType), opportunity_id: props.opportunityId ?? null,
        client_id: props.clientId ?? null,
        tenant_user_id: props.defaultAssigneeId ?? null,
        protocol_id: props.protocolId ?? null,
        title: props.initialTitle ?? (props.opportunityTitle ? `Contato: ${props.opportunityTitle}` : '') }
}, { immediate: true })
const title = computed(() => props.event ? 'Editar compromisso' : 'Novo compromisso')
async function save() {
  if (busy.value || !props.canWrite) return
  if (!form.value.type || !form.value.status || !form.value.priority) {
    error.value = 'Selecione o tipo, a situação e a prioridade.'
    return
  }
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
        client_id: form.value.client_id || null,
        opportunity_id: form.value.opportunity_id || null,
        protocol_id: form.value.protocol_id || null,
        ...(form.value.tenant_user_id ? { tenant_user_id: form.value.tenant_user_id } : {}),
      }
      if (form.value.starts_at !== localInput(props.event.starts_at)) changes.starts_at = form.value.starts_at
      if (form.value.ends_at !== localInput(props.event.ends_at)) changes.ends_at = form.value.ends_at
      await calendarApi.update(props.tenantId, props.event.id, changes)
    } else {
      // When no assignee is selected, omit the field so the API assigns
      // the authenticated tenant member (the "Eu (padrão)" option).
      const { tenant_user_id, ...values } = form.value
      await calendarApi.create(props.tenantId, {
        ...values,
        ...(tenant_user_id ? { tenant_user_id } : {}),
        status: form.value.status || 'pending',
        priority: form.value.priority || 'normal',
      })
    }
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
        <FormField id="calendar-title" v-model="form.title" label="Título" maxlength="200" required placeholder="Ex.: Reunião com cliente" />
        <label class="block space-y-2 text-sm font-semibold text-slate-700">Tipo
          <SearchSelect v-model="form.type" :options="types" placeholder="Selecione o tipo" required />
        </label>
        <div class="grid gap-4 sm:grid-cols-2">
          <FormField id="calendar-start" v-model="form.starts_at" label="Início" type="datetime-local" required />
          <FormField id="calendar-end" v-model="form.ends_at" label="Término" type="datetime-local" required />
        </div>
        <label class="flex items-center gap-2 text-sm text-slate-700"><input v-model="form.all_day" type="checkbox" /> Dia inteiro</label>
        <div class="grid gap-4 sm:grid-cols-2">
          <label class="block space-y-2 text-sm font-semibold text-slate-700">Situação
            <SearchSelect v-model="form.status" :options="statuses" placeholder="Selecione a situação" required />
          </label>
          <label class="block space-y-2 text-sm font-semibold text-slate-700">Prioridade
            <SearchSelect v-model="form.priority" :options="priorities" placeholder="Selecione a prioridade" required />
          </label>
        </div>
        <label class="block space-y-2 text-sm font-semibold text-slate-700">Descrição
          <textarea v-model="form.description" rows="3" maxlength="10000" class="field" placeholder="Informações adicionais" />
        </label>
      </fieldset>
      <p v-if="error" role="alert" class="rounded-xl bg-red-50 p-3 text-sm text-red-700">{{ error }}</p>
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
