<script setup lang="ts">
import { computed, ref, watch } from 'vue'
const props = withDefaults(defineProps<{ label: string; disabled?: boolean }>(), {
  disabled: false,
})
const model = defineModel<number>({ required: true })
const focused = ref(false)
const text = ref('')
const format = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
const cents = computed(() => Math.round(Number(model.value || 0) * 100))
watch(
  cents,
  () => {
    if (!focused.value) text.value = format(cents.value / 100)
  },
  { immediate: true },
)
function onInput(event: Event) {
  const digits = (event.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 12)
  const value = Number(digits || '0') / 100
  model.value = value
  text.value = format(value)
}
function onFocus(event: FocusEvent) {
  focused.value = true
  ;(event.target as HTMLInputElement).select()
}
function onBlur() {
  focused.value = false
  text.value = format(Number(model.value || 0))
}
</script>
<template>
  <label class="block space-y-2">
    <span class="block text-sm font-semibold text-slate-700">{{ props.label }}</span>
    <input
      :value="text"
      type="text"
      inputmode="numeric"
      autocomplete="off"
      :disabled="props.disabled"
      class="field w-full"
      @input="onInput"
      @focus="onFocus"
      @blur="onBlur"
    />
  </label>
</template>
