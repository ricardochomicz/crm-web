<script setup lang="ts">
import { computed } from 'vue'
import ListFilters from '@/components/ui/ListFilters.vue'
import SearchSelect from '@/components/ui/SearchSelect.vue'
import AppSearchInput from '@/components/ui/AppSearchInput.vue'
import type { OpportunityFilters } from '../api'
import type { OrderType } from '@/features/order-types/api'

const props = defineProps<{
    section: 'open' | 'closed'
    modelValue: OpportunityFilters
    types: OrderType[]
    busy: boolean
    count: number
}>()
const emit = defineEmits<{
    'update:modelValue': [value: OpportunityFilters]
    search: []
    clear: []
}>()
function set(key: keyof OpportunityFilters, value: string | number) {
    emit('update:modelValue', { ...props.modelValue, [key]: value })
}
const statusOptions = computed(() => [
  ...(props.section === 'open' ? [{ value: 'open', label: 'Em aberto' }] : []),
  { value: 'won', label: 'Ganhas' },
  { value: 'lost', label: 'Perdidas' },
  { value: 'cancelled', label: 'Canceladas' },
  ...(props.section === 'closed' ? [{ value: 'all', label: 'Todas as encerradas' }] : []),
])
const typeOptions = computed(() => [
  { value: '', label: 'Todos os tipos' },
  ...props.types.map(type => ({ value: String(type.id), label: type.name })),
])
const periodOptions = computed(() => props.section === 'closed'
  ? [{ value: 'closed', label: 'Todas as datas de encerramento' }]
  : [
      { value: 'current', label: 'Mês atual + atrasadas + sem previsão' },
      { value: 'overdue', label: 'Somente atrasadas' },
      { value: 'future', label: 'Próximos meses' },
      { value: 'custom', label: 'Intervalo personalizado' },
      { value: 'all', label: 'Todas as datas' },
    ])
const custom = computed(() => props.modelValue.period === 'custom' || (props.section === 'closed' && props.modelValue.period === 'closed'))
const activeCount = computed(() => [
    !!props.modelValue.search?.trim(),
    !!props.modelValue.order_type_id,
    props.section === 'closed' ? props.modelValue.status !== 'all' : props.modelValue.status !== 'open',
    props.section === 'closed' ? false : props.modelValue.period !== 'current',
    props.modelValue.period === 'custom' && !!props.modelValue.date_from,
    props.modelValue.period === 'custom' && !!props.modelValue.date_to,
    props.modelValue.min_amount !== undefined,
    props.modelValue.max_amount !== undefined,
].filter(Boolean).length)
</script>

<template>
    <ListFilters collapsible initially-collapsed :active-count="activeCount" :busy="busy" :columns="2" :count-label="`${count} oportunidade(s) encontrada(s)`" @search="emit('search')" @clear="emit('clear')">
        <label class="text-xs font-semibold text-slate-600">
            Buscar oportunidade ou cliente
            <AppSearchInput :model-value="modelValue.search ?? ''" placeholder="Código, título, nome, CPF ou CNPJ" @update:model-value="set('search', $event)" />
        </label>
        <label class="text-xs font-semibold text-slate-600">
            Situação
            <SearchSelect :model-value="modelValue.status ?? null" :options="statusOptions" @update:model-value="value => set('status', value)" />
        </label>
        <label class="text-xs font-semibold text-slate-600">
            Tipo do pedido
            <SearchSelect :model-value="modelValue.order_type_id ?? null" :options="typeOptions" @update:model-value="value => set('order_type_id', value)" />
        </label>
        <label class="text-xs font-semibold text-slate-600">
            {{ section === 'closed' ? 'Período do encerramento' : 'Período do forecast' }}
            <SearchSelect :model-value="modelValue.period ?? null" :options="periodOptions" @update:model-value="value => set('period', value)" />
        </label>
        <template v-if="custom">
            <label class="text-xs font-semibold text-slate-600">
                {{ section === 'closed' ? 'Encerramento inicial' : 'Previsão inicial' }}
                <input type="date" class="field" :value="modelValue.date_from" @input="set('date_from', ($event.target as HTMLInputElement).value)" />
            </label>
            <label class="text-xs font-semibold text-slate-600">
                {{ section === 'closed' ? 'Encerramento final' : 'Previsão final' }}
                <input type="date" class="field" :min="modelValue.date_from" :value="modelValue.date_to" @input="set('date_to', ($event.target as HTMLInputElement).value)" />
            </label>
        </template>
        <div class="space-y-2 text-xs font-semibold text-slate-600">
            <div class="flex justify-between"><span>Valor mensal mínimo</span><span>R$ {{ Number(modelValue.min_amount || 0).toLocaleString('pt-BR') }}</span></div>
            <input type="range" min="0" max="100000" step="100" class="w-full accent-orange-600" :value="modelValue.min_amount || 0" @input="set('min_amount', Number(($event.target as HTMLInputElement).value))" />
            <input type="number" min="0" step="0.01" class="field" :value="modelValue.min_amount ?? ''" placeholder="Mínimo exato (R$)" @input="set('min_amount', ($event.target as HTMLInputElement).value)" />
        </div>
        <div class="space-y-2 text-xs font-semibold text-slate-600">
            <div class="flex justify-between"><span>Valor mensal máximo</span><span>R$ {{ Number(modelValue.max_amount || 100000).toLocaleString('pt-BR') }}</span></div>
            <input type="range" min="0" max="100000" step="100" class="w-full accent-orange-600" :value="modelValue.max_amount ?? 100000" @input="set('max_amount', Number(($event.target as HTMLInputElement).value))" />
            <input type="number" min="0" step="0.01" class="field" :value="modelValue.max_amount ?? ''" placeholder="Sem limite máximo" @input="set('max_amount', ($event.target as HTMLInputElement).value)" />
        </div>
    </ListFilters>
</template>
