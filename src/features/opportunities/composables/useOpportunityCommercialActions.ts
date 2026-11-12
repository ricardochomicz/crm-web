import { ref, type Ref } from 'vue'
import { opportunitiesApi, type FunnelStage, type Opportunity } from '../api'
import { errorMessage } from '@/lib/feedback'
import { toast } from '@/services/toast'

type ActionsContext = {
  tenantId: Readonly<Ref<string>>
  canEdit: Readonly<Ref<boolean>>
  stages: Readonly<Ref<FunnelStage[]>>
  movingId: Ref<string | null>
  reload: () => void
  refreshOverview: () => void
  switchToOpen: () => void
}

/** Commercial actions and their confirmation state; independent of the page view. */
export function useOpportunityCommercialActions(context: ActionsContext) {
  const recoveringId = ref<string | null>(null)
  const resendCandidate = ref<Opportunity | null>(null)
  const confirmingSale = ref(false)
  const saleCandidate = ref<Opportunity | null>(null)
  const lostCandidate = ref<Opportunity | null>(null)
  const lostReason = ref('')
  const markingLost = ref(false)

  async function recover(item: Opportunity) {
    if (!context.canEdit.value || item.status !== 'lost' || recoveringId.value) return
    if (!window.confirm(`Recuperar "${item.title}"? Uma nova oportunidade será criada com os mesmos itens e valores.`)) return
    recoveringId.value = item.id
    try {
      const result = await opportunitiesApi.recover(context.tenantId.value, item.id)
      toast.success(`Negociação recuperada: ${result.data.code}`)
      context.switchToOpen()
      context.refreshOverview()
    } catch (exception) {
      toast.error(errorMessage(exception))
    } finally {
      recoveringId.value = null
    }
  }

  function askResendToBackoffice(item: Opportunity) {
    if (!context.canEdit.value || context.movingId.value ||
      !/para correção/i.test(item.stage?.name || context.stages.value.find(s => s.id === item.funnel_stage_id)?.name || '')) return
    resendCandidate.value = item
  }

  async function resendToBackoffice() {
    const item = resendCandidate.value
    if (!item || context.movingId.value) return
    context.movingId.value = item.id
    try {
      await opportunitiesApi.resendToBackoffice(context.tenantId.value, item.id)
      resendCandidate.value = null
      toast.success('Pedido corrigido e reenviado ao Backoffice.')
      context.reload()
      context.refreshOverview()
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      context.movingId.value = null
    }
  }

  function askMarkLost(item: Opportunity) {
    if (!context.canEdit.value || item.status !== 'open') return
    lostReason.value = ''
    lostCandidate.value = item
  }

  async function markLost() {
    const item = lostCandidate.value
    const reason = lostReason.value.trim()
    if (!item || markingLost.value) return
    if (reason.length < 3) {
      toast.error('Informe o motivo da perda (mínimo de 3 caracteres).')
      return
    }
    markingLost.value = true
    try {
      await opportunitiesApi.markLost(context.tenantId.value, item.id, reason)
      lostCandidate.value = null
      toast.success('Oportunidade marcada como perdida.')
      context.reload()
      context.refreshOverview()
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      markingLost.value = false
    }
  }

  function askConfirmSale(item: Opportunity) {
    if (!context.canEdit.value || item.status !== 'open') return
    saleCandidate.value = item
  }

  async function confirmSale() {
    const item = saleCandidate.value
    if (!item || confirmingSale.value) return
    confirmingSale.value = true
    try {
      await opportunitiesApi.confirmSale(context.tenantId.value, item.id)
      saleCandidate.value = null
      toast.success('Venda confirmada. Pedido comercial criado.')
      context.reload()
      context.refreshOverview()
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      confirmingSale.value = false
    }
  }

  return {
    recoveringId, recover, resendCandidate, askResendToBackoffice, resendToBackoffice,
    confirmingSale, saleCandidate, askConfirmSale, confirmSale,
    lostCandidate, lostReason, markingLost, askMarkLost, markLost,
  }
}
