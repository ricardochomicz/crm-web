import { computed, ref, onMounted } from 'vue'
import { useListPagination } from '@/composables/useListPagination'
import { useListFilters } from '@/composables/useListFilters'
import { clientsApi, type Classification, type ClassificationInput, type RuleInput } from '../api'
import { request } from '@/lib/http'
import { toast } from '@/services/toast'

export function useAdminClassificationsPage() {
const rows = ref<Classification[]>([]),
  operators = ref<{ id: number; name: string }[]>([]),
  loading = ref(true),
  busy = ref(false),
  error = ref('')
const form = ref<ClassificationInput>({
  operator_id: 0,
  code: '',
  name: '',
  description: null,
  is_active: true,
  sort_order: 0,
})
const months = ref(21)
const editing = ref<number | null>(null),
  modal = ref(false),
  ruleFor = ref<Classification | null>(null)
const rule = ref<RuleInput>({
  minimum_months: 18,
  valid_from: new Date().toISOString().slice(0, 10),
  valid_until: null,
  is_active: true,
  notes: null,
})
const ruleEditing = ref<string | null>(null)
const filter = ref('')
const { applied, apply: applyFilters, clear: clearFilters } = useListFilters({ filter })
const filtered = computed(() =>
  rows.value.filter((c) => !applied.value.filter || String(c.operator_id) === applied.value.filter),
)
async function load() {
  loading.value = true
  error.value = ''
  try {
    const [r, o] = await Promise.all([
      clientsApi.globalClassifications(),
      request<{ data: { id: number; name: string }[] }>('/api/v1/admin/operators'),
    ])
    rows.value = r.data
    operators.value = o.data
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Erro ao carregar.'
  } finally {
    loading.value = false
  }
}
function edit(c?: Classification) {
  editing.value = c?.id ?? null
  months.value = c?.rules.find((rule) => rule.is_active && !rule.valid_until)?.minimum_months ?? c?.rules.find((rule) => rule.is_active)?.minimum_months ?? 21
  form.value = c
    ? {
        operator_id: c.operator_id,
        code: c.code,
        name: c.name,
        description: c.description,
        is_active: c.is_active,
        sort_order: c.sort_order,
      }
    : {
        operator_id: operators.value[0]?.id ?? 0,
        code: '',
        name: '',
        description: null,
        is_active: true,
        sort_order: 0,
      }
  modal.value = true
}
async function save() {
  busy.value = true
  try {
    if (!Number.isInteger(months.value) || months.value < 1 || months.value > 1200) {
      toast.error('Informe um prazo válido em meses.')
      return
    }

    const classificationCode = form.value.name.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '-')
    const payload = { ...form.value, code: editing.value ? form.value.code : classificationCode }
    if (!payload.code) {
      toast.error('Informe o nome da classificação.')
      return
    }

    const current = rows.value.find((item) => item.id === editing.value)
    const activeRule = current?.rules.find((item) => item.is_active && !item.valid_until)
    if (activeRule && activeRule.minimum_months !== months.value) {
      toast.error('Para alterar um prazo vigente, utilize a ação de regras, preservando o histórico.')
      return
    }

    const response = await clientsApi.saveGlobalClassification(payload, editing.value ?? undefined)
    const classificationId = editing.value ?? response.data.id
    if (!activeRule) {
      await clientsApi.addGlobalRule(classificationId, {
        minimum_months: months.value,
        valid_from: new Date().toISOString().slice(0, 10),
        valid_until: null,
        is_active: true,
        notes: null,
      })
    }
    modal.value = false
    toast.success('Classificação global salva.')
    await load()
  } catch (e) {
    toast.error(e instanceof Error ? e.message : 'Erro ao salvar.')
  } finally {
    busy.value = false
  }
}
function addRule(c: Classification) {
  ruleEditing.value = null
  ruleFor.value = c
  rule.value = {
    minimum_months: 18,
    valid_from: new Date().toISOString().slice(0, 10),
    valid_until: null,
    is_active: true,
    notes: null,
  }
}
function editRule(c: Classification, r: Classification['rules'][number]) {
  ruleFor.value = c
  ruleEditing.value = r.id
  rule.value = {
    minimum_months: r.minimum_months,
    valid_from: r.valid_from,
    valid_until: r.valid_until,
    is_active: r.is_active,
    notes: r.notes,
  }
}
async function saveRule() {
  if (!ruleFor.value) return
  busy.value = true
  try {
    await clientsApi.addGlobalRule(ruleFor.value.id, rule.value, ruleEditing.value ?? undefined)
    ruleFor.value = null
    toast.success('Regra global salva.')
    await load()
  } catch (e) {
    toast.error(e instanceof Error ? e.message : 'Erro ao salvar regra.')
  } finally {
    busy.value = false
  }
}
onMounted(load)
const { page, total, lastPage, pageRows, changePage } = useListPagination(filtered)

return { rows, operators, loading, busy, error, form, months, editing, modal, ruleFor, rule, ruleEditing, filter, filtered, load, edit, save, addRule, editRule, saveRule, page, total, lastPage, pageRows, changePage, applyFilters, clearFilters }
}
