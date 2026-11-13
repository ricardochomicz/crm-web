import { computed, ref, watch, type Ref } from 'vue'
import { radarApi, type CommercialRadarMember } from '../radarApi'
import { errorMessage } from '@/lib/feedback'

export function useCommercialRadarMembers(
  tenantId: Readonly<Ref<string>>,
  enabled: Readonly<Ref<boolean>>,
) {
  const members = ref<CommercialRadarMember[]>([])
  const selectedMemberId = ref('')
  const loading = ref(false)
  const error = ref('')
  let version = 0

  const options = computed(() => [
    { value: '', label: 'Minhas prioridades' },
    ...members.value.map((member) => ({ value: member.id, label: member.name })),
  ])

  async function load() {
    const current = ++version
    members.value = []
    selectedMemberId.value = ''
    error.value = ''

    if (!enabled.value || !tenantId.value) {
      loading.value = false
      return
    }

    loading.value = true
    try {
      const response = await radarApi.members(tenantId.value)
      if (current === version) members.value = response.data
    } catch (failure) {
      if (current === version) error.value = errorMessage(failure)
    } finally {
      if (current === version) loading.value = false
    }
  }

  watch([tenantId, enabled], () => { void load() }, { immediate: true })

  return { options, selectedMemberId, loading, error, load }
}
