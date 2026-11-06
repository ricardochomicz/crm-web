import { ref, type Ref } from 'vue'

export function useListFilters<T extends Record<string, Ref<string>>>(fields: T) {
  const snapshot = () =>
    Object.fromEntries(
      Object.entries(fields).map(([key, field]) => [key, field.value.trim()]),
    ) as Record<keyof T, string>
  const applied = ref(snapshot())
  function apply() {
    applied.value = snapshot()
  }
  function clear() {
    Object.values(fields).forEach((field) => {
      field.value = ''
    })
    apply()
  }
  return { applied, apply, clear }
}
