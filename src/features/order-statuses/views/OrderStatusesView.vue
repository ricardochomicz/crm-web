<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import AsyncNotice from '@/components/ui/AsyncNotice.vue'
import { useOrderStatusesPage } from '../composables/useOrderStatusesPage'

const route = useRoute()
const tenantId = computed(() => String(route.params.tenantId))
const { tenant, statuses, loading, busy, error, name, editingId, writable, load, edit, cancel, save, remove } =
    useOrderStatusesPage(tenantId)
</script>

<template>
    <AppShell :tenant="tenant" title="Status dos pedidos" subtitle="Configurações">
        <header class="mb-7">
            <p class="eyebrow">CONFIGURAÇÕES COMERCIAIS</p>
            <h1 class="mt-3 text-3xl font-semibold">Status dos pedidos</h1>
            <p class="mt-2 text-sm text-slate-500">Cadastre os status que sua empresa utiliza no acompanhamento dos pedidos.</p>
        </header>

        <AsyncNotice :loading="loading" :error="error" @retry="load" />

        <div v-if="!loading && !error" class="space-y-5">
            <form v-if="writable" class="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm" @submit.prevent="save">
                <label for="status-name" class="mb-2 block text-sm font-semibold text-slate-700">Nome do status</label>
                <div class="flex flex-wrap items-center gap-3">
                    <input id="status-name" v-model="name" class="field min-w-56 flex-1" maxlength="100" minlength="2" required placeholder="Ex.: Em análise" />
                    <button class="primary-button w-auto" type="submit" :disabled="busy || name.trim().length < 2">
                        {{ busy ? 'Salvando…' : editingId ? 'Salvar alteração' : 'Adicionar status' }}
                    </button>
                    <button v-if="editingId" class="secondary-button w-auto" type="button" :disabled="busy" @click="cancel">Cancelar</button>
                </div>
            </form>

            <section class="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
                <div class="border-b border-stone-100 px-5 py-4">
                    <h2 class="font-semibold text-slate-800">Status cadastrados ({{ statuses.length }})</h2>
                </div>
                <p v-if="!statuses.length" class="px-5 py-8 text-sm text-slate-500">Nenhum status cadastrado. Adicione o primeiro para configurar os pedidos.</p>
                <div v-for="status in statuses" :key="status.id" class="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 px-5 py-4 last:border-0">
                    <span class="font-medium text-slate-800">{{ status.name }}</span>
                    <div v-if="writable" class="flex gap-2">
                        <button type="button" class="secondary-button w-auto" :disabled="busy" @click="edit(status)">Editar</button>
                        <button type="button" class="rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50" :disabled="busy" @click="remove(status)">Excluir</button>
                    </div>
                </div>
            </section>
            <div class="flex justify-end">
                <RouterLink :to="`/empresas/${tenantId}`" class="secondary-button w-auto">Voltar para empresa</RouterLink>
            </div>
        </div>
    </AppShell>
</template>
