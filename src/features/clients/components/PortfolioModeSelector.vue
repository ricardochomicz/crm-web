<script setup lang="ts">
export type PortfolioMode = 'contracts' | 'orders' | 'renewing'

defineProps<{
  modelValue: PortfolioMode
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [mode: PortfolioMode]
}>()

const modes: { value: PortfolioMode; label: string }[] = [
  { value: 'contracts', label: 'Contratos consolidados' },
  { value: 'orders', label: 'Pedidos históricos' },
  { value: 'renewing', label: 'Em renovação' },
]
</script>

<template>
  <div class="mb-4 space-y-3">
    <div class="flex flex-wrap items-center gap-2" role="group" aria-label="Visualização da carteira">
      <button
        v-for="mode in modes"
        :key="mode.value"
        type="button"
        class="rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
        :class="
          modelValue === mode.value
            ? 'border-slate-900 bg-slate-900 text-white'
            : 'border-stone-200 bg-white text-slate-700 hover:bg-stone-50'
        "
        :aria-pressed="modelValue === mode.value"
        :disabled="disabled"
        @click="emit('update:modelValue', mode.value)"
      >
        {{ mode.label }}
      </button>
    </div>

    <p
      v-if="modelValue === 'orders'"
      class="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
    >
      Estes pedidos ainda são exibidos individualmente. Vincule-os aos contratos pelo cadastro
      do cliente para que apareçam na carteira consolidada. A renovação integral deve ser
      calculada somente após a consolidação.
    </p>
  </div>
</template>
