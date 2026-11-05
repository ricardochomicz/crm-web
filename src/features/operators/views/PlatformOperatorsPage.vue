<script setup lang="ts">
import AppShell from '@/components/layout/AppShell.vue'
import PlatformOperatorsView from './PlatformOperatorsView.vue'
</script>

<template>
  <AppShell title="Catálogo de operadoras" subtitle="Administração da plataforma">
    <p class="eyebrow">ADMINISTRAÇÃO</p>
    <h1 class="mb-8 mt-3 text-3xl font-semibold">Operadoras da plataforma</h1>
    <PlatformOperatorsView />
  </AppShell>
</template>
