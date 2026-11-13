<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppDialog from '@/components/ui/AppDialog.vue'
import { useGlobalSearch } from '../composables/useGlobalSearch'
import type { GlobalSearchItem } from '../api/globalSearchApi'

const props = defineProps<{ open: boolean; tenantId: string }>()
const emit = defineEmits<{ close: [] }>()
const router = useRouter()
const isOpen = computed(() => props.open)
const tenant = computed(() => props.tenantId || undefined)
const { query, results, items, loading, error } = useGlobalSearch(tenant, isOpen)
const input = ref<HTMLInputElement | null>(null)
const active = ref(0)
const categories = [
  { key: 'clients', label: 'Clientes' },
  { key: 'opportunities', label: 'Oportunidades' },
  { key: 'orders', label: 'Pedidos' },
] as const

watch(() => props.open, async open => {
  if (open) {
    query.value = ''
    active.value = 0
    await nextTick()
    input.value?.focus()
  }
})
watch(items, () => { active.value = 0 })

function destination(item: GlobalSearchItem) {
  const base = '/empresas/' + encodeURIComponent(props.tenantId)
  if (item.type === 'clients') return { path: base + '/clientes', query: { cliente: item.id } }
  if (item.type === 'opportunities') return { path: base + '/oportunidades', query: { oportunidade: item.id } }
  return { path: base + '/pedidos', query: { pedido: item.id } }
}
function choose(item: GlobalSearchItem) {
  emit('close')
  void router.push(destination(item))
}
function keydown(event: KeyboardEvent) {
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault()
    if (items.value.length) active.value = (active.value + (event.key === 'ArrowDown' ? 1 : -1) + items.value.length) % items.value.length
  }
  if (event.key === 'Enter' && items.value[active.value]) {
    event.preventDefault()
    choose(items.value[active.value]!)
  }
}
</script>
<template>
  <AppDialog :open="open" size="medium" title="Busca global" description="Encontre clientes, oportunidades e pedidos." @close="emit('close')">
    <div class="space-y-4">
      <div class="relative">
        <input ref="input" v-model="query" data-initial-focus type="search" class="field w-full" autocomplete="off"
          placeholder="Digite nome, código, CPF ou CNPJ..." aria-label="Buscar em todo o CRM" @keydown="keydown" />
      </div>
      <p v-if="query.trim().length < 2" class="text-sm text-slate-500">Digite pelo menos 2 caracteres para pesquisar.</p>
      <p v-else-if="loading" role="status" class="text-sm text-slate-500">Pesquisando...</p>
      <p v-if="error" role="alert" class="text-sm text-red-700">{{ error }}</p>
      <div v-if="!loading && !error && query.trim().length >= 2" class="max-h-[55dvh] space-y-4 overflow-y-auto">
        <section v-for="category in categories" :key="category.key" v-show="results[category.key].length">
          <h3 class="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">{{ category.label }}</h3>
          <button v-for="item in results[category.key]" :key="item.id" type="button"
            class="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left hover:bg-orange-50"
            :class="items[active]?.id === item.id && items[active]?.type === item.type ? 'bg-orange-50' : ''"
            @mouseenter="active = items.findIndex(result => result.id === item.id && result.type === item.type)"
            @click="choose(item)">
            <span class="min-w-0 flex-1"><span class="block truncate text-sm font-semibold text-slate-800">{{ item.title }}</span>
              <span class="block truncate text-xs text-slate-500">{{ item.subtitle }}</span></span>
            <span class="text-xs text-slate-400">↵</span>
          </button>
        </section>
        <p v-if="!items.length" class="py-5 text-center text-sm text-slate-500">Nenhum resultado encontrado.</p>
      </div>
      <p class="border-t border-stone-100 pt-3 text-xs text-slate-400">↑ ↓ Navegar · Enter Abrir · Esc Fechar</p>
    </div>
  </AppDialog>
</template>
