<script setup lang="ts">
import { computed, nextTick, ref, useId, watch } from 'vue'
import type { Client } from '@/features/clients/api'
import { useOpportunityClientSearch } from '../composables/useOpportunityClientSearch'

const props = withDefaults(defineProps<{
  modelValue: string
  clients: Client[]
  canCreateClient?: boolean
}>(), { canCreateClient: false })
const emit = defineEmits<{
  'update:modelValue': [id: string]
  createClient: []
}>()

const { clientSearch, clientMenuOpen, activeIndex, filteredClients, selectClient, onSearchInput, onKeydown, openMenu, closeMenu } =
  useOpportunityClientSearch(
    computed(() => props.clients),
    computed(() => props.modelValue),
    id => emit('update:modelValue', id),
  )

const id = useId()
const listRef = ref<HTMLElement | null>(null)
watch(activeIndex, async index => {
  await nextTick()
  const option = listRef.value?.querySelectorAll('[role="option"]')[index]
  option?.scrollIntoView({ block: 'nearest' })
})

function createClient() {
  closeMenu()
  emit('createClient')
}
</script>

<template>
  <div class="space-y-2">
    <label :for="id" class="block text-sm font-semibold text-slate-700">Cliente</label>
    <div class="relative">
      <input  :id="id" v-model="clientSearch" class="field" type="search"
        autocomplete="off" placeholder="Buscar por nome, CPF ou CNPJ" role="combobox"
        aria-autocomplete="list" :aria-expanded="clientMenuOpen"  :aria-controls="id + '-options'" :aria-activedescendant="clientMenuOpen && filteredClients[activeIndex] ? id + '-option-' + activeIndex : undefined"
        @focus="openMenu"
        @input="onSearchInput"
        @keydown="onKeydown"
        @blur="closeMenu" />
      <div v-if="clientMenuOpen" :id="id + '-options'" ref="listRef" role="listbox"
        class="absolute z-30 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-stone-200 bg-white py-1 shadow-lg">
        <button v-for="(client, index) in filteredClients" :id="id + '-option-' + index" :key="client.id" type="button" role="option"
          :aria-selected="modelValue === client.id"
          class="block w-full px-4 py-3 text-left hover:bg-orange-50"
          :class="index === activeIndex ? 'bg-orange-50 text-orange-800' : ''"
          @mouseenter="activeIndex = index"
          @mousedown.prevent="selectClient(client)">
          <span class="block text-sm font-semibold text-slate-800">{{ client.company_name }}</span>
          <span class="text-xs text-slate-500">{{ client.document }}</span>
        </button>
        <p v-if="!filteredClients.length" class="px-4 py-3 text-sm text-slate-500">Nenhum cliente encontrado.</p>
        <button v-if="canCreateClient" type="button"
          class="block w-full border-t border-stone-100 px-4 py-3 text-left text-sm font-semibold text-orange-700 hover:bg-orange-50"
          @mousedown.prevent="createClient">+ Cadastrar novo cliente</button>
      </div>
    </div>
  </div>
</template>
