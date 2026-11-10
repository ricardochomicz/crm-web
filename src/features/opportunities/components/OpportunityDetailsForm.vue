<script setup lang="ts">
import AppAutocomplete from '@/components/ui/AppAutocomplete.vue'
import { computed, ref, watch } from 'vue'
import type { Client } from '@/features/clients/api'
import type { OrderType } from '@/features/order-types/api'
import type { OpportunityInput } from '../api'
const model = defineModel<OpportunityInput>({ required: true })
const props = defineProps<{ clients: Client[]; orderTypes: OrderType[]; operators: { id: number; name: string }[] }>()
const emit = defineEmits<{ changeOperator: [id: number | null] }>()
const operatorValue = computed({ get: () => model.value.operator_id === null ? '' : String(model.value.operator_id), set: (value: string) => emit('changeOperator', value ? Number(value) : null) })
const clientSearch = ref('')
const clientMenuOpen = ref(false)
const filteredClients = computed(() => {
  const term = clientSearch.value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
  const digits = term.replace(/\D/g, '')
  return props.clients.filter(client => {
    const name = client.company_name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    return !term || name.includes(term) || (digits.length >= 2 && client.document.replace(/\D/g, '').includes(digits))
  }).slice(0, 30)
})
function selectClient(client: Client) {
  model.value.client_id = client.id
  clientSearch.value = client.company_name + ' · ' + client.document
  clientMenuOpen.value = false
}
watch(() => [model.value.client_id, props.clients] as const, () => {
  if (clientMenuOpen.value) return
  const selected = props.clients.find(client => client.id === model.value.client_id)
  clientSearch.value = selected ? selected.company_name + ' · ' + selected.document : ''
}, { immediate: true })
</script>
<template>
          <section class="space-y-4">
            <h3 class="text-sm font-bold uppercase tracking-wide text-slate-500">Dados da oportunidade</h3>
            <div class="grid gap-4 sm:grid-cols-2">
              <AppAutocomplete v-model="operatorValue" label="Operadora *" placeholder="Selecione a operadora" :options="operators.map(o => ({ id: String(o.id), name: o.name }))" />
              <div class="space-y-2"><label for="opportunity-title" class="block text-sm font-semibold text-slate-700">Título</label><input id="opportunity-title" v-model="model.title" class="field" required maxlength="200" placeholder="Ex.: Portabilidade de 5 linhas" /></div>
            </div>
            <div class="space-y-2">
              <label for="opportunity-client" class="block text-sm font-semibold text-slate-700">Cliente</label>
              <div class="relative">
                <input id="opportunity-client" v-model="clientSearch" class="field" type="search"
                  autocomplete="off" placeholder="Buscar por nome, CPF ou CNPJ" role="combobox"
                  aria-autocomplete="list" :aria-expanded="clientMenuOpen" aria-controls="opportunity-client-options"
                  @focus="clientMenuOpen = true"
                  @input="model.client_id = ''; clientMenuOpen = true"
                  @keydown.esc="clientMenuOpen = false"
                  @keydown.enter.prevent="filteredClients.length && selectClient(filteredClients[0]!)"
                  @blur="clientMenuOpen = false" />
                <div v-if="clientMenuOpen" id="opportunity-client-options" role="listbox"
                  class="absolute z-30 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-stone-200 bg-white py-1 shadow-lg">
                  <button v-for="client in filteredClients" :key="client.id" type="button" role="option"
                    :aria-selected="model.client_id === client.id"
                    class="block w-full px-4 py-3 text-left hover:bg-orange-50"
                    @mousedown.prevent="selectClient(client)">
                    <span class="block text-sm font-semibold text-slate-800">{{ client.company_name }}</span>
                    <span class="text-xs text-slate-500">{{ client.document }}</span>
                  </button>
                  <p v-if="!filteredClients.length" class="px-4 py-3 text-sm text-slate-500">Nenhum cliente encontrado.</p>
                </div>
              </div>
            </div>
            <div class="grid gap-4 sm:grid-cols-2">
              <AppAutocomplete v-model="model.order_type_id" label="Tipo de negociação" placeholder="Buscar tipo de negociação" :options="orderTypes" />
              <div class="space-y-2"><label for="opportunity-forecast" class="block text-sm font-semibold text-slate-700">Previsão de fechamento *</label><input id="opportunity-forecast" v-model="model.expected_close_at" type="date" class="field min-h-[44px]" required /></div>
            </div>
          </section>

</template>