<script setup lang="ts">
import { ref } from 'vue'
import AppIcon from './AppIcon.vue'

const props = withDefaults(defineProps<{
    busy?: boolean
    countLabel?: string
    columns?: 1 | 2 | 3 | 4
    title?: string
    collapsible?: boolean
    initiallyCollapsed?: boolean
    activeCount?: number
}>(), {
    columns: 4,
    title: 'Filtros',
    collapsible: false,
    initiallyCollapsed: false,
    activeCount: 0,
})

const expanded = ref(!props.initiallyCollapsed)
defineEmits<{ search: []; clear: [] }>()
</script>

<template>
    <form
        role="search"
        :aria-busy="busy"
        class="mb-5 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm"
        @submit.prevent="!busy && $emit('search')"
    >
        <div class="flex items-center justify-between gap-3 px-4 py-3 sm:px-5" :class="expanded || !collapsible ? 'border-b border-stone-100' : ''">
            <div class="flex items-center gap-2">
                <AppIcon name="search" class="size-4 text-orange-600" />
                <h2 class="text-sm font-semibold text-slate-800">{{ title }}</h2>
                <span v-if="activeCount > 0" class="rounded-full bg-orange-50 px-2 py-0.5 text-xs font-semibold text-orange-700">
                    {{ activeCount }} ativo{{ activeCount === 1 ? '' : 's' }}
                </span>
            </div>
            <div class="flex items-center gap-3">
                <p v-if="collapsible && !expanded" class="hidden text-xs text-slate-500 sm:block">{{ countLabel }}</p>
                <button
                    v-if="collapsible"
                    type="button"
                    class="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-stone-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-500"
                    :aria-expanded="expanded"
                    @click="expanded = !expanded"
                >
                    {{ expanded ? 'Recolher' : 'Expandir filtros' }}
                    <span aria-hidden="true">{{ expanded ? '⌃' : '⌄' }}</span>
                </button>
            </div>
        </div>
        <template v-if="expanded || !collapsible">
            <div class="grid gap-3 px-4 py-4 sm:px-5" :class="columns === 1 ? 'grid-cols-1' : columns === 2 ? 'sm:grid-cols-2' : columns === 3 ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2 lg:grid-cols-4'">
                <slot />
            </div>
            <div class="flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 bg-stone-50/50 px-4 py-3 sm:px-5">
                <p class="text-sm text-slate-500" aria-live="polite">{{ countLabel || 'Filtre os resultados da listagem' }}</p>
                <div class="flex flex-wrap items-center gap-2">
                    <slot name="actions" />
                    <button type="button" class="secondary-button inline-flex w-auto items-center gap-2" :disabled="busy" @click="$emit('clear')">
                        <AppIcon name="clear" class="size-4" /> Limpar filtros
                    </button>
                    <button type="submit" class="primary-button inline-flex w-auto items-center gap-2" :disabled="busy">
                        <AppIcon name="search" class="size-4" /> {{ busy ? 'Buscando…' : 'Buscar' }}
                    </button>
                </div>
            </div>
        </template>
    </form>
</template>
