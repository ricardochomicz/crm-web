<script setup lang="ts">
import type { Contact } from '../api'

defineProps<{
  contacts: Contact[]
  writable: boolean
}>()

const emit = defineEmits<{
  edit: [contact?: Contact]
}>()

const formatCpf = (cpf: string | null) =>
  cpf && /^\d{11}$/.test(cpf)
    ? cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4')
    : cpf

const formatBirthDate = (value: string | null) =>
  value && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? value.split('-').reverse().join('/')
    : value
</script>

<template>
  <section>
    <button
      v-if="writable"
      type="button"
      class="mb-4 rounded-lg border px-3 py-2"
      @click="emit('edit')"
    >
      + Pessoa de contato
    </button>

    <div
      v-for="contact in contacts"
      :key="contact.id"
      class="flex items-center justify-between border-b py-3 text-sm"
    >
      <div>
        <strong>{{ contact.name }}</strong>
        {{ contact.is_primary ? '· Principal' : '' }}
        <p class="text-slate-500">
          {{ [contact.position, contact.phone, contact.email].filter(Boolean).join(' · ') }}
        </p>
        <p v-if="contact.cpf || contact.birth_date" class="mt-1 text-xs text-slate-500">
          <span v-if="contact.cpf">CPF: {{ formatCpf(contact.cpf) }}</span>
          <span v-if="contact.cpf && contact.birth_date"> · </span>
          <span v-if="contact.birth_date">
            Nascimento: {{ formatBirthDate(contact.birth_date) }}
          </span>
        </p>
      </div>
      <button
        v-if="writable"
        type="button"
        class="rounded-lg border px-3 py-1.5"
        @click="emit('edit', contact)"
      >
        Editar
      </button>
    </div>

    <p v-if="!contacts.length" class="text-sm text-slate-500">
      Nenhum contato cadastrado.
    </p>
  </section>
</template>
