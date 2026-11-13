<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppDialog from '@/components/ui/AppDialog.vue'
import AppFilterChips from '@/components/ui/AppFilterChips.vue'
import GlobalSearchResult from './GlobalSearchResult.vue'
import GlobalSearchStatus from './GlobalSearchStatus.vue'
import { globalSearchDestination } from '../utils/globalSearchDestination'
import { useGlobalSearch } from '../composables/useGlobalSearch'
import { useGlobalSearchRecent } from '../composables/useGlobalSearchRecent'
import { useGlobalSearchNavigation } from '../composables/useGlobalSearchNavigation'
import type { GlobalSearchCategory, GlobalSearchItem } from '../api/globalSearchApi'

const props = defineProps<{ open: boolean; tenantId: string; userId: string }>()
const emit = defineEmits<{ close: [] }>()
const router = useRouter()
const isOpen = computed(() => props.open)
const tenant = computed(() => props.tenantId || undefined)
const { recent, remember, clear } = useGlobalSearchRecent(computed(() => props.tenantId), computed(() => props.userId))
const { query, category, results, items, loading, error } = useGlobalSearch(tenant, isOpen)
const input = ref<HTMLInputElement | null>(null)
const { list, active, listId, optionId, highlight, keydown } = useGlobalSearchNavigation(items)
const categories: { key: GlobalSearchCategory | 'all'; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'clients', label: 'Clientes' },
  { key: 'opportunities', label: 'Oportunidades' },
  { key: 'orders', label: 'Pedidos' },
]
const filterOptions = computed(() => categories.map(entry => ({
  value: entry.key,
  label: entry.label,
  count: entry.key !== 'all' && query.value.trim().length >= 2 ? results.value[entry.key].length : undefined,
})))
function updateCategory(value: string) {
  if (categories.some(entry => entry.key === value)) category.value = value as GlobalSearchCategory | 'all'
  input.value?.focus()
}
const visibleRecent = computed(() => category.value === 'all' ? recent.value : recent.value.filter(item => item.type === category.value))
const visibleCategories = computed(() => categories.filter(
  entry => entry.key !== 'all' && (category.value === 'all' || category.value === entry.key),
) as { key: GlobalSearchCategory; label: string }[])

watch(() => props.open, async open => {
  if (!open) return
  query.value = ''
  category.value = 'all'
  active.value = 0
  await nextTick()
  input.value?.focus()
})

function choose(item: GlobalSearchItem) {
  remember(item)
  emit('close')
  void router.push(globalSearchDestination(props.tenantId, item))
}
</script>
<template>
  <AppDialog :open="open" size="medium" title="Busca global" description="Encontre clientes, oportunidades e pedidos." @close="emit('close')">
    <div class="space-y-4">
      <input ref="input" v-model="query" data-initial-focus type="search" class="field w-full" autocomplete="off"
        placeholder="Digite nome, código, CPF ou CNPJ..." aria-label="Buscar em todo o CRM"
        role="combobox" aria-autocomplete="list" aria-haspopup="listbox"
        :aria-expanded="items.length > 0 && !loading" :aria-controls="listId"
        :aria-activedescendant="items[active] && !loading ? optionId(items[active]!) : undefined"
        @keydown="keydown($event, choose)" />
      <AppFilterChips :model-value="category" label="Filtrar resultados por módulo"
        :options="filterOptions" @update:model-value="updateCategory" />
      <div v-if="query.trim().length < 2" class="space-y-2">
        <div v-if="visibleRecent.length" class="flex items-center justify-between gap-3">
          <h3 class="text-xs font-bold uppercase tracking-wider text-slate-500">Acessados recentemente</h3>
          <button type="button" class="text-xs font-semibold text-orange-700 hover:underline" @click="clear">Limpar histórico</button>
        </div>
        <GlobalSearchResult v-for="item in visibleRecent" :key="item.type + item.id"
          :item="item" :category-label="categories.find(entry => entry.key === item.type)?.label"
          @select="choose(item)" />
      </div>
      <GlobalSearchStatus :query="query" :loading="loading" :error="error"
        :has-results="items.length > 0" :has-recent="visibleRecent.length > 0" />
      <div v-if="!loading && !error && query.trim().length >= 2" :id="listId" ref="list" role="listbox"
        aria-label="Resultados da busca" class="max-h-[55dvh] space-y-4 overflow-y-auto">
        <section v-for="entry in visibleCategories" :key="entry.key" v-show="results[entry.key].length" role="group" :aria-label="entry.label">
          <h3 class="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">{{ entry.label }}</h3>
          <GlobalSearchResult v-for="item in results[entry.key]" :key="item.id"
            :item="item" :option-id="optionId(item)" option
            :active="items[active]?.id === item.id && items[active]?.type === item.type"
            @hover="highlight(item)"
            @select="choose(item)" />
        </section>
      </div>
      <p class="border-t border-stone-100 pt-3 text-xs text-slate-400">↑ ↓ Navegar · Enter Abrir · Esc Fechar</p>
    </div>
  </AppDialog>
</template>
