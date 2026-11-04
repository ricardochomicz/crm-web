<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>
<template>
  <a
    href="#main-content"
    class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:p-3"
    >Pular para o conteúdo</a
  ><RouterView :key="$route.path" />
</template>
