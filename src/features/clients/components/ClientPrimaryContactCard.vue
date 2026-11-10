<script setup lang="ts">
import { computed } from 'vue'
import type { Contact } from '../api'

const props = defineProps<{ contacts?: Contact[]; loading?: boolean }>()
const contact = computed(() => {
  const active = (props.contacts ?? []).filter(item => item.is_active)
  return active.find(item => item.is_primary) ?? active[0] ?? null
})
const phoneHref = computed(() => contact.value?.phone ? 'tel:' + contact.value.phone.replace(/[^\d+]/g, '') : '')
const emailHref = computed(() => contact.value?.email ? 'mailto:' + contact.value.email : '')
</script>

<template>
  <section class="rounded-xl border border-stone-200 bg-stone-50/70 px-4 py-3" aria-label="Contato principal do cliente">
    <div class="mb-2 flex items-center gap-2">
      <span class="text-xs font-bold uppercase tracking-wide text-slate-600">Contato principal</span>
      <span v-if="contact?.is_primary" class="rounded-full bg-orange-50 px-2 py-0.5 text-[11px] font-semibold text-orange-700">Principal</span>
    </div>
    <p v-if="loading" class="text-sm text-slate-500">Carregando contato…</p>
    <div v-else-if="contact" class="grid gap-3 text-sm sm:grid-cols-3">
      <div class="min-w-0"><p class="mb-1 text-xs text-slate-500">Nome</p><p class="break-words font-semibold text-slate-800">{{ contact.name }}</p></div>
      <div class="min-w-0"><p class="mb-1 text-xs text-slate-500">Telefone</p><a v-if="contact.phone" :href="phoneHref" class="break-all font-medium text-orange-700 hover:underline">{{ contact.phone }}</a><span v-else class="text-slate-400">Não informado</span></div>
      <div class="min-w-0"><p class="mb-1 text-xs text-slate-500">E-mail</p><a v-if="contact.email" :href="emailHref" class="break-all font-medium text-orange-700 hover:underline">{{ contact.email }}</a><span v-else class="text-slate-400">Não informado</span></div>
    </div>
    <p v-else class="text-sm text-slate-500">Nenhum contato ativo cadastrado para este cliente.</p>
  </section>
</template>
