import { ref, watch, type Ref } from 'vue'
import { productivityApi, type ConsultantRecordType, type ConsultantRecordsPage } from '../api'

export function useConsultantRecords(
  tenantId: Ref<string>,
  consultantId: Ref<string | null>,
  from: Ref<string>,
  to: Ref<string>,
) {
  const tab = ref<ConsultantRecordType>('activities')
  const page = ref(1)
  const records = ref<ConsultantRecordsPage | null>(null)
  const loading = ref(false)
  const error = ref('')
  let version = 0

  async function load() {
    const current = ++version
    records.value = null
    error.value = ''
    if (!consultantId.value || !tenantId.value) { loading.value = false; return }
    loading.value = true
    try {
      const response = await productivityApi.records(tenantId.value, {
        consultant_id: consultantId.value, from: from.value, to: to.value,
        type: tab.value, page: page.value,
      })
      if (current === version) records.value = response
    } catch {
      if (current === version) error.value = 'Não foi possível carregar os registros.'
    } finally {
      if (current === version) loading.value = false
    }
  }
  function selectTab(value: ConsultantRecordType) { tab.value = value; page.value = 1 }
  function goToPage(value: number) {
    if (value < 1 || value > (records.value?.last_page ?? 1)) return
    page.value = value
  }
  watch([tenantId, consultantId, from, to, tab, page], () => { void load() }, { immediate: true })
  return { tab, page, records, loading, error, selectTab, goToPage, load }
}
