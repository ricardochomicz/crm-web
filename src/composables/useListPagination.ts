import { computed, ref, watch, type Ref } from 'vue'

export function useListPagination<T>(rows: Ref<T[]>, perPage = 15) {
  const page = ref(1)
  const total = computed(() => rows.value.length)
  const lastPage = computed(() => Math.max(1, Math.ceil(total.value / perPage)))
  const pageRows = computed(() =>
    rows.value.slice((page.value - 1) * perPage, page.value * perPage),
  )
  watch(
    rows,
    () => {
      page.value = 1
    },
    { flush: 'sync' },
  )
  function changePage(value: number) {
    page.value = Math.max(1, Math.min(lastPage.value, value))
  }
  return { page, total, lastPage, pageRows, changePage }
}
