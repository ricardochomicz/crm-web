import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { tenantApi } from '@/features/tenants/api'
import type { Tenant } from '@/features/tenants/types'
import { commissionsApi, type MyCommissionStatement } from '../api'

export function useMyCommissions() {
  const route = useRoute()
  const tenantId = computed(() => String(route.params.tenantId))
  const tenant = ref<Tenant>()
  const month = ref(new Date().toISOString().slice(0, 7))
  const status = ref('')
  const page = ref(1)
  const data = ref<MyCommissionStatement | null>(null)
  const loading = ref(false)
  const error = ref('')
  let version = 0

  async function load() {
    const id = ++version
    loading.value = true
    error.value = ''
    data.value = null
    try {
      const [year, monthNumber] = month.value.split('-').map(Number)
      if (!year || !monthNumber || monthNumber < 1 || monthNumber > 12) throw new Error('Período inválido.')
      const from = month.value + '-01'
      const to = new Date(Date.UTC(year, monthNumber, 0)).toISOString().slice(0, 10)
      const [company, result] = await Promise.all([
        tenantApi.show(tenantId.value),
        commissionsApi.mine(tenantId.value, { from, to, status: status.value, page: page.value }),
      ])
      if (id !== version) return
      tenant.value = company.data
      data.value = result.data
    } catch {
      if (id === version) error.value = 'Não foi possível consultar suas comissões.'
    } finally {
      if (id === version) loading.value = false
    }
  }
  function search() { page.value = 1; void load() }
  function clear() { status.value = ''; month.value = new Date().toISOString().slice(0, 7); search() }
  function changePage(next: number) { page.value = next; void load() }
  watch(tenantId, () => { tenant.value = undefined; page.value = 1; void load() }, { immediate: true })
  return { tenant, month, status, page, data, loading, error, load, search, clear, changePage }
}
