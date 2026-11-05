<script setup lang="ts">
import { ref, watch } from 'vue'
import AppDialog from '@/components/ui/AppDialog.vue'
import AsyncNotice from '@/components/ui/AsyncNotice.vue'
import PagePagination from '@/components/ui/PagePagination.vue'
import { roleLabels } from '@/features/tenants/types'
import { errorMessage } from '@/lib/feedback'
import { teamsApi } from '../api'
import type { Team, TeamMember } from '../types'
import type { Page } from '@/features/tenants/types'

const props = defineProps<{
  tenantId: string
  team: Team | null
}>()

defineEmits<{ close: [] }>()

const page = ref(1)
const result = ref<Page<TeamMember>>()
const loading = ref(false)
const loadError = ref('')

watch(
  () => props.team,
  async (team) => {
    if (!team) return
    page.value = 1
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
