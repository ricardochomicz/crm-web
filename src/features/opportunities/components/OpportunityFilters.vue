<script setup lang="ts">
import { computed } from 'vue'
import ListFilters from '@/components/ui/ListFilters.vue'
import type { OpportunityFilters } from '../api'
import type { OrderType } from '@/features/order-types/api'

const props = defineProps<{
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
const custom = computed(() => props.modelValue.period === 'custom')
</script>

<template>
    <ListFilters :busy="busy" :columns="2" :count-label="`${count} oportunidade(s) encontrada(s)`" @search="emit('search')" @clear="emit('clear')">
        <label class="text-xs font-semibold text-slate-600">
            Buscar oportunidade ou cliente
            <input :value="modelValue.search" class="field" type="search" placeholder="Código, título, nome, CPF ou CNPJ" @input="set('search', ($event.target as HTMLInputElement).value)" />
        </label>
        <label class="text-xs font-semibold text-slate-600">
            Situação
            <select :value="modelValue.status" class="field" @change="set('status', ($event.target as HTMLSelectElement).value)">
                <option value="open">Em aberto</option>
                <option value="won">Ganhas</option>
                <option value="lost">Perdidas</option>
                <option value="cancelled">Canceladas</option>
                <option value="all">Todas</option>
            </select>
        </label>
        <label class="text-xs font-semibold text-slate-600">
            Tipo do pedido
            <select :value="modelValue.order_type_id" class="field" @change="set('order_type_id', ($event.target as HTMLSelectElement).value)">
                <option value="">Todos os tipos</option>
                <option v-for="type in types" :key="type.id" :value="type.id">{{ type.name }}</option>
            </select>
        </label>
        <label class="text-xs font-semibold text-slate-600">
            Período do forecast
            <select :value="modelValue.period" class="field" @change="set('period', ($event.target as HTMLSelectElement).value)">
                <option value="current">Mês atual + atrasadas + sem previsão</option>
                <option value="overdue">Somente atrasadas</option>
                <option value="future">Próximos meses</option>
                <option value="custom">Intervalo personalizado</option>
                <option value="all">Todas as datas</option>
            </select>
        </label>
        <template v-if="custom">
            <label class="text-xs font-semibold text-slate-600">
                Previsão inicial
                <input type="date" class="field" :value="modelValue.date_from" @input="set('date_from', ($event.target as HTMLInputElement).value)" />
            </label>
            <label class="text-xs font-semibold text-slate-600">
                Previsão final
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
