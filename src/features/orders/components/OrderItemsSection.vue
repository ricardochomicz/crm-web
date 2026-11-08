<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import SearchSelect from '@/components/ui/SearchSelect.vue'
import type { CommercialOrderItem } from '../api'

const props = defineProps<{ items: CommercialOrderItem[]; count: number }>()
const expanded = ref(true)
const search = ref('')
const status = ref('')
const tableScroll = ref<HTMLElement>()
function clearFilters() {
  search.value = ''
  status.value = ''
}
const normalizeNumber = (value: string) => value.replace(/[\s()+.-]/g, '')
const filteredItems = computed(() => {
  const query = normalizeNumber(search.value)
  return props.items.filter(
    (item) =>
      (!query || normalizeNumber(item.line_number ?? '').includes(query)) &&
      (!status.value || item.status === status.value),
  )
})
watch([search, status], () => {
  if (tableScroll.value) tableScroll.value.scrollTop = 0
})

const money = (value: string) =>
  Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
</script>

<template>
  <section class="overflow-hidden rounded-xl border border-stone-200">
    <button
      type="button"
      class="flex w-full items-center justify-between gap-3 p-5 text-left hover:bg-stone-50"
      :aria-expanded="expanded"
      @click="expanded = !expanded"
    >
      <div>
        <h3 class="font-semibold text-slate-800">Linhas do pedido</h3>
        <p class="mt-1 text-xs text-slate-500">
          {{ count }} {{ count === 1 ? 'linha negociada' : 'linhas negociadas' }}
        </p>
      </div>
      <span class="text-sm font-semibold text-orange-700">{{
        expanded ? 'Recolher −' : 'Ver linhas +'
      }}</span>
    </button>
    <div v-if="expanded" class="border-t border-stone-200">
      <div class="grid gap-3 border-b border-stone-100 p-4 sm:grid-cols-2">
        <label class="text-xs font-semibold text-slate-600">
          Buscar número da linha
          <input
            v-model="search"
            type="search"
            class="field mt-1"
            placeholder="Número completo ou parte dele"
          />
        </label>
        <label class="text-xs font-semibold text-slate-600">
          Situação
          <SearchSelect
            v-model="status"
            class="mt-1"
            :options="[
              { value: '', label: 'Todas' },
              { value: 'ACTIVE', label: 'Ativas' },
              { value: 'PENDING', label: 'Pendentes' },
            ]"
          />
        </label>
        <div class="flex flex-wrap items-center justify-between gap-2 sm:col-span-2">
          <p class="text-xs text-slate-500" role="status">
            Exibindo {{ filteredItems.length }} de {{ items.length }} linhas
          </p>
          <button
            v-if="search || status"
            type="button"
            class="text-xs font-semibold text-orange-700 hover:underline"
            @click="clearFilters"
          >
            Limpar filtros
          </button>
        </div>
      </div>
      <div
        ref="tableScroll"
        class="max-h-72 overflow-auto overscroll-contain"
        tabindex="0"
        role="region"
        aria-label="Linhas do pedido"
      >
        <table class="w-full min-w-[580px] text-left text-sm">
          <thead class="sticky top-0 z-10 bg-stone-50 text-xs uppercase text-slate-500">
            <tr>
              <th scope="col" class="p-3">Linha</th>
              <th scope="col" class="p-3">Descrição</th>
              <th scope="col" class="p-3">Quantidade</th>
              <th scope="col" class="p-3">R$</th>
              <th scope="col" class="p-3">Status</th>
              <th scope="col" class="p-3">Ativação efetiva</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in filteredItems" :key="item.id" class="border-t border-stone-100">
              <td class="whitespace-nowrap p-3">{{ item.line_number || '—' }}</td>
              <td class="max-w-64 truncate p-3" :title="item.description || undefined">
                {{ item.description || '—' }}
              </td>
              <td class="whitespace-nowrap p-3">{{ item.quantity }}</td>
              <td class="whitespace-nowrap p-3">{{ money(item.monthly_unit_amount) }}</td>
              <td class="whitespace-nowrap p-3">
                {{
                  item.status === 'ACTIVE'
                    ? 'Ativa'
                    : item.status === 'PENDING'
                      ? 'Pendente'
                      : item.status || '—'
                }}
              </td>
              <td class="whitespace-nowrap p-3">
                {{ item.activated_at?.slice(0, 10).split('-').reverse().join('/') || '—' }}
              </td>
            </tr>
            <tr v-if="!filteredItems.length">
              <td colspan="6" class="p-6 text-center text-sm text-slate-500">
                {{
                  items.length
                    ? 'Nenhuma linha corresponde aos filtros.'
                    : 'Nenhum item registrado.'
                }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>
