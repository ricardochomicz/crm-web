<script setup lang="ts">
import { ref, watch } from 'vue'
import AppDialog from '@/components/ui/AppDialog.vue'
import FormField from '@/components/ui/FormField.vue'
import { opportunitiesApi, type Opportunity, type OpportunityInput } from '../api'
import { errorMessage } from '@/lib/feedback'
import type { Client } from '@/features/clients/api'

const props = defineProps<{ open: boolean; tenantId: string; opportunity: Opportunity | null; clients: Client[] }>()
const emit = defineEmits<{ close: []; saved: [] }>()
const busy = ref(false)
const error = ref('')
const blank = (): OpportunityInput => ({
  code: '', title: '', client_id: '', order_type: 'NOVO',
  description: null, expected_close_at: null,
  estimated_monthly_amount: 0, estimated_one_time_amount: 0,
})
const form = ref<OpportunityInput>(blank())
watch(() => [props.open, props.opportunity] as const, () => {
  if (!props.open) return
  error.value = ''
  form.value = props.opportunity ? {
    code: props.opportunity.code, title: props.opportunity.title,
    client_id: props.opportunity.client_id, order_type: props.opportunity.order_type,
    description: props.opportunity.description,
    expected_close_at: props.opportunity.expected_close_at?.slice(0, 10) ?? null,
    estimated_monthly_amount: Number(props.opportunity.estimated_monthly_amount),
    estimated_one_time_amount: Number(props.opportunity.estimated_one_time_amount),
  } : blank()
}, { immediate: true })
async function save() {
  if (busy.value) return
  if (!form.value.client_id) { error.value = 'Selecione um cliente.'; return }
  busy.value = true
  error.value = ''
  try {
    const payload = { ...form.value, expected_close_at: form.value.expected_close_at || null }
    if (props.opportunity) await opportunitiesApi.update(props.tenantId, props.opportunity.id, payload)
    else await opportunitiesApi.create(props.tenantId, payload)
    emit('saved')
  } catch (e) { error.value = errorMessage(e) }
  finally { busy.value = false }
}
</script>
<template>
  <AppDialog :open="open" :title="opportunity ? 'Editar oportunidade' : 'Nova oportunidade'" description="Registre e acompanhe negociações comerciais." :busy="busy" @close="emit('close')">
    <form class="space-y-4" @submit.prevent="save">
      <fieldset :disabled="busy" class="space-y-4">
        <div class="grid gap-4 sm:grid-cols-2">
          <FormField id="opportunity-code" v-model="form.code" label="Código" required maxlength="40" placeholder="OP-0001" />
          <FormField id="opportunity-title" v-model="form.title" label="Título" required maxlength="200" placeholder="Ex.: Renovação de 10 linhas" />
        </div>
        <label class="block space-y-2 text-sm font-semibold text-slate-700">Cliente
          <select v-model="form.client_id" class="field" required>
            <option value="">Selecione um cliente</option>
            <option v-for="client in clients" :key="client.id" :value="client.id">{{ client.company_name }}</option>
          </select>
        </label>
        <div class="grid gap-4 sm:grid-cols-2">
          <label class="block space-y-2 text-sm font-semibold text-slate-700">Tipo de negociação
            <select v-model="form.order_type" class="field">
              <option value="NOVO">Novo</option>
              <option value="PORTABILIDADE">Portabilidade</option>
              <option value="RENOVACAO">Renovação</option>
              <option value="MIGRACAO">Migração</option>
              <option value="ADICAO">Adição de linhas</option>
            </select>
          </label>
          <FormField id="opportunity-forecast" v-model="form.expected_close_at" label="Previsão de fechamento" type="date" />
          <FormField id="opportunity-monthly" v-model.number="form.estimated_monthly_amount" label="Valor mensal estimado" type="number" min="0" step="0.01" />
          <FormField id="opportunity-once" v-model.number="form.estimated_one_time_amount" label="Valor pontual estimado" type="number" min="0" step="0.01" />
        </div>
        <label class="block space-y-2 text-sm font-semibold text-slate-700">Observações
          <textarea v-model="form.description" class="field" rows="3" placeholder="Detalhes da negociação" />
        </label>
      </fieldset>
      <p v-if="error" role="alert" class="rounded-xl bg-red-50 p-3 text-sm text-red-700">{{ error }}</p>
      <div class="flex justify-end gap-2 border-t border-stone-100 pt-4">
        <button type="button" class="secondary-button" :disabled="busy" @click="emit('close')">Cancelar</button>
        <button type="submit" class="primary-button w-auto" :disabled="busy">{{ busy ? 'Salvando…' : 'Salvar oportunidade' }}</button>
      </div>
    </form>
  </AppDialog>
</template>
