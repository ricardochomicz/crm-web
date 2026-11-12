import { ref, type Ref } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from '@/services/toast'
import { clientsApi, type PortfolioContract } from '../api'

export function usePortfolioRenewal(
  tenantId: Readonly<Ref<string>>,
  reload: () => Promise<void>,
) {
  const router = useRouter()
  const renewing = ref<PortfolioContract | null>(null)
  const savingRenewal = ref(false)

  function openRenewal(contract: PortfolioContract) {
    renewing.value = contract
  }

  function closeRenewal() {
    if (!savingRenewal.value) {
      renewing.value = null
    }
  }

  async function confirmRenewal() {
    const contract = renewing.value
    if (!contract?.order_id || savingRenewal.value || !contract.lines?.length) return

    const id = tenantId.value
    savingRenewal.value = true

    try {
      await clientsApi.renewHistoricalOrder(
        id,
        contract.order_id,
        contract.lines.map((line) => line.id),
      )

      renewing.value = null
      toast.success('Oportunidade de renovação criada com sucesso.')
      await reload()
      await router.push(`/empresas/${id}/oportunidades`)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Não foi possível iniciar a renovação.',
      )
    } finally {
      savingRenewal.value = false
    }
  }

  return {
    renewing,
    savingRenewal,
    openRenewal,
    closeRenewal,
    confirmRenewal,
  }
}
