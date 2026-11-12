<script setup lang="ts">
import AppShell from '@/components/layout/AppShell.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import AsyncNotice from '@/components/ui/AsyncNotice.vue'
import CalendarEventHistoryDialog from '@/features/calendar/components/CalendarEventHistoryDialog.vue'
import CalendarEventDialog from '../components/CalendarEventDialog.vue'
import { useCalendarPage } from '../composables/useCalendarPage'
const { tenantId, tenant, month, scope, events, loading, error, dialogOpen, selectedEvent, historyEvent, selectedDate, focusedDay, dayDetailsSection, now, isOverdue, statusLabel, dayEvents, dayTitle, eventTime, canCreate, canEdit, canDelete, teamAllowed, title, range, days, byDay, load, navigate, create, selectDay, edit, saved, dateKey, completedColors, eventStyles } = useCalendarPage()
</script>
<template>
  <AppShell :tenant="tenant" title="Agenda" subtitle="Organização de compromissos">
    <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div><h1 class="text-2xl font-bold capitalize text-slate-800">{{ title }}</h1><p class="mt-1 text-sm text-slate-500">Compromissos e atividades da empresa</p></div>
      <button v-if="canCreate && scope === 'mine' && new Date(month.getFullYear(), month.getMonth() + 1, 0) >= new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())" class="primary-button w-auto" @click="create(new Date().getMonth() === month.getMonth() && new Date().getFullYear() === month.getFullYear() ? new Date().getDate() : (new Date(month.getFullYear(), month.getMonth(), 1) < new Date(new Date().getFullYear(), new Date().getMonth(), 1) ? new Date().getDate() : 1))">Novo compromisso</button>
    </div>
    <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div class="flex gap-2"><button class="secondary-button" aria-label="Mês anterior" @click="navigate(-1)">Anterior</button><button class="secondary-button" @click="month = new Date(new Date().getFullYear(), new Date().getMonth(), 1); focusedDay = dateKey(new Date())">Hoje</button><button class="secondary-button" aria-label="Próximo mês" @click="navigate(1)">Próximo</button></div>
      <div v-if="teamAllowed" class="flex rounded-xl bg-stone-100 p-1"><button class="rounded-lg px-4 py-2 text-sm" :class="scope === 'mine' ? 'bg-white font-semibold shadow-sm' : ''" @click="scope = 'mine'">Minha agenda</button><button class="rounded-lg px-4 py-2 text-sm" :class="scope === 'team' ? 'bg-white font-semibold shadow-sm' : ''" @click="scope = 'team'">Equipe</button></div>
    </div>
    <AsyncNotice :loading="loading" :error="error" label="Carregando agenda…" @retry="load" />
    <section v-if="!loading && !error" aria-label="Calendário mensal" class="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
      <div class="grid grid-cols-7 border-b border-stone-200 bg-stone-50 text-center text-xs font-semibold text-slate-500"><div v-for="name in ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']" :key="name" class="py-3">{{ name }}</div></div>
      <div class="grid grid-cols-7">
        <div v-for="(day, index) in days" :key="index" class="min-h-28 border-b border-r border-stone-100 p-1.5 sm:min-h-36 sm:p-2"  :class="{ 'ring-2 ring-inset ring-orange-400': day && focusedDay === dateKey(new Date(month.getFullYear(), month.getMonth(), day)), 'bg-stone-50/70': day && dateKey(new Date(month.getFullYear(), month.getMonth(), day)) < dateKey(new Date()) }" @click="day && selectDay(day)">
          <template v-if="day">
            <button type="button" class="mb-1 flex size-7 items-center justify-center rounded-full text-xs font-semibold hover:bg-orange-100" :class="dateKey(new Date(month.getFullYear(), month.getMonth(), day)) === dateKey(new Date()) ? 'bg-orange-600 text-white hover:bg-orange-700' : 'text-slate-700'" :aria-label="`Ver compromissos do dia ${day}`" @click.stop="selectDay(day)">{{ day }}</button>
            <button v-for="event in (byDay.get(dateKey(new Date(month.getFullYear(), month.getMonth(), day))) ?? []).slice(0, 3)" :key="event.id" type="button" class="mb-1 flex w-full items-center gap-1 rounded-md px-1.5 py-1 text-left text-[11px] font-medium" :class="[event.status === 'completed' ? completedColors[event.type] : eventStyles[event.type].color, { 'border-l-2 border-orange-500': isOverdue(event) }]" :title="`${event.title} · ${statusLabel(event)}`" :aria-label="`${event.title} · ${statusLabel(event)}`" @click.stop="focusedDay = dateKey(new Date(event.starts_at)); edit(event)">
              <AppIcon v-if="event.status === 'completed'" name="checkCircle" class="size-3.5 shrink-0" />
              <AppIcon v-else-if="isOverdue(event)" name="alertTriangle" class="size-3.5 shrink-0 text-orange-700" />
              <AppIcon v-else-if="event.status === 'cancelled'" name="xCircle" class="size-3.5 shrink-0 text-slate-500" />
              <span class="truncate" :class="{ 'line-through opacity-60': event.status === 'cancelled' }">{{ event.title }}</span>
            </button>
            <button v-if="(byDay.get(dateKey(new Date(month.getFullYear(), month.getMonth(), day))) ?? []).length > 3" type="button" class="mt-1 text-left text-[11px] font-semibold text-orange-700 hover:underline" @click.stop="selectDay(day)">+{{ (byDay.get(dateKey(new Date(month.getFullYear(), month.getMonth(), day))) ?? []).length - 3 }} compromissos · Ver todos</button>
          </template>
        </div>
      </div>
    </section>
    <section v-if="!loading && !error" ref="dayDetailsSection" aria-label="Compromissos do dia" class="mt-5 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div><h2 class="text-lg font-semibold text-slate-800">Compromissos do dia</h2><p class="text-sm capitalize text-slate-500">{{ dayTitle }}</p></div>
        <button v-if="canCreate && scope === 'mine' && focusedDay >= dateKey(new Date())" type="button" class="secondary-button" @click="create(Number(focusedDay.slice(-2)))">Novo neste dia</button>
      </div>
      <div class="mt-3 flex flex-wrap gap-3 text-xs text-slate-600" aria-label="Legenda de tipos de compromisso">
        <span v-for="(style, type) in eventStyles" :key="type" class="inline-flex items-center gap-1.5"><span class="size-2.5 rounded-full" :class="style.dot" />{{ style.label }}</span>
      </div>
      <p v-if="!dayEvents.length" class="mt-5 rounded-xl bg-stone-50 px-4 py-6 text-center text-sm text-slate-500">Nenhum compromisso para este dia.</p>
      <div v-else class="mt-4 space-y-2">
        <div v-for="event in dayEvents" :key="event.id" class="space-y-1">
        <button type="button" class="flex w-full items-start gap-3 rounded-xl border border-stone-100 p-3 text-left transition hover:border-stone-300" :class="{ 'border-l-2 border-l-orange-500': isOverdue(event) }" :disabled="scope === 'team' || !canEdit" @click="edit(event)">
          <AppIcon v-if="event.status === 'completed'" name="checkCircle" class="mt-0.5 size-4 shrink-0 text-emerald-700" />
          <AppIcon v-else-if="isOverdue(event)" name="alertTriangle" class="mt-0.5 size-4 shrink-0 text-orange-700" />
          <AppIcon v-else-if="event.status === 'cancelled'" name="xCircle" class="mt-0.5 size-4 shrink-0 text-slate-500" />
          <span v-else class="mt-1 size-2.5 shrink-0 rounded-full" :class="eventStyles[event.type].dot" />
          <span class="min-w-0 flex-1">
            <span class="flex flex-wrap items-center gap-2"><span class="font-semibold text-slate-800" :class="{ 'line-through opacity-60': event.status === 'cancelled' }">{{ event.title }}</span><span class="rounded-md px-2 py-0.5 text-xs" :class="eventStyles[event.type].color">{{ eventStyles[event.type].label }}</span></span>
            <span class="mt-1 block text-xs text-slate-500">{{ event.all_day ? 'Dia inteiro' : eventTime(event.starts_at) + ' – ' + eventTime(event.ends_at) }} · <span :class="{ 'font-semibold text-orange-700': isOverdue(event), 'font-medium text-emerald-700': event.status === 'completed' }">{{ statusLabel(event) }}</span><template v-if="event.client_name"> · {{ event.client_name }}</template></span>
          </span>
        </button>
        <div v-if="scope === 'mine'" class="flex justify-end">
          <button type="button" class="text-xs font-semibold text-orange-700 hover:underline" @click="historyEvent = event">Ver histórico</button>
        </div>
        </div>
      </div>
    </section>
    <CalendarEventHistoryDialog :open="!!historyEvent" :tenant-id="tenantId" :event-id="historyEvent?.id ?? null" :title="historyEvent?.title" @close="historyEvent = null" />
    <CalendarEventDialog :open="dialogOpen" :tenant-id="tenantId" :event="selectedEvent" :date="selectedDate" :can-write="selectedEvent ? canEdit : canCreate" :can-delete="canDelete" @close="dialogOpen = false" @saved="saved" />
  </AppShell>
</template>
