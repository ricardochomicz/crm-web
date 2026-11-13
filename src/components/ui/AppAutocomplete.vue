<script setup lang="ts">
import { computed, nextTick, ref, useId, watch } from 'vue'
type Option = { id: string; name: string }
const props = withDefaults(
  defineProps<{ options: Option[]; label: string; placeholder?: string; disabled?: boolean; emptyMessage?: string }>(),
  { placeholder: 'Selecione ou pesquise', disabled: false, emptyMessage: 'Nenhum resultado encontrado.' },
)
const model = defineModel<string>({ required: true })
const id = useId()
const open = ref(false)
const query = ref('')
const active = ref(0)
const input = ref<HTMLInputElement | null>(null)
const selected = computed(() => props.options.find((option) => option.id === model.value))
const normalized = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
const filtered = computed(() =>
  props.options.filter((option) =>
    normalized(option.name).includes(normalized(query.value.trim())),
  ),
)
watch(
  () => model.value,
  () => {
    if (!open.value) query.value = selected.value?.name ?? ''
  },
  { immediate: true },
)
watch(
  () => props.options,
  () => {
    if (!open.value) query.value = selected.value?.name ?? ''
  },
)
function show() {
  if (props.disabled || open.value) return
  query.value = ''
  active.value = 0
  open.value = true
  void nextTick(() => input.value?.focus())
}
function onInput() {
  if (props.disabled) return
  open.value = true
  active.value = 0
}
function onFocusOut(event: FocusEvent) {
  const container = event.currentTarget as HTMLElement | null
  if (!container?.contains(event.relatedTarget as Node | null)) close()
}
function choose(option: Option) {
  model.value = option.id
  query.value = option.name
  open.value = false
}
function close() {
  open.value = false
  query.value = selected.value?.name ?? ''
}
function keydown(event: KeyboardEvent) {
  if (props.disabled) return
  if (event.key === 'Escape') {
    event.preventDefault()
    close()
    return
  }
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault()
    if (!open.value) {
      show()
      return
    }
    if (!filtered.value.length) return
    active.value = (active.value + (event.key === 'ArrowDown' ? 1 : -1) + filtered.value.length) % filtered.value.length
    void nextTick(() => document.getElementById(id + '-option-' + active.value)?.scrollIntoView({ block: 'nearest' }))
    return
  }
  if (event.key === 'Enter' && open.value) {
    event.preventDefault()
    const option = filtered.value[active.value]
    if (option) choose(option)
  }
}
</script>
<template>
  <div class="space-y-2">
    <label :for="id" class="block text-sm font-semibold text-slate-700">{{ label }}</label>
    <div
      class="relative"
      @focusout="onFocusOut"
    >
      <div class="relative">
        <input
          :id="id"
          ref="input"
          v-model="query"
          type="text"
          class="field w-full pr-10"
          :placeholder="placeholder"
          :disabled="disabled"
          autocomplete="off"
          role="combobox"
          aria-autocomplete="list"
          :aria-expanded="open"
          :aria-controls="id + '-options'"
          :aria-activedescendant="open && filtered[active] ? id + '-option-' + active : undefined"
          @focus="show"
          @input="onInput"
          @keydown="keydown"
        />
        <button
          type="button"
          tabindex="-1"
          :disabled="disabled"
          aria-label="Mostrar opções"
          class="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-slate-500"
          @mousedown.prevent="open ? close() : show()"
        >
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      </div>
      <div
        v-if="open"
        :id="id + '-options'"
        role="listbox"
        class="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-auto rounded-xl border border-stone-200 bg-white py-1 shadow-xl"
      >
        <button
          v-for="(option, index) in filtered"
          :id="id + '-option-' + index"
          :key="option.id"
          type="button"
          role="option"
          :aria-selected="model === option.id"
          class="block w-full px-4 py-2.5 text-left text-sm hover:bg-orange-50"
          :class="index === active ? 'bg-orange-50 text-orange-800' : 'text-slate-700'"
          @mouseenter="active = index"
          @mousedown.prevent="choose(option)"
        >
          {{ option.name }}
        </button>
        <p v-if="!filtered.length" class="px-4 py-3 text-sm text-slate-500">
          {{ emptyMessage }}
        </p>
      </div>
    </div>
  </div>
</template>
