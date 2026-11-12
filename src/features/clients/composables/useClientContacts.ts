import { ref, type Ref } from 'vue'
import { toast } from '@/services/toast'
import { digits } from '@/lib/masks'
import { clientsApi, type Client, type Contact, type ContactInput } from '../api'
import { blankContact } from '../utils/clientFormDefaults'

interface ClientContactsDependencies {
  tenantId: Readonly<Ref<string>>
  selected: Ref<Client | null>
  busy: Ref<boolean>
  reloadClients: () => Promise<void>
  showDetails: (clientId: string) => Promise<void>
  resetDetailsTab: () => void
}

export function useClientContacts({
  tenantId,
  selected,
  busy,
  reloadClients,
  showDetails,
  resetDetailsTab,
}: ClientContactsDependencies) {
  const contactBlank = blankContact
  const contact = ref<ContactInput>(contactBlank())
  const contactEditing = ref('')
  const contactModal = ref(false)
  const pendingContactClientId = ref<string | null>(null)

  function editContact(value?: Contact) {
    contactEditing.value = value?.id ?? ''
    contact.value = value
      ? {
          name: value.name,
          cpf: value.cpf,
          birth_date: value.birth_date,
          position: value.position,
          phone: value.phone,
          email: value.email,
          is_primary: value.is_primary,
          is_active: value.is_active,
          portal_access_enabled: value.portal_access_enabled ?? false,
          notes: value.notes,
        }
      : contactBlank()
    contactModal.value = true
  }

  async function saveContact() {
    if (!selected.value || busy.value) return

    const clientId = selected.value.id
    const currentTenantId = tenantId.value
    busy.value = true

    try {
      await clientsApi.contact(
        currentTenantId,
        clientId,
        { ...contact.value, phone: digits(contact.value.phone, 11) || null },
        contactEditing.value || undefined,
      )

      const updated = (await clientsApi.show(currentTenantId, clientId)).data
      if (currentTenantId !== tenantId.value) return

      if (pendingContactClientId.value && updated.contact_pending) {
        toast.error('Cadastre um contato principal ativo com nome, cargo e telefone ou e-mail.')
        return
      }

      const wasRequiredContact = !!pendingContactClientId.value
      pendingContactClientId.value = null
      contactModal.value = false

      if (wasRequiredContact) {
        selected.value = null
        resetDetailsTab()
        toast.success('Pessoa de contato salva. Cadastro do cliente concluído.')
        await reloadClients()
      } else {
        toast.success('Contato salvo.')
        await showDetails(clientId)
      }
    } catch (error) {
      if (currentTenantId === tenantId.value) {
        toast.error(error instanceof Error ? error.message : 'Erro ao salvar contato.')
      }
    } finally {
      busy.value = false
    }
  }

  return {
    contactBlank,
    contact,
    contactEditing,
    contactModal,
    pendingContactClientId,
    editContact,
    saveContact,
  }
}
