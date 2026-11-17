import { ref } from 'vue'
import { errorMessage } from '@/lib/feedback'
import { supportApi, type SupportTicket, type SupportTicketInput, type SupportMessage } from '../api'

export function useSupportTickets() {
  const tickets = ref<SupportTicket[]>([])
  const messages = ref<SupportMessage[]>([])
  const selectedTicketId = ref<string | null>(null)
  const messagesLoading = ref(false)
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
  async function openTicket(tenantId: string, ticketId: string) {
    selectedTicketId.value = ticketId
    messages.value = []
    messagesLoading.value = true
    error.value = ''
    try {
      const result = await supportApi.messages(tenantId, ticketId)
      if (selectedTicketId.value === ticketId) messages.value = result.data
    } catch (failure) {
      error.value = errorMessage(failure)
    } finally {
      messagesLoading.value = false
    }
  }
  async function reply(tenantId: string, ticketId: string, body: string): Promise<boolean> {
    if (submitting.value) return false
    submitting.value = true
    error.value = ''
    try {
      const result = await supportApi.reply(tenantId, ticketId, body)
      if (selectedTicketId.value === ticketId) messages.value.push(result.data)
      return true
    } catch (failure) {
      error.value = errorMessage(failure)
      return false
    } finally {
      submitting.value = false
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
  return { tickets, messages, selectedTicketId, messagesLoading, loading, submitting, error, success, load, create, openTicket, reply }
}
