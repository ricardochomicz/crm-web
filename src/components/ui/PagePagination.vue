<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from './AppIcon.vue'

const props = withDefaults(
  defineProps<{
    page: number
    lastPage: number
    total: number
    busy?: boolean
    perPage?: number
  }>(),
  { perPage: 15 },
)

const emit = defineEmits<{ change: [page: number] }>()
const safeLastPage = computed(() => Math.max(1, props.lastPage))
const safePage = computed(() => Math.max(1, Math.min(props.page, safeLastPage.value)))
const firstItem = computed(() => (props.total ? (safePage.value - 1) * props.perPage + 1 : 0))
const lastItem = computed(() => Math.min(props.total, safePage.value * props.perPage))
const pages = computed(() => {
  const count = Math.min(5, safeLastPage.value)
  const from = Math.max(1, Math.min(safePage.value - 2, safeLastPage.value - count + 1))
  return Array.from({ length: count }, (_, i) => from + i)
})
function goTo(page: number) {
  if (!props.busy && page >= 1 && page <= safeLastPage.value && page !== safePage.value)
    emit('change', page)
}
</script>

<template>
  <nav
    v-if="total > 0"
    aria-label="Paginação"
    class="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm shadow-sm"
  >
    <p class="text-slate-500" aria-live="polite">
      Exibindo <strong class="text-slate-700">{{ firstItem }}–{{ lastItem }}</strong> de
      <strong class="text-slate-700">{{ total }}</strong> registros
    </p>
    <div class="flex items-center gap-1.5">
      <button
        type="button"
        class="inline-flex size-9 items-center justify-center rounded-lg border border-stone-200 text-slate-600 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
        :disabled="busy || safePage <= 1"
        aria-label="Página anterior"
        title="Página anterior"
        @click="goTo(safePage - 1)"
      >
        <AppIcon name="chevronLeft" class="size-4" />
      </button>
      <button
        v-for="number in pages"
        :key="number"
        type="button"
        class="size-9 rounded-lg border text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
        :class="
          number === safePage
            ? 'border-orange-500 bg-orange-50 text-orange-700'
            : 'border-stone-200 text-slate-600 hover:bg-stone-50'
        "
        :disabled="busy"
        :aria-label="`Página ${number}`"
        :aria-current="number === safePage ? 'page' : undefined"
        @click="goTo(number)"
      >
        {{ number }}
      </button>
      <button
        type="button"
        class="inline-flex size-9 items-center justify-center rounded-lg border border-stone-200 text-slate-600 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
        :disabled="busy || safePage >= safeLastPage"
        aria-label="Próxima página"
        title="Próxima página"
        @click="goTo(safePage + 1)"
      >
        <AppIcon name="chevronRight" class="size-4" />
      </button>
    </div>
  </nav>
</template>
