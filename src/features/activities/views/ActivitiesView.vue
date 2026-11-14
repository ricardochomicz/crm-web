<script setup lang="ts">
import AppShell from '@/components/layout/AppShell.vue'
import AsyncNotice from '@/components/ui/AsyncNotice.vue'
import ListFilters from '@/components/ui/ListFilters.vue'
import ListTable from '@/components/ui/ListTable.vue'
import PagePagination from '@/components/ui/PagePagination.vue'
import SearchSelect from '@/components/ui/SearchSelect.vue'
import CalendarEventHistoryDialog from '@/features/calendar/components/CalendarEventHistoryDialog.vue'
import CalendarEventDialog from '@/features/calendar/components/CalendarEventDialog.vue'
import { useActivitiesPage } from '../composables/useActivitiesPage'
const {
  completingIds,
  refreshing,
  refreshError,
  tenantId,
  activityLinkLoading,
  activityLinkError,
  tenant,
  events,
  loading,
  error,
  scope,
  filter,
  search,
  appliedSearch,
  dialogOpen,
  selected,
  historyEvent,
  now,
  page,
  pagination,
  canCreate,
  canEdit,
  canDelete,
  canTeam,
  isOverdue,
  urgency,
  activityUrgencyLabels,
  visible,
  overview,
  overviewLoading,
  overviewError,
  loadOverview,
  dateLabel,
  load,
  submitSearch,
  clearFilters,
  changePage,
  create,
  edit,
  complete,
  saved,
} = useActivitiesPage()
</script>

