import { computed, onMounted, reactive, ref } from 'vue'
import { useListFilters } from '@/composables/useListFilters'
import { operatorsApi, type Operator } from '../api'
import { errorMessage } from '@/lib/feedback'
import { toast } from '@/services/toast'

export function usePlatformOperators() {
  const operators = ref<Operator[]>([])
  const loading = ref(true)
  const busy = ref(false)
  const creating = ref(false)
  const error = ref('')
  const searchFilter = ref('')
  const statusFilter = ref('')
  const {
    applied,
    apply: applyFilters,
    clear: clearFilters,
  } = useListFilters({ searchFilter, statusFilter })
  const form = reactive({ name: '', slug: '' })
  const editing = ref<Operator | null>(null)
  const editForm = reactive({ name: '', slug: '' })
  const filteredOperators = computed(() =>
    operators.value.filter((op) => {
      const query = applied.value.searchFilter.trim().toLowerCase()
      if (query && !op.name.toLowerCase().includes(query) && !op.slug.toLowerCase().includes(query))
        return false
      if (applied.value.statusFilter === 'active' && !op.is_active) return false
      if (applied.value.statusFilter === 'inactive' && op.is_active) return false
      return true
    }),
  )

  function edit(operator: Operator) {
    if (busy.value) return
    editing.value = operator
    editForm.name = operator.name
    editForm.slug = operator.slug
  }
  function closeEdit() {
    if (!busy.value) editing.value = null
  }
  async function load() {
    loading.value = true
    error.value = ''
    try {
      operators.value = (await operatorsApi.catalog()).data
    } catch (failure) {
      error.value = errorMessage(failure)
    } finally {
      loading.value = false
    }
  }
  async function saveEdit() {
    if (!editing.value || busy.value) return
    busy.value = true
    try {
      await operatorsApi.update(editing.value.id, {
        name: editForm.name.trim(),
        slug: editForm.slug.trim().toLowerCase(),
      })
      editing.value = null
      toast.success('Operadora atualizada.')
      await load()
    } catch (failure) {
      toast.error(errorMessage(failure))
    } finally {
      busy.value = false
    }
  }
  async function create() {
    if (busy.value) return
    busy.value = true
    try {
      await operatorsApi.create({
        name: form.name.trim(),
        slug: form.slug.trim().toLowerCase(),
      })
      creating.value = false
      form.name = ''
      form.slug = ''
      toast.success('Operadora cadastrada.')
      await load()
    } catch (failure) {
      toast.error(errorMessage(failure))
    } finally {
      busy.value = false
    }
  }
  async function toggle(operator: Operator) {
    if (busy.value) return
    busy.value = true
    try {
      await operatorsApi.update(operator.id, { is_active: !operator.is_active })
      toast.success('Situação da operadora atualizada.')
      await load()
    } catch (failure) {
      toast.error(errorMessage(failure))
    } finally {
      busy.value = false
    }
  }
  onMounted(() => {
    void load()
  })
  return {
    operators,
    loading,
    busy,
    creating,
    error,
    searchFilter,
    statusFilter,
    form,
    editing,
    editForm,
    filteredOperators,
    applyFilters,
    clearFilters,
    edit,
    closeEdit,
    saveEdit,
    load,
    create,
    toggle,
  }
}
