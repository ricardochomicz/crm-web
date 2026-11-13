<script setup lang="ts">
import AppAutocomplete from '@/components/ui/AppAutocomplete.vue'
import { computed } from 'vue'
import type { Client, Contact } from '@/features/clients/api'
import ClientPrimaryContactCard from '@/features/clients/components/ClientPrimaryContactCard.vue'
import type { OrderType } from '@/features/order-types/api'
import type { OpportunityInput } from '../api'
import OpportunityClientPicker from './OpportunityClientPicker.vue'
const model = defineModel<OpportunityInput>({ required: true })
const props = defineProps<{ clients: Client[]; orderTypes: OrderType[]; operators: { id: number; name: string }[]; canCreateClient?: boolean; clientContacts?: Contact[]; loadingClientContacts?: boolean }>()
const emit = defineEmits<{ changeOperator: [id: number | null]; createClient: [] }>()
const operatorValue = computed({ get: () => model.value.operator_id === null ? '' : String(model.value.operator_id), set: (value: string) => emit('changeOperator', value ? Number(value) : null) })
</script>
<template>
          <section class="space-y-4">
            <h3 class="text-sm font-bold uppercase tracking-wide text-slate-500">Dados da oportunidade</h3>
            <div class="grid gap-4 sm:grid-cols-2">
              <AppAutocomplete v-model="operatorValue" label="Operadora *" placeholder="Selecione a operadora" :options="operators.map(o => ({ id: String(o.id), name: o.name }))" />
              <div class="space-y-2"><label for="opportunity-title" class="block text-sm font-semibold text-slate-700">Título</label><input id="opportunity-title" v-model="model.title" class="field" required maxlength="200" placeholder="Ex.: Portabilidade de 5 linhas" /></div>
            </div>
            <OpportunityClientPicker v-model="model.client_id" :clients="clients"
              :can-create-client="canCreateClient" @create-client="emit('createClient')" />
            <ClientPrimaryContactCard v-if="model.client_id" :contacts="clientContacts" :loading="loadingClientContacts" />
            <div class="grid gap-4 sm:grid-cols-2">
              <AppAutocomplete v-model="model.order_type_id" label="Tipo de negociação" placeholder="Buscar tipo de negociação" :options="orderTypes" />
              <div class="space-y-2"><label for="opportunity-forecast" class="block text-sm font-semibold text-slate-700">Previsão de fechamento *</label><input id="opportunity-forecast" v-model="model.expected_close_at" type="date" class="field min-h-[44px]" required /></div>
            </div>
          </section>

</template>