<template>
  <AppShell
    :tenant="tenant"
    title="Central de atividades"
    subtitle="Produtividade e acompanhamento"
  >
    <header class="mb-7 flex flex-wrap items-center justify-between gap-4">
      <div>
        <p class="eyebrow">PRODUTIVIDADE</p>
        <h1 class="mt-3 text-3xl font-semibold">Central de atividades</h1>
        <p class="mt-2 text-sm text-slate-500">
          Acompanhe tarefas e lembretes da operação comercial.
        </p>
      </div>
      <button v-if="canCreate && scope === 'mine'" class="primary-button w-auto" @click="create">
        + Nova tarefa
      </button>
    </header>
    <p v-if="overviewError" role="alert" class="mb-3 text-sm text-red-700">
      Indicadores indisponíveis: {{ overviewError }}
      <button type="button" class="font-semibold underline" @click="loadOverview()">
        Tentar novamente
      </button>
    </p>
    <div class="mb-5 grid gap-3 sm:grid-cols-4">
      <button
        v-for="item in [
          { key: 'pending', label: 'Pendentes', count: overview.pending },
          { key: 'overdue', label: 'Atrasadas', count: overview.overdue },
          { key: 'completed', label: 'Concluídas', count: overview.completed },
        ]"
        :key="item.key"
        type="button"
        class="rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:border-orange-300"
        :class="
          filter === item.key ? 'border-orange-500 ring-1 ring-orange-200' : 'border-stone-200'
        "
        @click="filter = item.key as typeof filter"
      >
        <p class="text-sm text-slate-500">{{ item.label }}</p>
        <p class="mt-2 text-2xl font-semibold text-slate-800">
          {{ overviewLoading ? '…' : overviewError ? '—' : item.count }}
        </p>
      </button>
    </div>
    <p class="mb-4 text-sm text-slate-600">
      <span class="font-semibold text-amber-700">{{ overview.due_soon }}</span>
      atividade(s) pendente(s) vencem nas próximas 24 horas.
    </p>
    <ListFilters
      :count-label="pagination.total + ' atividade(s) encontrada(s)'"
      :columns="3"
      collapsible
      :initially-collapsed="true"
      @search="submitSearch"
      @clear="clearFilters"
    >
      <div>
        <label class="mb-1 block text-xs font-semibold text-slate-600"
          >Título, cliente ou oportunidade</label
        ><input
          v-model="search"
          class="field w-full"
          placeholder="Pesquisar atividades"
          @keyup.enter="submitSearch"
        />
      </div>
      <div>
        <label class="mb-1 block text-xs font-semibold text-slate-600">Situação</label
        ><SearchSelect
          v-model="filter"
          :options="[
            { value: 'all', label: 'Todas as situações' },
            { value: 'pending', label: 'Pendentes' },
            { value: 'overdue', label: 'Atrasadas' },
            { value: 'completed', label: 'Concluídas' },
            { value: 'cancelled', label: 'Canceladas' },
          ]"
        />
      </div>
      <div v-if="canTeam">
        <label class="mb-1 block text-xs font-semibold text-slate-600">Visualização</label
        ><SearchSelect
          v-model="scope"
          :options="[
            { value: 'mine', label: 'Minhas atividades' },
            { value: 'team', label: 'Atividades da equipe' },
          ]"
        />
      </div>
    </ListFilters>
    <p v-if="activityLinkLoading" class="mb-3 text-sm text-slate-500">Abrindo atividade…</p>
    <p v-if="activityLinkError" role="alert" class="mb-3 text-sm text-red-700">
      Não foi possível abrir a atividade: {{ activityLinkError }}
    </p>
    <p v-if="refreshing" role="status" class="mb-3 text-xs text-slate-500">
      Sincronizando atividades…
    </p>
    <p v-if="refreshError" role="alert" class="mb-3 text-sm text-amber-700">
      Não foi possível atualizar os dados. A última listagem foi mantida.
      <button type="button" class="font-semibold underline" @click="load()">Tentar novamente</button>
    </p>
    <AsyncNotice :loading="loading" :error="error" label="Carregando atividades…" @retry="load()" />
    <section
      v-if="!loading && !error"
      class="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm"
    >
      <ListTable min-width="750px">
        <thead class="bg-stone-50 text-xs font-semibold uppercase text-slate-500">
          <tr>
            <th class="p-4">Atividade</th>
            <th class="p-4">Cliente / Oportunidade</th>
            <th class="p-4">Prazo</th>
            <th class="p-4">Prioridade</th>
            <th class="p-4">Situação</th>
            <th class="p-4 text-right">Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="event in visible" :key="event.id" class="border-t border-stone-100">
            <td class="p-4">
              <p class="font-semibold text-slate-800">{{ event.title }}</p>
              <span
                v-if="urgency(event) !== 'normal'"
                class="mt-1 inline-flex rounded-md px-2 py-0.5 text-xs font-semibold"
                :class="{
                  'bg-red-50 text-red-700': urgency(event) === 'overdue',
                  'bg-amber-50 text-amber-800': urgency(event) === 'due-soon',
                  'bg-orange-50 text-orange-700': urgency(event) === 'high',
                }"
              >
                {{ activityUrgencyLabels[urgency(event)] }}
              </span>
              <p v-if="event.description" class="mt-1 line-clamp-2 text-xs text-slate-500">
                {{ event.description }}
              </p>
            </td>
            <td class="p-4 text-sm">
              {{ event.client_name || '—' }}
              <p v-if="event.opportunity_title" class="text-xs text-slate-500">
                {{ event.opportunity_title }}
              </p>
            </td>
            <td class="p-4 text-sm" :class="isOverdue(event) ? 'font-semibold text-red-700' : ''">
              {{ dateLabel(event.ends_at) }}
            </td>
            <td class="p-4 text-sm">
              {{
                event.priority === 'high' ? 'Alta' : event.priority === 'low' ? 'Baixa' : 'Normal'
              }}
            </td>
            <td class="p-4">
              <span
                class="rounded-lg px-3 py-1 text-xs font-semibold"
                :class="
                  isOverdue(event)
                    ? 'bg-red-50 text-red-700'
                    : event.status === 'completed'
                      ? 'bg-green-50 text-green-700'
                      : 'bg-orange-50 text-orange-700'
                "
                >{{
                  isOverdue(event)
                    ? 'Atrasada'
                    : event.status === 'completed'
                      ? 'Concluída'
                      : event.status === 'cancelled'
                        ? 'Cancelada'
                        : 'Pendente'
                }}</span
              >
            </td>
            <td class="p-4 text-right">
              <div v-if="scope === 'mine'" class="flex justify-end gap-2">
                <button
                  v-if="canEdit && event.status === 'pending'"
                  class="secondary-button w-auto"
                  :disabled="completingIds.includes(event.id)"
                  :aria-busy="completingIds.includes(event.id)"
                  @click="complete(event)"
                >
                  Concluir</button
                ><button class="secondary-button w-auto" @click="edit(event)">
                  {{ canEdit ? 'Editar' : 'Detalhes' }}</button
                ><button
                  type="button"
                  class="secondary-button w-auto"
                  @click="historyEvent = event"
                >
                  Histórico
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </ListTable>
      <p v-if="!visible.length" class="p-6 text-center text-sm text-slate-500">
        Nenhuma atividade encontrada.
      </p>
    </section>
    <PagePagination
      v-if="!loading && !error"
      :page="page"
      :last-page="pagination.last_page"
      :total="pagination.total"
      :per-page="pagination.per_page"
      @change="changePage"
    />
    <CalendarEventHistoryDialog
      :open="!!historyEvent"
      :tenant-id="tenantId"
      :event-id="historyEvent?.id ?? null"
      :title="historyEvent?.title"
      @close="historyEvent = null"
    />
    <CalendarEventDialog
      :open="dialogOpen"
      :tenant-id="tenantId"
      :event="selected"
      :date="''"
      :default-type="'task'"
      :can-write="(canEdit && !!selected) || (canCreate && !selected)"
      :can-delete="canDelete"
      @close="dialogOpen = false"
      @saved="saved"
    />
  </AppShell>
</template>
