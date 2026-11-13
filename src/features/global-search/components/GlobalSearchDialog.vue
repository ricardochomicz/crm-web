<script setup lang="ts">
import { computed, nextTick, ref, useId, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppDialog from '@/components/ui/AppDialog.vue'
import { useGlobalSearch } from '../composables/useGlobalSearch'
import { useGlobalSearchRecent } from '../composables/useGlobalSearchRecent'
import type { GlobalSearchCategory, GlobalSearchItem } from '../api/globalSearchApi'

const props = defineProps<{ open: boolean; tenantId: string; userId: string }>()
const emit = defineEmits<{ close: [] }>()
const router = useRouter()
const isOpen = computed(() => props.open)
const tenant = computed(() => props.tenantId || undefined)
const { recent, remember, clear } = useGlobalSearchRecent(computed(() => props.tenantId), computed(() => props.userId))
const { query, category, results, items, loading, error } = useGlobalSearch(tenant, isOpen)
const input = ref<HTMLInputElement | null>(null)
const list = ref<HTMLElement | null>(null)
const active = ref(0)
const listId = useId()
const categories: { key: GlobalSearchCategory | 'all'; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'clients', label: 'Clientes' },
  { key: 'opportunities', label: 'Oportunidades' },
  { key: 'orders', label: 'Pedidos' },
]
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
watch(items, () => { active.value = 0 })

function destination(item: GlobalSearchItem) {
  const base = '/empresas/' + encodeURIComponent(props.tenantId)
  if (item.type === 'clients') return { path: base + '/clientes', query: { cliente: item.id } }
  if (item.type === 'opportunities') return { path: base + '/oportunidades', query: { oportunidade: item.id } }
  return { path: base + '/pedidos', query: { pedido: item.id } }
}
function choose(item: GlobalSearchItem) {
  remember(item)
  emit('close')
  void router.push(destination(item))
}
async function move(direction: number) {
  if (!items.value.length) return
  active.value = (active.value + direction + items.value.length) % items.value.length
  await nextTick()
  list.value?.querySelectorAll<HTMLElement>('[data-search-result]')[active.value]?.scrollIntoView({ block: 'nearest' })
}
function keydown(event: KeyboardEvent) {
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault()
    void move(event.key === 'ArrowDown' ? 1 : -1)
  } else if (event.key === 'Enter' && items.value[active.value]) {
    event.preventDefault()
    choose(items.value[active.value]!)
  }
}
function optionId(item: GlobalSearchItem) {
  return listId + '-' + item.type + '-' + item.id
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
        @keydown="keydown" />
      <div class="flex flex-wrap gap-2" role="group" aria-label="Filtrar resultados por módulo">
        <button v-for="entry in categories" :key="entry.key" type="button"
          class="rounded-lg border px-3 py-1.5 text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-orange-600"
          :class="category === entry.key ? 'border-orange-500 bg-orange-50 text-orange-800' : 'border-stone-200 text-slate-600 hover:bg-stone-50'"
          :aria-pressed="category === entry.key" @click="category = entry.key; input?.focus()">
          {{ entry.label }}
          <span v-if="entry.key !== 'all' && query.trim().length >= 2" class="ml-1 opacity-60">{{ results[entry.key as GlobalSearchCategory].length }}</span>
        </button>
      </div>
      <div v-if="query.trim().length < 2" class="space-y-2">
        <div v-if="visibleRecent.length" class="flex items-center justify-between gap-3">
          <h3 class="text-xs font-bold uppercase tracking-wider text-slate-500">Acessados recentemente</h3>
          <button type="button" class="text-xs font-semibold text-orange-700 hover:underline" @click="clear">Limpar histórico</button>
        </div>
        <button v-for="item in visibleRecent" :key="item.type + item.id" type="button"
          class="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left hover:bg-orange-50" @click="choose(item)">
          <span class="min-w-0 flex-1"><span class="block truncate text-sm font-semibold text-slate-800">{{ item.title }}</span>
            <span class="block truncate text-xs text-slate-500">{{ item.subtitle }}</span></span>
          <span class="text-xs text-slate-400">{{ categories.find(entry => entry.key === item.type)?.label }}</span>
        </button>
        <p v-if="!visibleRecent.length" class="text-sm text-slate-500">Digite pelo menos 2 caracteres para pesquisar.</p>
      </div>
      <p v-else-if="loading" role="status" class="text-sm text-slate-500">Pesquisando...</p>
      <p v-if="error" role="alert" class="text-sm text-red-700">{{ error }}</p>
      <div v-if="!loading && !error && query.trim().length >= 2" :id="listId" ref="list" role="listbox"
        aria-label="Resultados da busca" class="max-h-[55dvh] space-y-4 overflow-y-auto">
        <section v-for="entry in visibleCategories" :key="entry.key" v-show="results[entry.key].length" role="group" :aria-label="entry.label">
          <h3 class="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">{{ entry.label }}</h3>
          <button v-for="item in results[entry.key]" :id="optionId(item)" :key="item.id" type="button"
            role="option" data-search-result :aria-selected="items[active]?.id === item.id && items[active]?.type === item.type"
            class="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left hover:bg-orange-50"
            :class="items[active]?.id === item.id && items[active]?.type === item.type ? 'bg-orange-50' : ''"
            @mouseenter="active = items.findIndex(result => result.id === item.id && result.type === item.type)"
            @click="choose(item)">
            <span class="min-w-0 flex-1"><span class="block truncate text-sm font-semibold text-slate-800">{{ item.title }}</span>
              <span class="block truncate text-xs text-slate-500">{{ item.subtitle }}</span></span>
            <span class="text-xs text-slate-400" aria-hidden="true">↵</span>
          </button>
        </section>
        <p v-if="!items.length" class="py-5 text-center text-sm text-slate-500">Nenhum resultado encontrado.</p>
      </div>
      <p class="border-t border-stone-100 pt-3 text-xs text-slate-400">↑ ↓ Navegar · Enter Abrir · Esc Fechar</p>
    </div>
  </AppDialog>
</template>
