<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import { onBeforeRouteLeave, useRoute } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import AppDialog from '@/components/ui/AppDialog.vue'
import AsyncNotice from '@/components/ui/AsyncNotice.vue'
import PagePagination from '@/components/ui/PagePagination.vue'
import { tenantApi } from '../api'
import { roleLabels, type Tenant, type TenantRole, type Page } from '../types'
import { permissionsApi, type PermissionSettings, type PermissionChange } from '../permissions'
import { errorMessage } from '@/lib/feedback'
import { toast } from '@/services/toast'
import { ApiError } from '@/lib/http'
const tenantId = String(useRoute().params.tenantId)
const tenant = ref<Tenant>()
const settings = ref<PermissionSettings>()
const loading = ref(true)
const error = ref('')
const selectedRole = ref<TenantRole>('MANAGER')
const draft = ref<string[]>([])
const busy = ref(false)
const reviewing = ref(false)
const conflicted = ref(false)
const history = ref<Page<PermissionChange>>()
const historyLoading = ref(false)
const historyError = ref('')
const current = computed(() =>
  settings.value?.roles.find((role) => role.role === selectedRole.value),
)
const search = ref('')
const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
const filteredCatalog = computed(() =>
  (settings.value?.catalog ?? []).filter((item) =>
    normalize(`${item.group} ${item.label}`).includes(normalize(search.value.trim())),
  ),
)
const groups = computed(() => [...new Set(filteredCatalog.value.map((item) => item.group))])
const added = computed(() => draft.value.filter((key) => !current.value?.permissions.includes(key)))
const removed = computed(
  () => current.value?.permissions.filter((key) => !draft.value.includes(key)) ?? [],
)
const dirty = computed(() => added.value.length + removed.value.length > 0)
const locked = computed(
  () => !settings.value?.can_edit || current.value?.protected || busy.value || conflicted.value,
)
const label = (key: string) =>
  settings.value?.catalog.find((item) => item.key === key)?.label ?? key
