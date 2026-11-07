<script setup lang="ts">
import { ref } from 'vue'
import type { CommercialOrderItem } from '../api'

defineProps<{ items: CommercialOrderItem[]; count: number }>()
const expanded = ref(false)
const money = (value: string) => Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
</script>

<template>
    <section class="overflow-hidden rounded-xl border border-stone-200">
        <button type="button" class="flex w-full items-center justify-between gap-3 p-5 text-left hover:bg-stone-50" :aria-expanded="expanded" @click="expanded = !expanded">
            <div>
                <h3 class="font-semibold text-slate-800">Linhas do pedido</h3>
                <p class="mt-1 text-xs text-slate-500">{{ count }} {{ count === 1 ? 'linha negociada' : 'linhas negociadas' }}</p>
            </div>
            <span class="text-sm font-semibold text-orange-700">{{ expanded ? 'Recolher −' : 'Ver linhas +' }}</span>
        </button>
        <div v-if="expanded" class="overflow-x-auto border-t border-stone-200">
            <table class="w-full min-w-[580px] text-left text-sm">
                <thead class="bg-stone-50 text-xs uppercase text-slate-500">
                    <tr><th class="p-3">Linha</th><th class="p-3">Descrição</th><th class="p-3">Quantidade</th><th class="p-3">R$</th><th class="p-3">Status</th><th class="p-3">Ativação</th></tr>
                </thead>
                <tbody>
                    <tr v-for="item in items" :key="item.id" class="border-t border-stone-100">
                        <td class="p-3">{{ item.line_number || '—' }}</td>
                        <td class="p-3">{{ item.description || '—' }}</td>
                        <td class="p-3">{{ item.quantity }}</td>
                        <td class="p-3">{{ money(item.monthly_unit_amount) }}</td>
                        <td class="p-3">{{ item.status === 'ACTIVE' ? 'Ativa' : item.status === 'PENDING' ? 'Pendente' : item.status || '—' }}</td>
                        <td class="p-3">{{ item.activated_at?.slice(0, 10).split('-').reverse().join('/') || '—' }}</td>
                    </tr>
                </tbody>
            </table>
            <p v-if="!items.length" class="p-4 text-sm text-slate-500">Nenhum item registrado.</p>
        </div>
    </section>
</template>
