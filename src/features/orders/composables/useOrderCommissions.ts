import { computed, onBeforeUnmount, ref, watch, type Ref } from 'vue'
import { errorMessage } from '@/lib/feedback'
import { toast } from '@/services/toast'
import {
  orderCommissionsApi,
  commissionRoles,
  type CommissionPage,
  type ParticipantInput,
  type ParticipantOptions,
  type CommissionRole,
} from '../commissions-api'

export function useOrderCommissions(
  tenantId: Ref<string>,
  orderId: Ref<string>,
  writable: Ref<boolean>,
) {
  const result = ref<CommissionPage | null>(null)
  const loading = ref(false)
  const error = ref('')
  const page = ref(1)
  const revision = ref('')
  const status = ref('')
  const modalOpen = ref(false)
  const saving = ref(false)
  const optionsLoading = ref(false)
  const formError = ref('')
  const reason = ref('')
  const editParticipants = ref(false)
  const participants = ref<ParticipantInput[]>([])
  const options = ref<ParticipantOptions | null>(null)
  let sequence = 0
  let context = 0
  let optionsSequence = 0
  const roles = Object.entries(commissionRoles).map(([value, label]) => ({
    value: value as CommissionRole,
    label,
  }))
  const revisions = computed(() =>
    Array.from({ length: result.value?.meta.current_revision ?? 0 }, (_, i) =>
      String(i + 1),
    ).reverse(),
  )
  const valid = computed(
    () =>
      reason.value.trim().length >= 10 &&
      (!editParticipants.value ||
        (participants.value.length > 0 &&
          new Set(participants.value.map((p) => p.role)).size === participants.value.length &&
          participants.value.every((p) =>
            internal(p.role) ? !!p.tenant_user_id : !!p.commercial_participant_id,
          ) &&
          (!options.value?.consultant_id ||
            participants.value.some(
              (p) => p.role === 'CONSULTANT' && p.tenant_user_id === options.value?.consultant_id,
            )))),
  )
  function internal(role: CommissionRole) {
    return ['CONSULTANT', 'SUPERVISOR', 'MANAGER'].includes(role)
  }
  function memberOptions(participant: ParticipantInput) {
    const available = internal(participant.role)
      ? (options.value?.members ?? [])
      : (options.value?.externals.filter((p) => p.role === participant.role) ?? [])
    const selected = participant.tenant_user_id ?? participant.commercial_participant_id
    if (selected && !available.some((p) => p.id === selected)) {
      const original = options.value?.participants.find(
        (p) => p.tenant_user_id === selected || p.commercial_participant_id === selected,
      )
      return [
        ...available,
        { id: selected, name: `${original?.participant_name ?? 'Participante'} (indisponível)` },
      ]
    }
    return available
  }
  async function load() {
    const current = ++sequence
    loading.value = true
    error.value = ''
    try {
      const response = await orderCommissionsApi.list(
        tenantId.value,
        orderId.value,
        page.value,
        revision.value,
        status.value,
      )
      if (current === sequence) result.value = response
    } catch (failure) {
      if (current === sequence) {
        error.value = errorMessage(failure)
        result.value = null
      }
    } finally {
      if (current === sequence) loading.value = false
    }
  }
  async function openRevision() {
    if (!writable.value || saving.value || optionsLoading.value) return
    const current = ++optionsSequence
    reason.value = ''
    editParticipants.value = false
    formError.value = ''
    options.value = null
    modalOpen.value = true
    optionsLoading.value = true
    try {
      const response = await orderCommissionsApi.options(tenantId.value, orderId.value)
      if (current !== optionsSequence) return
      options.value = response.data
      participants.value = response.data.participants.map(
        ({ role, tenant_user_id, commercial_participant_id }) => ({
          role,
          tenant_user_id,
          commercial_participant_id,
        }),
      )
    } catch (failure) {
      if (current === optionsSequence) formError.value = errorMessage(failure)
    } finally {
      if (current === optionsSequence) optionsLoading.value = false
    }
  }
  function addParticipant() {
    const role = roles.find((r) => !participants.value.some((p) => p.role === r.value))?.value
    if (role)
      participants.value.push({
        role,
        tenant_user_id: role === 'CONSULTANT' ? (options.value?.consultant_id ?? null) : null,
        commercial_participant_id: null,
      })
  }
  function setRole(participant: ParticipantInput) {
    participant.tenant_user_id =
      participant.role === 'CONSULTANT' ? (options.value?.consultant_id ?? null) : null
    participant.commercial_participant_id = null
  }
  async function save() {
    if (!writable.value || !valid.value || saving.value || optionsLoading.value || !options.value)
      return
    const current = context
    saving.value = true
    formError.value = ''
    try {
      await orderCommissionsApi.revise(
        tenantId.value,
        orderId.value,
        reason.value.trim(),
        editParticipants.value ? participants.value : undefined,
      )
      if (current !== context) return
      modalOpen.value = false
      toast.success('Revisão registrada. Consulte os valores e eventuais pendências.')
      if (revision.value || status.value || page.value !== 1) {
        revision.value = ''
        status.value = ''
        page.value = 1
      } else await load()
    } catch (failure) {
      if (current === context) formError.value = errorMessage(failure)
    } finally {
      if (current === context) saving.value = false
    }
  }
  watch(
    [revision, status],
    () => {
      page.value = 1
    },
    { flush: 'sync' },
  )
  watch(
    [tenantId, orderId],
    () => {
      context++
      optionsSequence++
      sequence++
      result.value = null
      modalOpen.value = false
      optionsLoading.value = false
      saving.value = false
      revision.value = ''
      status.value = ''
      page.value = 1
    },
    { flush: 'sync' },
  )
  watch([tenantId, orderId, page, revision, status], () => void load(), { immediate: true })
  onBeforeUnmount(() => {
    context++
    sequence++
    optionsSequence++
  })
  return {
    result,
    loading,
    error,
    page,
    revision,
    status,
    modalOpen,
    saving,
    optionsLoading,
    formError,
    reason,
    editParticipants,
    participants,
    options,
    roles,
    revisions,
    valid,
    internal,
    memberOptions,
    load,
    openRevision,
    addParticipant,
    setRole,
    save,
  }
}
