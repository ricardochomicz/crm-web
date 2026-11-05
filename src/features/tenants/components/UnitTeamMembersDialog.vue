<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AppDialog from '@/components/ui/AppDialog.vue'
import AsyncNotice from '@/components/ui/AsyncNotice.vue'
import { teamApi } from '@/features/members/api'
import type { Member } from '@/features/members/types'
import { teamsApi } from '@/features/teams/api'
import type { TeamMember } from '@/features/teams/types'
import { ApiError, mutate } from '@/lib/http'
import { errorMessage } from '@/lib/feedback'

const props = defineProps<{
  tenantId: string
  teamId: string | null
  teamName: string
  canManage: boolean
}>()
const emit = defineEmits<{ close: []; changed: [] }>()
const members = ref<Member[]>([])
const linked = ref<TeamMember[]>([])
const loading = ref(false)
const busy = ref(false)
const error = ref('')
const success = ref('')
const selectedId = ref('')
const removalId = ref('')
const reason = ref('')
const currentIds = computed(() => new Set(linked.value.map(member => member.id)))
const available = computed(() => members.value.filter(member => member.status === 'ACTIVE' && !currentIds.value.has(member.id)))
const removing = computed(() => linked.value.find(member => member.id === removalId.value))
let sequence = 0

async function load() {
  if (!props.teamId) return
  const current = ++sequence
  loading.value = true
  error.value = ''
  try {
    const [peopleFirst, teamFirst] = await Promise.all([
      teamApi.members(props.tenantId, 1),
      teamsApi.members(props.tenantId, props.teamId, 1),
    ])
    const people = [...peopleFirst.data]
    const teamPeople = [...teamFirst.data]
    for (let page = 2; page <= peopleFirst.last_page; page++) {
      const next = await teamApi.members(props.tenantId, page)
      people.push(...next.data)
    }
    for (let page = 2; page <= teamFirst.last_page; page++) {
      const next = await teamsApi.members(props.tenantId, props.teamId, page)
      teamPeople.push(...next.data)
    }
    if (current !== sequence) return
    members.value = people
    linked.value = teamPeople
  } catch (failure) {
    if (current === sequence) error.value = errorMessage(failure)
  } finally {
    if (current === sequence) loading.value = false
  }
}

watch(() => props.teamId, teamId => {
  ++sequence
  members.value = []
  linked.value = []
  selectedId.value = ''
  removalId.value = ''
  reason.value = ''
  success.value = ''
  error.value = ''
  if (teamId) void load()
}, { immediate: true })

function beginRemove(id: string) {
  removalId.value = id
  selectedId.value = ''
  reason.value = ''
  error.value = ''
}

async function save() {
  if (!props.teamId || busy.value || !props.canManage) return
  const memberId = removalId.value || selectedId.value
  if (!memberId || reason.value.trim().length > 2000) return
  busy.value = true
  error.value = ''
  success.value = ''
  const targetTeam = removalId.value ? null : props.teamId
  try {
    await mutate(
      '/api/v1/tenants/' + encodeURIComponent(props.tenantId) + '/members/' + encodeURIComponent(memberId) + '/team',
      { team_id: targetTeam, reason: reason.value.trim() || null },
      'PATCH',
    )
    selectedId.value = ''
    removalId.value = ''
    reason.value = ''
    await load()
    success.value = targetTeam ? 'Usuário vinculado à equipe.' : 'Usuário removido da equipe.'
    emit('changed')
  } catch (failure) {
    error.value = failure instanceof ApiError
      ? (failure.errors.reason?.[0] ?? failure.errors.team_id?.[0] ?? errorMessage(failure))
      : errorMessage(failure)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <AppDialog :open="!!teamId" :title="'Gerenciar membros · ' + teamName" drawer :busy="busy" @close="emit('close')">
    <div class="grid gap-5">
      <AsyncNotice :loading="loading" :error="error" @retry="load" />
      <p v-if="success" role="status" class="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{{ success }}</p>
      <section v-if="canManage && !loading" class="grid gap-3 rounded-xl border border-stone-200 p-4">
        <h3 class="font-semibold">Adicionar ou transferir usuário</h3>
        <label for="team-member-select" class="text-sm font-medium">Usuário ativo</label>
        <select id="team-member-select" v-model="selectedId" class="field" :disabled="busy" @change="removalId = ''; reason = ''">
          <option value="">Selecione um usuário</option>
          <option v-for="member in available" :key="member.id" :value="member.id">
            {{ member.name }} · {{ member.email }}
          </option>
        </select>
        <p class="text-xs text-slate-500">Se o usuário estiver em outra equipe, será transferido para esta. Cada usuário pode integrar apenas uma equipe por vez.</p>
        <p v-if="removing" class="text-sm font-semibold">Remover {{ removing.name }} desta equipe?</p>
        <template v-if="selectedId || removalId">
          <label for="team-member-reason" class="text-sm font-medium">Justificativa (opcional)</label>
          <textarea id="team-member-reason" v-model="reason" class="field" rows="2" maxlength="2000" :disabled="busy" placeholder="Informe um motivo, se desejar" />
          <div class="flex justify-end gap-2">
            <button type="button" class="secondary-button" :disabled="busy" @click="selectedId = ''; removalId = ''; reason = ''">Cancelar</button>
            <button type="button" class="primary-button w-auto" :disabled="busy" @click="save">
              {{ busy ? 'Salvando…' : removalId ? 'Confirmar remoção' : 'Vincular usuário' }}
            </button>
          </div>
        </template>
      </section>
      <section class="grid gap-2">
        <h3 class="font-semibold">Integrantes da equipe ({{ linked.length }})</h3>
        <p v-if="!loading && !linked.length" class="text-sm text-slate-500">Nenhum integrante vinculado.</p>
        <ul class="divide-y divide-stone-100">
          <li v-for="member in linked" :key="member.id" class="flex items-center justify-between gap-3 py-3">
            <div class="min-w-0">
              <p class="truncate text-sm font-semibold">{{ member.name ?? '—' }}</p>
              <p class="truncate text-xs text-slate-500">{{ member.email }}</p>
            </div>
            <button v-if="canManage" type="button" class="secondary-button shrink-0" :disabled="busy || loading" @click="beginRemove(member.id)">Remover</button>
          </li>
        </ul>
      </section>
    </div>
  </AppDialog>
</template>
