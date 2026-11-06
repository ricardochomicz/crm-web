<script setup lang="ts">
import { computed, ref, watch } from 'vue'
type Option = { value: string | number; label: string }
const props = defineProps<{ modelValue: string | number; options: Option[]; placeholder?: string; required?: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: string | number] }>()
const open = ref(false)
const query = ref('')
const active = ref(0)
const selected = computed(() => props.options.find(o => String(o.value) === String(props.modelValue)))
const filtered = computed(() => props.options.filter(o => o.label.toLocaleLowerCase('pt-BR').includes(query.value.toLocaleLowerCase('pt-BR'))))
watch(query, () => { active.value = 0 })
function choose(option: Option) { emit('update:modelValue', option.value); query.value = ''; open.value = false }
function onKeydown(event: KeyboardEvent) {
 if (event.key === 'Escape') { open.value = false; query.value = ''; return }
 if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
  event.preventDefault(); open.value = true
  active.value = Math.max(0, Math.min(filtered.value.length - 1, active.value + (event.key === 'ArrowDown' ? 1 : -1)))
 }
 if (event.key === 'Enter' && open.value && filtered.value[active.value]) { event.preventDefault(); choose(filtered.value[active.value]!) }
}
function close() { open.value = false; query.value = '' }
</script>
<template>
 <div class="relative" @keydown="onKeydown" @focusout="(e) => { if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node | null)) close() }">
  <input
   :value="open ? query : (selected?.label ?? '')"
   :placeholder="placeholder ?? 'Selecione ou pesquise...'"
   :required="required && !selected"
   role="combobox" aria-autocomplete="list" :aria-expanded="open" aria-haspopup="listbox"
   autocomplete="off"
   class="w-full rounded-xl bg-stone-100 px-4 py-3 pr-10 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:bg-stone-200/70 focus:bg-white focus:ring-2 focus:ring-orange-400"
   @focus="open = true; query = ''"
   @input="query = ($event.target as HTMLInputElement).value; open = true"
  />
  <span class="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">⌄</span>
  <div v-if="open" role="listbox" class="absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-stone-100 bg-white p-1 shadow-xl">
   <button v-for="(option, i) in filtered" :key="option.value" type="button" role="option" :aria-selected="String(option.value) === String(modelValue)" class="block w-full rounded-lg px-3 py-2.5 text-left text-sm hover:bg-orange-50" :class="i === active ? 'bg-orange-50 text-orange-800' : 'text-slate-700'" @mousedown.prevent="choose(option)">
    {{ option.label }}
   </button>
   <p v-if="!filtered.length" class="px-3 py-3 text-sm text-slate-500">Nenhum resultado encontrado.</p>
  </div>
 </div>
</template>
