import { computed, ref, type Ref } from 'vue'
import type { OpportunityInput } from '../api'
import type { Product } from '@/features/products/api'

type Line = OpportunityInput['items'][number]
type BulkChanges = { order_type_id?: string; product_id?: string; monthly_unit_amount?: number }

/** Owns line selection, filtering and bulk editing independently of the dialog UI. */
export function useOpportunityLineSelection(
  form: Ref<OpportunityInput>,
  filteredProducts: Readonly<Ref<Product[]>>,
) {
  const editingLineIndex = ref<number | null>(null)
  const selectedLineIndices = ref<number[]>([])
  const lineSearch = ref('')
  const showBulkEdit = ref(false)

  const filteredLineIndices = computed(() => {
    const query = lineSearch.value.replace(/\D/g, '')
    return form.value.items.map((_, index) => index).filter(index =>
      !query || (form.value.items[index]?.line_number ?? '').replace(/\D/g, '').includes(query),
    )
  })
  const allSelected = computed(() =>
    form.value.items.length > 0 && selectedLineIndices.value.length === form.value.items.length,
  )
  const selectedItems = computed(() =>
    selectedLineIndices.value.map(index => form.value.items[index]).filter((item): item is Line => !!item),
  )
  const editingLine = computed(() =>
    editingLineIndex.value === null ? null : form.value.items[editingLineIndex.value] ?? null,
  )
  const otherNumbers = computed(() =>
    form.value.items.filter((_, index) => index !== editingLineIndex.value)
      .map(item => (item.line_number ?? '').replace(/\D/g, '')).filter(Boolean),
  )

  function toggleLine(index: number, checked: boolean) {
    selectedLineIndices.value = checked
      ? [...selectedLineIndices.value.filter(i => i !== index), index]
      : selectedLineIndices.value.filter(i => i !== index)
  }
  function toggleAll(checked: boolean) {
    selectedLineIndices.value = checked ? form.value.items.map((_, index) => index) : []
  }
  function removeLine(index: number) {
    form.value.items.splice(index, 1)
    selectedLineIndices.value = selectedLineIndices.value.filter(i => i !== index).map(i => i > index ? i - 1 : i)
  }
  function applyBulk(changes: BulkChanges) {
    const product = changes.product_id ? filteredProducts.value.find(p => p.id === changes.product_id) : null
    for (const index of selectedLineIndices.value) {
      const item = form.value.items[index]
      if (!item) continue
      form.value.items.splice(index, 1, { ...item, ...changes, ...(product ? { description: product.name } : {}) })
    }
    selectedLineIndices.value = []
    showBulkEdit.value = false
  }
  function updateLine(item: Line) {
    if (editingLineIndex.value !== null) form.value.items.splice(editingLineIndex.value, 1, item)
    editingLineIndex.value = null
  }
  function resetSelection() {
    editingLineIndex.value = null
    selectedLineIndices.value = []
    showBulkEdit.value = false
  }

  return {
    editingLineIndex, selectedLineIndices, lineSearch, filteredLineIndices, showBulkEdit,
    allSelected, selectedItems, editingLine, otherNumbers,
    toggleLine, toggleAll, removeLine, applyBulk, updateLine, resetSelection,
  }
}
