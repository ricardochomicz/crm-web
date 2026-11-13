<script setup lang="ts">
import AppCheckbox from '@/components/ui/AppCheckbox.vue'
import type { OpportunityInput } from '../api'

defineProps<{
  items: OpportunityInput['items']
  maxItems: number
  selectedLineIndices: number[]
  filteredLineIndices: number[]
  allSelected: boolean
  lineSearch: string
  lineCount: number
  totalMonthly: number
  typeName: (id: string) => string
  money: (value: number) => string
}>()
const emit = defineEmits<{
  import: []
  'clear-selection': []
  'bulk-edit': []
  'toggle-all': [checked: boolean]
  'toggle-line': [index: number, checked: boolean]
  'update:lineSearch': [value: string]
  edit: [index: number]
  remove: [index: number]
}>()
</script>
<template>
          <section class="space-y-4 rounded-2xl border border-stone-200 bg-stone-50/60 p-4 sm:p-5">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div><h3 class="text-lg font-semibold">Linhas e serviços</h3><p class="text-xs text-slate-500">Cole números do Excel em lotes, cada lote com seu plano.</p></div>
              <button type="button" class="primary-button w-auto" :disabled="items.length >= maxItems" @click="emit('import')">+ Importar linhas</button>
            </div>
            <div v-if="selectedLineIndices.length" class="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-orange-50 px-4 py-3">
              <span class="text-sm font-semibold text-orange-900">{{ selectedLineIndices.length }} linha(s) selecionada(s)</span>
              <div class="flex gap-2">
                <button type="button" class="secondary-button w-auto" @click="emit('clear-selection')">Limpar seleção</button>
                <button type="button" class="primary-button w-auto" @click="emit('bulk-edit')">Editar selecionadas</button>
              </div>
            </div>
            <div v-if="items.length" class="flex flex-wrap items-end justify-between gap-3">
              <label class="block w-full max-w-sm space-y-1 text-xs font-semibold text-slate-600">Buscar número da linha
                <input :value="lineSearch" @input="emit('update:lineSearch', ($event.target as HTMLInputElement).value)" class="field w-full" type="search" inputmode="numeric" placeholder="Número completo ou parte dele" />
              </label>
              <span class="text-xs text-slate-500">Exibindo {{ filteredLineIndices.length }} de {{ items.length }} linhas</span>
            </div>
            <p v-if="!items.length" class="rounded-xl border border-dashed border-stone-300 bg-white p-8 text-center text-sm text-slate-500">Nenhuma linha adicionada.</p>
            <div v-else class="overflow-auto rounded-xl border border-stone-200 bg-white" :class="items.length > 10 ? 'max-h-[480px]' : ''">
              <table class="w-full min-w-[500px] text-left text-sm">
                <thead class="sticky top-0 bg-stone-100 text-xs uppercase text-slate-500"><tr><th class="p-3"><div class="flex items-center gap-3"><AppCheckbox label="Selecionar todas as linhas" :show-label="false" :model-value="allSelected" :indeterminate="selectedLineIndices.length > 0 && !allSelected" @update:model-value="checked => emit('toggle-all', checked)" /><span>Número</span></div></th><th class="p-3">Plano</th><th class="p-3 text-right">Mensal</th><th class="p-3 text-right">Ação</th></tr></thead>
                <tbody><tr v-for="index in filteredLineIndices" :key="items[index]?.id ?? index" class="border-t border-stone-100 transition-colors" :class="selectedLineIndices.includes(index) ? 'bg-orange-50/70' : 'hover:bg-stone-50'">
                  <td class="p-3 font-medium"><div class="flex items-center gap-3"><AppCheckbox :label="'Selecionar linha ' + (index + 1)" :show-label="false" :model-value="selectedLineIndices.includes(index)" @update:model-value="checked => emit('toggle-line', index, checked)" /><span>{{ items[index]?.line_number || 'Número pendente' }}<span class="ml-2 text-xs text-slate-400">{{ typeName(items[index]?.order_type_id ?? '') }}</span></span></div></td><td class="p-3">{{ items[index]?.description }}</td>
                  <td class="p-3 text-right">{{ money(Number(items[index]?.monthly_unit_amount) * Number(items[index]?.quantity)) }}</td>
                  <td class="p-3 text-right"><div class="flex justify-end gap-3"><button type="button" class="font-semibold text-blue-700 hover:underline" @click="emit('edit', index)">Editar</button><button type="button" class="font-semibold text-red-600 hover:underline" @click="emit('remove', index)">Excluir</button></div></td>
                </tr><tr v-if="!filteredLineIndices.length"><td colspan="4" class="p-6 text-center text-sm text-slate-500">Nenhuma linha encontrada.</td></tr></tbody>
              </table>
            </div>
            <p class="text-sm font-semibold">{{ lineCount }} linha(s) · {{ money(totalMonthly) }}/mês</p>
          </section>
</template>
