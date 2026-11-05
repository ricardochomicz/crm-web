<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import AppDialog from '@/components/ui/AppDialog.vue'
import PagePagination from '@/components/ui/PagePagination.vue'
import AsyncNotice from '@/components/ui/AsyncNotice.vue'
import { errorMessage } from '@/lib/feedback'
import type { Page } from '../types'
import { unitsApi, type AssignmentKind, type TenantUnit, type UnitAssignment } from '../units'
const props = defineProps<{ tenantId: string; unit: TenantUnit; canCreateTeam: boolean }>()
const emit = defineEmits<{ close: []; changed: [] }>()
const kind = ref<AssignmentKind>('members')
const mode = ref<'linked' | 'available'>('linked')
const search = ref('')
const page = ref(1)
const results = ref<Page<UnitAssignment>>()
const selected = ref<Record<string, UnitAssignment>>({})
const selectedItems = computed(() => Object.values(selected.value))
const loading = ref(false)
const busy = ref(false)
const loadError = ref('')
const error = ref('')
const success = ref('')
const confirmation = ref<{ operation: 'add' | 'remove'; items: UnitAssignment[] }>()
let sequence = 0
let timer: ReturnType<typeof setTimeout> | undefined
async function load() {
  clearTimeout(timer)
  const current = ++sequence
  loading.value = true
  loadError.value = ''
  try {
    const data = await unitsApi.assignments(
      props.tenantId,
      props.unit.id,
      kind.value,
      mode.value,
      search.value.trim(),
      page.value,
    )
    if (current !== sequence) return
    if (data.current_page > data.last_page) {
      page.value = data.last_page
      await load()
      return
    }
    results.value = data
  } catch (failure) {
    if (current === sequence) loadError.value = errorMessage(failure)
  } finally {
    if (current === sequence) loading.value = false
  }
}
function navigate(nextKind: AssignmentKind, nextMode: 'linked' | 'available') {
  kind.value = nextKind
  mode.value = nextMode
  search.value = ''
  page.value = 1
  selected.value = {}
  confirmation.value = undefined
  error.value = ''
  success.value = ''
  void load()
}
function clearSelection() {
  selected.value = {}
  confirmation.value = undefined
}
function toggle(item: UnitAssignment) {
  if (selected.value[item.id]) delete selected.value[item.id]
  else selected.value[item.id] = item
  confirmation.value = undefined
}
function changePage(next: number) {
  page.value = next
  void load()
}
async function apply(operation: 'add' | 'remove', items: UnitAssignment[]) {
  if (busy.value || !items.length) return
  busy.value = true
  error.value = ''
  success.value = ''
  try {
    await unitsApi.changeAssignments(
      props.tenantId,
      props.unit.id,
      kind.value,
      operation,
      items.map((item) => item.id),
    )
    selected.value = {}
    confirmation.value = undefined
    success.value =
      operation === 'add' ? 'Vínculos adicionados com sucesso.' : 'Vínculo removido desta unidade.'
    emit('changed')
    await load()
  } catch (failure) {
    error.value = errorMessage(failure)
  } finally {
    busy.value = false
  }
}
function add() {
  if (kind.value === 'teams')
    confirmation.value = { operation: 'add', items: [...selectedItems.value] }
  else void apply('add', selectedItems.value)
}
watch(search, () => {
  clearTimeout(timer)
  ++sequence
  page.value = 1
  loading.value = true
  timer = setTimeout(load, 300)
})
watch(
  () => [props.tenantId, props.unit.id],
  () => navigate('members', 'linked'),
  { immediate: true },
)
onBeforeUnmount(() => {
  clearTimeout(timer)
  ++sequence
})
</script>
<template>
  <AppDialog
    open
    drawer
    :title="`Membros e equipes · ${unit.name}`"
    :busy="busy"
    description="Gerencie os vínculos desta unidade. As permissões administrativas continuam válidas para toda a empresa."
    @close="emit('close')"
  >
    <div class="grid gap-5">
      <div class="flex gap-2" aria-label="Tipo de vínculo">
        <button
          v-for="tab in ['members', 'teams'] as const"
          :key="tab"
          class="secondary-button"
          :class="{ 'bg-orange-50 text-orange-700': kind === tab }"
          :aria-pressed="kind === tab"
          :disabled="busy"
          @click="navigate(tab, 'linked')"
        >
          {{ tab === 'members' ? 'Membros' : 'Equipes' }}
        </button>
      </div>
      <div v-if="kind === 'teams' && canCreateTeam" class="flex justify-end">
        <RouterLink
          :to="{ path: `/empresas/${tenantId}/equipes`, query: { createTeam: '1' } }"
          class="primary-button w-auto"
        >
          Nova equipe
        </RouterLink>
      </div>
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h3 class="font-semibold">
          {{ mode === 'linked' ? 'Vinculados à unidade' : 'Disponíveis para adicionar' }}
        </h3>
        <button
          class="secondary-button"
          :disabled="busy"
          @click="navigate(kind, mode === 'linked' ? 'available' : 'linked')"
        >
          {{
            mode === 'available'
              ? 'Voltar aos vinculados'
              : kind === 'members'
                ? 'Adicionar membros'
                : 'Adicionar equipes'
          }}
        </button>
      </div>
      <div>
        <label for="assignment-search" class="mb-2 block text-sm font-semibold">{{
          kind === 'members' ? 'Buscar por nome ou e-mail' : 'Buscar equipe pelo nome'
        }}</label
        ><input
          id="assignment-search"
          v-model="search"
          data-initial-focus
          type="search"
          maxlength="180"
          class="field"
          :disabled="busy"
        />
      </div>
      <p v-if="mode === 'available'" class="text-xs text-slate-500">
        A seleção é mantida ao buscar ou trocar de página.
      </p>
      <p v-if="success" role="status" class="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
        {{ success }}
      </p>
      <p v-if="error" role="alert" class="rounded-xl bg-red-50 p-3 text-sm text-red-800">
        {{ error }}
      </p>
      <section
        v-if="confirmation"
        aria-label="Confirmar alteração"
        class="grid gap-3 rounded-xl border border-orange-200 bg-orange-50 p-4"
      >
        <h3 class="font-semibold">
          {{
            confirmation.operation === 'add'
              ? `Transferir equipes para ${unit.name}?`
              : kind === 'members'
                ? 'Remover vínculo com esta unidade?'
                : 'Devolver equipe à matriz?'
          }}
        </h3>
        <ul class="max-h-40 overflow-y-auto text-sm">
          <li v-for="item in confirmation.items" :key="item.id">
            {{ item.name
            }}<span v-if="kind === 'teams'">
              · Unidade atual: {{ item.unit_name || 'Sem unidade' }}</span
            >
          </li>
        </ul>
        <p class="text-xs leading-5">
          {{
            kind === 'members'
              ? 'A pessoa continuará na empresa e nas outras unidades às quais está vinculada.'
              : 'O supervisor e os integrantes serão incluídos na unidade de destino. Seus vínculos anteriores de membros serão preservados.'
          }}
        </p>
        <div class="flex gap-3">
          <button class="secondary-button" :disabled="busy" @click="confirmation = undefined">
            Cancelar</button
          ><button
            class="primary-button w-auto"
            :disabled="busy"
            @click="apply(confirmation.operation, confirmation.items)"
          >
            {{ busy ? 'Salvando…' : 'Confirmar' }}
          </button>
        </div>
      </section>
      <AsyncNotice :loading="loading" :error="loadError" @retry="load" />
      <div v-if="!loading && !loadError && results" class="grid gap-3">
        <p class="text-xs text-slate-500" role="status">{{ results.total }} resultados</p>
        <p v-if="!results.data.length" class="py-5 text-sm text-slate-500">
          {{
            search
              ? 'Nenhum resultado para esta busca.'
              : mode === 'linked'
                ? 'Nenhum vínculo nesta unidade.'
                : 'Nenhum registro disponível para adicionar.'
          }}
        </p>
        <ul class="divide-y divide-stone-100">
          <li v-for="item in results.data" :key="item.id" class="flex items-start gap-3 py-4">
            <input
              v-if="mode === 'available'"
              type="checkbox"
              :aria-label="`Selecionar ${item.name}`"
              :checked="!!selected[item.id]"
              :disabled="busy || (!selected[item.id] && selectedItems.length >= 1000)"
              class="mt-1 size-4 shrink-0 accent-orange-600"
              @change="toggle(item)"
            />
            <div class="min-w-0 flex-1">
              <p class="break-words text-sm font-semibold">
                {{ item.name
                }}<span v-if="item.status === 'SUSPENDED'" class="font-normal text-slate-500">
                  (suspenso)</span
                >
              </p>
              <p v-if="item.email" class="break-all text-xs text-slate-500">{{ item.email }}</p>
              <p v-if="kind === 'teams'" class="text-xs text-slate-500">
                Unidade: {{ item.unit_name || 'Sem unidade' }}
              </p>
              <p
                v-if="mode === 'linked' && item.removal_blocked_reason"
                class="mt-2 text-xs text-slate-500"
              >
                {{ item.removal_blocked_reason }}
              </p>
            </div>
            <button
              v-if="mode === 'linked'"
              class="secondary-button shrink-0"
              :aria-label="`Remover vínculo de ${item.name}`"
              :disabled="busy || !!item.removal_blocked_reason"
              @click="confirmation = { operation: 'remove', items: [item] }"
            >
              {{ kind === 'members' ? 'Remover vínculo' : 'Devolver à matriz' }}
            </button>
          </li>
        </ul>
        <PagePagination
          :page="results.current_page"
          :last-page="results.last_page"
          :total="results.total"
          :busy="busy"
          @change="changePage"
        />
      </div>
      <footer
        v-if="mode === 'available'"
        class="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 bg-white py-4"
      >
        <p class="text-sm" role="status">
          {{ selectedItems.length }}
          {{ kind === 'members' ? 'pessoas selecionadas' : 'equipes selecionadas' }}
        </p>
        <div class="flex gap-2">
          <button
            class="secondary-button"
            :disabled="busy || !selectedItems.length"
            @click="clearSelection"
          >
            Limpar</button
          ><button
            class="primary-button w-auto"
            :disabled="busy || !selectedItems.length || !!confirmation"
            @click="add"
          >
            {{
              busy
                ? 'Salvando…'
                : kind === 'members'
                  ? 'Adicionar selecionados'
                  : 'Revisar transferência'
            }}
          </button>
        </div>
      </footer>
    </div>
  </AppDialog>
</template>
