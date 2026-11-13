<script setup lang="ts">
import type { Opportunity } from '../api'
import OpportunityRecoverDialog from './OpportunityRecoverDialog.vue'
import OpportunityResendDialog from './OpportunityResendDialog.vue'
import OpportunityLostDialog from './OpportunityLostDialog.vue'
import OpportunitySaleDialog from './OpportunitySaleDialog.vue'

defineProps<{
  recoverCandidate: Opportunity | null
  recoveringId: string | null
  resendCandidate: Opportunity | null
  movingId: string | null
  lostCandidate: Opportunity | null
  lostReason: string
  markingLost: boolean
  saleCandidate: Opportunity | null
  confirmingSale: boolean
  money: (value: string) => string
}>()

const emit = defineEmits<{
  'close-recover': []
  recover: []
  'close-resend': []
  resend: []
  'close-lost': []
  'update:lostReason': [value: string]
  'mark-lost': []
  'close-sale': []
  'confirm-sale': []
}>()
</script>

<template>
  <OpportunityRecoverDialog
    :opportunity="recoverCandidate"
    :busy="!!recoveringId"
    @close="emit('close-recover')"
    @confirm="emit('recover')"
  />
  <OpportunityResendDialog
    :opportunity="resendCandidate"
    :busy="!!movingId"
    :money="money"
    @close="emit('close-resend')"
    @confirm="emit('resend')"
  />
  <OpportunityLostDialog
    :opportunity="lostCandidate"
    :busy="markingLost"
    :reason="lostReason"
    @update:reason="emit('update:lostReason', $event)"
    @close="emit('close-lost')"
    @confirm="emit('mark-lost')"
  />
  <OpportunitySaleDialog
    :opportunity="saleCandidate"
    :busy="confirmingSale"
    :money="money"
    @close="emit('close-sale')"
    @confirm="emit('confirm-sale')"
  />
</template>
