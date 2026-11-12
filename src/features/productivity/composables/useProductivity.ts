import { ref, watch, type Ref } from 'vue'
import { productivityApi, type ProductivityResponse } from '../api'

function localDate(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function useProductivity(tenantId: Ref<string>) {
  const today = new Date()
  const first = new Date(today.getFullYear(), today.getMonth(), 1)
  const from = ref(localDate(first))
  const to = ref(localDate(today))
  const consultantId = ref('')
  const appliedPeriod = ref({ from: from.value, to: to.value, consultantId: '' })
  const data = ref<ProductivityResponse | null>(null)
  const consultants = ref<{ id: string; name: string }[]>([])
  const loading = ref(false)
  const error = ref('')
  let version = 0

  async function search() {
    const current = ++version
    data.value = null
    if (!tenantId.value) return
    if (!from.value || !to.value || from.value > to.value) {
      error.value = 'Informe um período válido.'
      return
    }
    loading.value = true
    error.value = ''
    try {
      const result = await productivityApi.overview(tenantId.value, {
        from: from.value, to: to.value, ...(consultantId.value ? { consultant_id: consultantId.value } : {}),
      })
      if (current === version) {
        data.value = result
        appliedPeriod.value = { from: from.value, to: to.value, consultantId: consultantId.value }
        if (!consultantId.value) consultants.value = result.data.map(({ id, name }) => ({ id, name }))
      }
    } catch {
      if (current === version) error.value = 'Não foi possível carregar o painel de produtividade.'
    } finally {
      if (current === version) loading.value = false
    }
  }

  function clear() {
    from.value = localDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
    to.value = localDate(new Date())
    consultantId.value = ''
    void search()
  }

  watch(tenantId, () => { consultantId.value = ''; consultants.value = []; void search() }, { immediate: true })
  return { from, to, appliedPeriod, consultantId, data, loading, error, consultants, search, clear }
}