function resetDraft() {
  draft.value = [...(current.value?.permissions ?? [])]
}
function selectRole(role: TenantRole) {
  if (role === selectedRole.value) return
  if (dirty.value && !window.confirm('Descartar as alterações não salvas deste cargo?')) return
  selectedRole.value = role
  resetDraft()
}
function toggle(key: string, checked: boolean) {
  if (locked.value) return
  const selected = new Set(draft.value)
  if (checked) {
    selected.add(key)
    settings.value?.catalog
      .find((item) => item.key === key)
      ?.requires.forEach((required) => selected.add(required))
  } else {
    selected.delete(key)
    settings.value?.catalog
      .filter((item) => item.requires.includes(key))
      .forEach((item) => selected.delete(item.key))
  }
  draft.value = [...selected]
}
async function loadHistory(page = 1) {
  historyLoading.value = true
  historyError.value = ''
  try {
    history.value = await permissionsApi.history(tenantId, page)
  } catch (failure) {
    historyError.value = errorMessage(failure)
  } finally {
    historyLoading.value = false
  }
}
async function load() {
  if (dirty.value && !window.confirm('Recarregar e descartar as alterações não salvas?')) return
  loading.value = true
  error.value = ''
  settings.value = undefined
  try {
    tenant.value = (await tenantApi.show(tenantId)).data
    if (tenant.value.access?.can_manage_permissions) {
      settings.value = (await permissionsApi.show(tenantId)).data
      conflicted.value = false
      resetDraft()
      await loadHistory()
    }
  } catch (failure) {
    error.value = errorMessage(failure)
  } finally {
    loading.value = false
  }
}
async function save() {
  if (!current.value || locked.value || !dirty.value) return
  busy.value = true
  const role = current.value
  const saved = [...draft.value]
  try {
    await permissionsApi.update(tenantId, role.role, saved, role.version)
    role.permissions = saved
    role.version += 1
    reviewing.value = false
    toast.success(`Permissões de ${roleLabels[role.role]} atualizadas nesta empresa.`)
    await loadHistory()
  } catch (failure) {
    toast.error(errorMessage(failure))
    if (failure instanceof ApiError && failure.status === 409) conflicted.value = true
  } finally {
    busy.value = false
  }
}
function beforeUnload(event: BeforeUnloadEvent) {
  if (dirty.value || busy.value) {
    event.preventDefault()
    event.returnValue = ''
  }
}
onBeforeRouteLeave(
  () =>
    !busy.value && (!dirty.value || window.confirm('Sair e descartar as alterações não salvas?')),
)
onMounted(() => {
  window.addEventListener('beforeunload', beforeUnload)
  void load()
})
onBeforeUnmount(() => window.removeEventListener('beforeunload', beforeUnload))
function dateTime(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(
    new Date(value),
  )
}
</script>
<template>
  <AppShell :tenant="tenant" :title="tenant?.name ?? 'Configurações'" subtitle="Controle de acesso">
    <header class="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="eyebrow">CADA PESSOA, O ACESSO CERTO</p>
        <h1 class="mt-3 text-3xl font-semibold tracking-tight">Cargos e permissões</h1>
        <p class="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
          Defina o que cada cargo pode fazer nesta empresa. As alterações valem para todos os
          integrantes com esse cargo.
        </p>
      </div>
      <button class="secondary-button" :disabled="loading || busy" @click="load">Recarregar</button>
    </header>
    <AsyncNotice :loading="loading" :error="error" @retry="load" />
    <section
      v-if="!loading && !error && !tenant?.access?.can_manage_permissions"
      class="rounded-2xl border border-stone-200 bg-white p-8"
    >
      <h2 class="text-lg font-semibold">Configuração exclusiva do proprietário</h2>
      <p class="mt-3 text-sm text-slate-500">
        Solicite ao proprietário os ajustes necessários para o seu cargo.
      </p>
    </section>
    <template v-if="!loading && settings">
      <p
        v-if="!settings.can_edit"
        role="status"
        class="mb-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-900"
      >
        A assinatura permite consultar as configurações, mas bloqueia alterações no momento.
      </p>
      <p
        v-if="conflicted"
        role="alert"
        class="mb-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-900"
      >
        Outra sessão alterou as permissões. Feche a revisão e use Recarregar para obter os dados
        atuais.
      </p>
      <div class="grid items-start gap-6 lg:grid-cols-[15rem_1fr]">
        <aside
          class="rounded-2xl border border-stone-200 bg-white p-3"
          aria-label="Selecionar cargo"
        >
          <button
            v-for="role in settings.roles"
            :key="role.role"
            type="button"
            :disabled="busy"
            :aria-pressed="selectedRole === role.role"
            class="mb-1 flex w-full items-center justify-between rounded-xl px-4 py-4 text-left text-sm font-medium transition"
            :class="
              selectedRole === role.role
                ? 'bg-[#202a26] text-white'
                : 'text-slate-600 hover:bg-stone-50'
            "
            @click="selectRole(role.role)"
          >
            <span
              >{{ roleLabels[role.role]
              }}<span v-if="role.protected" class="mt-1 block text-[10px] opacity-65"
                >Acesso protegido</span
              ></span
            >
            <span class="text-xs opacity-60">{{ role.permissions.length }}</span>
          </button>
          <p class="px-4 pb-2 pt-4 text-xs leading-6 text-slate-500">
            Os cargos são independentes entre empresas. O administrador da plataforma não recebe
            acesso por esta configuração.
          </p>
        </aside>
        <section class="overflow-hidden rounded-2xl border border-stone-200 bg-white">
          <header class="border-b border-stone-100 p-6 sm:p-7">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <h2 class="text-xl font-semibold">{{ roleLabels[selectedRole] }}</h2>
              <span class="rounded-full bg-stone-100 px-3 py-1 text-xs text-slate-600"
                >{{ draft.length }} permissões</span
              >
            </div>
            <p class="mt-3 text-sm leading-6 text-slate-500">
              {{
                current?.protected
                  ? 'O proprietário mantém acesso completo. Este cargo não pode ser modificado.'
                  : 'Marque as ações autorizadas. Permitir alterações também habilita a visualização necessária.'
              }}
            </p>
          </header>
          <div class="border-b border-stone-100 px-6 py-5 sm:px-7">
            <label for="permission-search" class="mb-2 block text-xs font-semibold text-slate-600"
              >Buscar módulo ou permissão</label
            ><input
              id="permission-search"
              v-model="search"
              type="search"
              class="field"
              placeholder="Ex.: convites, editar, assinatura"
            />
            <p class="mt-2 text-xs text-slate-500" role="status">
              {{ filteredCatalog.length }} permissões encontradas. A busca não altera sua seleção.
            </p>
          </div>
          <fieldset :disabled="locked" class="divide-y divide-stone-100">
            <legend class="sr-only">Permissões de {{ roleLabels[selectedRole] }}</legend>
            <details
              v-for="group in groups"
              :key="`${selectedRole}-${group}-${search.trim() ? 'search' : 'all'}`"
              :open="!!search.trim() || group === groups[0]"
              class="p-6 sm:p-7"
            >
              <summary class="cursor-pointer text-sm font-semibold text-slate-800">
                {{ group }}
                <span class="ml-2 text-xs font-normal text-slate-500"
                  >{{
                    settings.catalog.filter(
                      (item) => item.group === group && draft.includes(item.key),
                    ).length
                  }}
                  selecionadas</span
                >
              </summary>
              <div class="mt-4 grid gap-3 sm:grid-cols-2">
                <label
                  v-for="permission in filteredCatalog.filter((item) => item.group === group)"
                  :key="permission.key"
                  class="flex items-start gap-3 rounded-xl border p-4 text-sm transition"
                  :class="
                    draft.includes(permission.key)
                      ? 'border-orange-200 bg-orange-50/60 text-slate-800'
                      : 'border-stone-200 text-slate-500'
                  "
                >
                  <input
                    type="checkbox"
                    class="mt-0.5 size-4 shrink-0 accent-orange-600"
                    :checked="draft.includes(permission.key)"
                    @change="toggle(permission.key, ($event.target as HTMLInputElement).checked)"
                  /><span>{{ permission.label }}</span>
                </label>
              </div>
            </details>
            <p v-if="!groups.length" class="p-7 text-sm text-slate-500">
              Nenhuma permissão encontrada. Tente outra busca.
            </p>
          </fieldset>
          <footer class="border-t border-stone-100 bg-stone-50 p-6">
            <p class="text-xs leading-6 text-slate-500">
              Alcance: toda esta empresa. Ninguém pode atribuir um cargo com permissões que não
              possui. Clientes, negociações e seus alcances serão incluídos quando esses módulos
              estiverem disponíveis.
            </p>
            <div
              v-if="!current?.protected"
              class="mt-5 flex flex-wrap items-center justify-between gap-3"
            >
              <span class="text-xs text-slate-500">{{
                dirty
                  ? `${added.length} adições · ${removed.length} remoções`
                  : 'Nenhuma alteração pendente'
              }}</span>
              <div class="flex gap-3">
                <button class="secondary-button" :disabled="!dirty || busy" @click="resetDraft">
                  Descartar</button
                ><button
                  class="primary-button w-auto"
                  :disabled="!dirty || locked"
                  @click="reviewing = true"
                >
                  Revisar alterações
                </button>
              </div>
            </div>
          </footer>
        </section>
      </div>
      <section class="mt-8 rounded-2xl border border-stone-200 bg-white p-6 sm:p-7">
        <h2 class="text-lg font-semibold">Histórico de alterações</h2>
        <p class="mt-2 text-xs text-slate-500">
          Quem alterou, quando e quais permissões mudaram. Horário local.
        </p>
        <AsyncNotice :loading="historyLoading" :error="historyError" @retry="loadHistory()" />
        <template v-if="!historyLoading && !historyError && history"
          ><ol class="mt-5 divide-y divide-stone-100">
            <li v-for="change in history.data" :key="change.id" class="py-5">
              <div class="flex flex-wrap justify-between gap-2 text-sm">
                <p>
                  <strong>{{ change.actor_name }}</strong> alterou {{ roleLabels[change.role] }}
                </p>
                <time :datetime="change.created_at" class="text-xs text-slate-400">{{
                  dateTime(change.created_at)
                }}</time>
              </div>
              <p
                v-if="change.permissions.some((key) => !change.previous_permissions.includes(key))"
                class="mt-3 text-xs leading-6 text-emerald-800"
              >
                Adicionadas:
                {{
                  change.permissions
                    .filter((key) => !change.previous_permissions.includes(key))
                    .map(label)
                    .join(', ')
                }}
              </p>
              <p
                v-if="change.previous_permissions.some((key) => !change.permissions.includes(key))"
                class="mt-2 text-xs leading-6 text-red-800"
              >
                Removidas:
                {{
                  change.previous_permissions
                    .filter((key) => !change.permissions.includes(key))
                    .map(label)
                    .join(', ')
                }}
              </p>
            </li>
          </ol>
          <p v-if="!history.data.length" class="py-7 text-sm text-slate-500">
            Nenhuma alteração registrada. Os cargos mantêm as permissões iniciais.
          </p>
          <PagePagination
            :page="history.current_page"
            :last-page="history.last_page"
            :total="history.total"
            :busy="busy"
            @change="loadHistory"
        /></template>
      </section>
    </template>
    <AppDialog
      :open="reviewing"
      title="Aplicar estas permissões?"
      :description="`A alteração afeta todos os integrantes com o cargo ${roleLabels[selectedRole]} nesta empresa, incluindo novos membros.`"
      :busy="busy"
      @close="reviewing = false"
    >
      <div class="space-y-4 text-sm">
        <div v-if="added.length">
          <h3 class="font-semibold text-emerald-800">Permitir</h3>
          <ul class="mt-2 list-inside list-disc space-y-2">
            <li v-for="key in added" :key="key">{{ label(key) }}</li>
          </ul>
        </div>
        <div v-if="removed.length">
          <h3 class="font-semibold text-red-800">Remover acesso</h3>
          <ul class="mt-2 list-inside list-disc space-y-2">
            <li v-for="key in removed" :key="key">{{ label(key) }}</li>
          </ul>
        </div>
      </div>
      <div class="mt-6 flex justify-end gap-3">
        <button
          class="secondary-button"
          data-initial-focus
          :disabled="busy"
          @click="reviewing = false"
        >
          Voltar</button
        ><button class="primary-button w-auto" :disabled="locked || !dirty" @click="save">
          {{ busy ? 'Salvando…' : 'Confirmar alterações' }}
        </button>
      </div>
    </AppDialog>
  </AppShell>
</template>
