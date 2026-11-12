import { computed, ref, type Ref } from 'vue'
import type { ProductivityRow } from '../api'

export function useConsultantDetails(rows: Ref<ProductivityRow[]>) {
  const selectedId = ref<string | null>(null)
  const selected = computed(() => rows.value.find(row => row.id === selectedId.value) ?? null)
  function openConsultant(id: string) { selectedId.value = id }
  function closeConsultant() { selectedId.value = null }
  return { selected, openConsultant, closeConsultant }
}
