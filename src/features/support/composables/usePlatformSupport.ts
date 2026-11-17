import { ref } from 'vue'
import { errorMessage } from '@/lib/feedback'
import { platformSupportApi, type PlatformTicket, type SupportSummary, type TicketPage } from '../platformApi'

export function usePlatformSupport() {
  const result = ref<TicketPage | null>(null)
  const summary = ref<SupportSummary | null>(null)
  async function loadSummary() {
    try { summary.value = (await platformSupportApi.summary()).data }
    catch { summary.value = null }
  }
  const selected = ref<PlatformTicket | null>(null)
  const loading = ref(false)
  const busy = ref(false)
  const error = ref('')
  async function load(page = 1, status = '', search = '', priority = '', silent = false) {
    if (!silent) { loading.value = true; error.value = '' }
    try { result.value = await platformSupportApi.list(page, status, search, priority) }
    catch (failure) { if (!silent) error.value = errorMessage(failure) }
    finally { if (!silent) loading.value = false }
  }
  async function open(id: string) {
    busy.value = true
    error.value = ''
    try { selected.value = (await platformSupportApi.show(id)).data }
    catch (failure) { error.value = errorMessage(failure) }
    finally { busy.value = false }
  }
  async function update(data: { status?: string; priority?: string }) {
    if (!selected.value || busy.value) return false
    busy.value = true
    error.value = ''
    try {
      await platformSupportApi.update(selected.value.id, data)
      selected.value = (await platformSupportApi.show(selected.value.id)).data
      return true
    } catch (failure) { error.value = errorMessage(failure); return false }
    finally { busy.value = false }
  }
  async function reply(body: string) {
    if (!selected.value || busy.value) return false
    busy.value = true
    error.value = ''
    try {
      await platformSupportApi.reply(selected.value.id, body)
      selected.value = (await platformSupportApi.show(selected.value.id)).data
      return true
    } catch (failure) { error.value = errorMessage(failure); return false }
    finally { busy.value = false }
  }
  return { result, summary, loadSummary, selected, loading, busy, error, load, open, update, reply }
}
