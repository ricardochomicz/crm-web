<script setup lang="ts">
import { computed, ref } from 'vue'
const props = defineProps<{ modelValue: string[]; options: { value: string; label: string }[]; placeholder?: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string[]] }>()
const open = ref(false)
const search = ref('')
const filtered = computed(() => props.options.filter(option => option.label.toLocaleLowerCase('pt-BR').includes(search.value.toLocaleLowerCase('pt-BR'))))
function toggle(value: string) {
  emit('update:modelValue', props.modelValue.includes(value) ? props.modelValue.filter(item => item !== value) : [...props.modelValue, value])
}
</script>

<template>
  <div class="relative">
    <button type="button" class="field flex min-h-11 w-full items-center justify-between gap-2 text-left" :aria-expanded="open" @click="open = !open">
      <span class="truncate">{{ modelValue.length ? `${modelValue.length} tipo(s) selecionado(s)` : (placeholder || 'Todos os tipos') }}</span>
      <span aria-hidden="true">⌄</span>
    </button>
    <div v-if="open" class="absolute left-0 top-full z-30 mt-1 w-full rounded-xl border border-stone-200 bg-white p-2 shadow-xl">
      <input v-model="search" type="search" class="field mb-2 w-full" placeholder="Buscar tipo..." aria-label="Buscar tipo de pedido" />
      <button type="button" class="mb-1 w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-orange-50" @click="emit('update:modelValue', [])">Todos os tipos</button>
      <div class="max-h-48 overflow-y-auto">
        <label v-for="option in filtered" :key="option.value" class="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-orange-50">
          <input type="checkbox" :checked="modelValue.includes(option.value)" @change="toggle(option.value)" />
          <span>{{ option.label }}</span>
        </label>
        <p v-if="!filtered.length" class="p-2 text-sm text-slate-500">Nenhum tipo encontrado.</p>
      </div>
      <button type="button" class="mt-2 w-full rounded-lg bg-stone-100 px-3 py-2 text-sm font-medium" @click="open = false">Aplicar seleção</button>
    </div>
  </div>
</template>
