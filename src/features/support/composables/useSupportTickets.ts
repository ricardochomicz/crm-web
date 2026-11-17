import { ref } from 'vue'
import { errorMessage } from '@/lib/feedback'
import { supportApi, type SupportTicket, type SupportTicketInput } from '../api'

export function useSupportTickets() {
  const tickets = ref<SupportTicket[]>([])
  const loading = ref(false)
  const submitting = ref(false)
  const error = ref('')
  const success = ref('')
  async function load(tenantId: string) {
    loading.value = true
    error.value = ''
    try {
      tickets.value = (await supportApi.list(tenantId)).data
    } catch (failure) {
      error.value = errorMessage(failure)
    } finally {
      loading.value = false
    }
  }
  async function create(tenantId: string, payload: SupportTicketInput): Promise<boolean> {
    if (submitting.value) return false
    submitting.value = true
    error.value = ''
    success.value = ''
    try {
      const response = await supportApi.create(tenantId, payload)
      tickets.value = [response.data, ...tickets.value]
      success.value = `Chamado aberto. Protocolo: ${response.data.id}`
      return true
    } catch (failure) {
      error.value = errorMessage(failure)
      return false
    } finally {
      submitting.value = false
    }
  }
  return { tickets, loading, submitting, error, success, load, create }
}
