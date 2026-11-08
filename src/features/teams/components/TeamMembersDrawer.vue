<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { toast } from '@/services/toast'
import AppDialog from '@/components/ui/AppDialog.vue'
import AsyncNotice from '@/components/ui/AsyncNotice.vue'
import PagePagination from '@/components/ui/PagePagination.vue'
import SearchSelect from '@/components/ui/SearchSelect.vue'
import { roleLabels } from '@/features/tenants/types'
import { errorMessage } from '@/lib/feedback'
import { teamsApi } from '../api'
import type { Team, TeamMember } from '../types'
import type { Page } from '@/features/tenants/types'

const props = defineProps<{
  tenantId: string
  team: Team | null
  allMembers: { id: string; name: string | null; email: string | null; status: string; role: string; role_name?: string | null }[]
  canManage: boolean
}>()

const emit = defineEmits<{ close: []; changed: [] }>()
const selectedMemberId = ref('')
const saving = ref(false)
const actionError = ref('')
const assignedIds = ref(new Set<string>())
const availableMembers = computed(() => props.allMembers
  .filter(m => m.status === 'ACTIVE' && m.role_name?.trim().toLocaleLowerCase('pt-BR') === 'consultor' && !assignedIds.value.has(m.id))
  .map(m => ({ value: m.id, label: `${m.name || m.email} — ${m.email || ''}` })))
async function changeMember(membershipId: string, teamId: string | null) {
  if (!props.team || !props.canManage || saving.value) return
  saving.value = true
  actionError.value = ''
  try {
    await teamsApi.assignMember(props.tenantId, membershipId, teamId)
    toast.success(teamId ? 'Membro vinculado à equipe.' : 'Membro removido da equipe.')
    selectedMemberId.value = ''
    await load(1)
    emit('changed')
  } catch (e) { actionError.value = errorMessage(e) }
  finally { saving.value = false }
}


const page = ref(1)
const result = ref<Page<TeamMember>>()
const loading = ref(false)
const loadError = ref('')

watch(
  () => props.team,
  async (team) => {
    if (!team) return
    page.value = 1
    selectedMemberId.value = ''
    result.value = undefined
    await load()
  },
)

async function load(nextPage = page.value) {
  if (!props.team) return
  loading.value = true
  loadError.value = ''
  page.value = nextPage
  try {
    result.value = await teamsApi.members(props.tenantId, props.team.id, page.value)
    const ids = new Set<string>()
    for (let p = 1; p <= result.value.last_page; p++) {
      const data = p === page.value ? result.value : await teamsApi.members(props.tenantId, props.team.id, p)
      data.data.forEach(member => ids.add(member.id))
    }
    assignedIds.value = ids
  } catch (failure) {
    loadError.value = errorMessage(failure)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AppDialog
    :open="!!team"
    :title="team ? `Membros de ${team.name}` : 'Membros'"
    drawer
    @close="$emit('close')"
  >
    <AsyncNotice :loading="loading && !result" :error="loadError" @retry="load()" />

    <div v-if="canManage && team" class="mb-5 space-y-3 rounded-xl border border-stone-200 bg-stone-50 p-4">
      <p class="text-sm font-semibold text-slate-800">Adicionar membro à equipe</p>
      <label class="block text-xs font-medium text-slate-600">Consultor</label>
      <SearchSelect v-model="selectedMemberId" :options="availableMembers" placeholder="Busque um consultor por nome ou e-mail" :disabled="saving || loading" />
      <p v-if="!loading && !availableMembers.length" class="text-xs text-slate-500">Nenhum consultor disponível para adicionar à equipe.</p>
      <p class="text-xs text-slate-500">Se o membro já pertence a outra equipe, ele será transferido para esta.</p>
      <button type="button" class="primary-button w-auto" :disabled="saving || !selectedMemberId" @click="changeMember(selectedMemberId, team.id)">{{ saving ? 'Salvando…' : 'Adicionar membro' }}</button>
    </div>
    <p v-if="actionError" role="alert" class="mb-3 text-sm text-red-700">{{ actionError }}</p>
    <template v-if="result">
      <p class="mb-4 text-xs text-slate-400">
        {{ result.total }} {{ result.total === 1 ? 'membro' : 'membros' }} nesta equipe
      </p>

      <ul v-if="result.data.length" class="divide-y divide-stone-100">
        <li
          v-for="member in result.data"
          :key="member.id"
          class="flex items-center gap-3 py-3"
        >
          <span
            class="flex size-9 shrink-0 items-center justify-center rounded-full bg-orange-50 text-sm font-semibold text-orange-700"
            aria-hidden="true"
          >
            {{ (member.name ?? member.email ?? '?').slice(0, 1).toUpperCase() }}
          </span>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-semibold text-slate-800">
              {{ member.name ?? '—' }}
            </p>
            <p class="truncate text-xs text-slate-500">
              {{ member.email }} · {{ roleLabels[member.role] }}
            </p>
          </div>
          <button v-if="canManage" type="button" class="rounded-lg border border-rose-200 px-2 py-1 text-xs text-rose-700 hover:bg-rose-50" :disabled="saving" @click="changeMember(member.id, null)">Remover</button>
          <span
            class="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold"
            :class="
              member.status === 'ACTIVE'
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-amber-50 text-amber-700'
            "
          >
            {{ member.status === 'ACTIVE' ? 'Ativo' : 'Suspenso' }}
          </span>
        </li>
      </ul>

      <p v-else class="py-6 text-center text-sm text-slate-400">
        Nenhum membro vinculado a esta equipe.
      </p>

      <PagePagination
        v-if="result.last_page > 1"
        :page="result.current_page"
        :last-page="result.last_page"
        :total="result.total"
        class="mt-4"
        @change="load"
      />
    </template>
  </AppDialog>
</template>

