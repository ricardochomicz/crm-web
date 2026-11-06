<script setup lang="ts">
defineProps<{ message?: string }>()
</script>
<template>
 <p v-if="message" role="alert" class="mt-1 flex items-start gap-1.5 text-xs font-medium text-red-600">
  <span aria-hidden="true" class="mt-px">●</span>{{ message }}
 </p>
</template>
